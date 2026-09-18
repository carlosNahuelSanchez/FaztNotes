"""
NexoNotes MCP Server — Expose knowledge base as MCP tools.
Run standalone: python -m app.mcp_server
"""
import os
import logging
import anyio
import uvicorn
from starlette.applications import Starlette
from starlette.routing import Mount
from starlette.responses import Response
from mcp.server.fastmcp import FastMCP
from mcp.server.fastmcp.server import StreamableHTTPASGIApp
from mcp.server.sse import SseServerTransport
from mcp.server.transport_security import TransportSecuritySettings
from sqlalchemy import select, or_
from app.database import SessionLocal, init_db
from app.models import Note
from app.services.rag import retrieve_similar_notes, sync_note_embedding, execute_nexo_rag

logger = logging.getLogger("nexonotes.mcp")

# ponytail: Disable DNS rebinding check for seamless local & container network connectivity
mcp = FastMCP(
    "NexoNotes",
    instructions="NexoNotes local RAG knowledge base. Search, read, create notes, and query the Nexo AI assistant.",
    host=os.getenv("FASTMCP_HOST", "0.0.0.0"),
    port=int(os.getenv("FASTMCP_PORT", "8781")),
    transport_security=TransportSecuritySettings(enable_dns_rebinding_protection=False),
)


@mcp.tool()
def search_notes(query: str, top_k: int = 4) -> str:
    """Semantic search across all notes using pgvector embeddings. Returns most relevant notes with similarity scores."""
    db = SessionLocal()
    try:
        results = retrieve_similar_notes(db, query, top_k=top_k)
        if not results:
            return "No matching notes found."
        parts = []
        for note, sim in results:
            parts.append(
                f"[{sim:.0%} match] {note.title} (ID: {note.id})\n"
                f"  Folder: {note.folder or '/'}\n"
                f"  Tags: {', '.join(note.tags) if note.tags else 'none'}\n"
                f"  Snippet: {note.content[:500]}"
            )
        return "\n---\n".join(parts)
    finally:
        db.close()


@mcp.tool()
def get_note(note_id: str) -> str:
    """Get the full Markdown content of a note by its ID."""
    db = SessionLocal()
    try:
        note = db.get(Note, note_id)
        if not note:
            return f"Note '{note_id}' not found."
        tags = ", ".join(note.tags) if note.tags else "none"
        return (
            f"# {note.title}\n"
            f"**Folder:** {note.folder or '/'} | **Tags:** {tags}\n"
            f"**Created:** {note.created_at} | **Updated:** {note.updated_at}\n\n"
            f"{note.content}"
        )
    finally:
        db.close()


@mcp.tool()
def list_notes(folder: str | None = None, tag: str | None = None) -> str:
    """List notes optionally filtered by folder path or tag. Up to 50 results."""
    db = SessionLocal()
    try:
        stmt = select(Note)
        if folder:
            stmt = stmt.where(or_(Note.folder == folder, Note.folder.like(f"{folder}/%")))
        if tag:
            stmt = stmt.where(Note.tags.contains([tag]))
        stmt = stmt.order_by(Note.updated_at.desc()).limit(50)
        notes = db.execute(stmt).scalars().all()
        if not notes:
            return "No notes found."
        lines = [
            f"- {n.title} (ID: {n.id}) [{n.folder or '/'}] tags={','.join(n.tags) if n.tags else 'none'}"
            for n in notes
        ]
        return f"{len(notes)} notes:\n" + "\n".join(lines)
    finally:
        db.close()


@mcp.tool()
def create_note(title: str, content: str, folder: str | None = None, tags: str = "") -> str:
    """Create a new note. Tags as comma-separated string. Auto-vectorized for RAG."""
    db = SessionLocal()
    try:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
        note = Note(
            title=title.strip(),
            content=content.strip(),
            tags=tag_list,
            folder=folder.strip() if folder else None,
        )
        db.add(note)
        db.commit()
        db.refresh(note)
        ok, err = sync_note_embedding(db, note)
        status = "vectorized" if ok else f"saved (embedding failed: {err})"
        return f"Created '{note.title}' (ID: {note.id}) — {status}"
    finally:
        db.close()


@mcp.tool()
def list_folders() -> str:
    """List all folders in the knowledge base."""
    db = SessionLocal()
    try:
        stmt = select(Note.folder).distinct()
        results = db.execute(stmt).scalars().all()
        folders = sorted(f for f in results if f and f.strip())
        if not folders:
            return "No folders (all notes at root)."
        return "\n".join(f"/{f}" for f in folders)
    finally:
        db.close()


@mcp.tool()
def ask_nexo(question: str, top_k: int = 4) -> str:
    """Ask Nexo AI a question. Uses RAG to retrieve relevant notes and generate a cited answer."""
    db = SessionLocal()
    try:
        result = execute_nexo_rag(db, question, top_k=top_k)
        sources = "\n".join(
            f"  - {s.title} ({s.similarity:.0%} relevance)" for s in result.sources
        )
        return f"{result.answer}\n\n--- Sources ---\n{sources}\n[Latency: {result.latency_ms:.0f}ms]"
    finally:
        db.close()


def create_dual_app() -> Starlette:
    # ponytail: Dual-transport ASGI application supporting both:
    # 1. Legacy SSE (GET /sse + POST /messages/) for Cursor, Claude Desktop, Windsurf
    # 2. Modern Streamable HTTP (POST /sse, POST /mcp, POST /) for Antigravity, Gemini CLI
    # This prevents '405 Method Not Allowed' when modern clients send POST to /sse for initialize.
    _ = mcp.streamable_http_app()
    streamable_handler = StreamableHTTPASGIApp(mcp.session_manager)
    sse_transport = SseServerTransport(
        "/messages/",
        security_settings=TransportSecuritySettings(enable_dns_rebinding_protection=False),
    )

    async def handle_legacy_sse(scope, receive, send):
        async with sse_transport.connect_sse(scope, receive, send) as streams:
            await mcp._mcp_server.run(
                streams[0], streams[1], mcp._mcp_server.create_initialization_options()
            )

    class CombinedASGIApp:
        async def __call__(self, scope, receive, send):
            if scope.get("type") == "http":
                path = scope.get("path", "")
                method = scope.get("method", "")

                # Handle CORS Preflight
                if method == "OPTIONS":
                    cors_resp = Response(
                        status_code=204,
                        headers={
                            "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
                            "Access-Control-Allow-Headers": "*",
                        },
                    )
                    await cors_resp(scope, receive, send)
                    return

                # ponytail: Normalize headers to prevent false 406 Not Acceptable or 400 Content-Type rejections
                headers_list = list(scope.get("headers", []))
                headers_dict = {k.lower(): v for k, v in headers_list}
                has_session = b"mcp-session-id" in headers_dict

                # Ensure Accept header includes application/json and text/event-stream
                accept_val = headers_dict.get(b"accept", b"")
                if not accept_val or accept_val == b"*/*":
                    headers_list = [(k, v) for k, v in headers_list if k.lower() != b"accept"]
                    headers_list.append((b"accept", b"application/json, text/event-stream"))

                if method == "POST":
                    ct = headers_dict.get(b"content-type", b"")
                    if not ct or not ct.lower().startswith(b"application/json"):
                        headers_list = [(k, v) for k, v in headers_list if k.lower() != b"content-type"]
                        headers_list.append((b"content-type", b"application/json"))

                scope["headers"] = headers_list

                # Route:
                # - GET /sse without session -> Legacy SSE
                # - /messages/* -> Legacy SSE message receiver
                # - Everything else (POST /sse, GET /sse with session, /mcp, /) -> Streamable HTTP
                if path == "/sse" and method == "GET" and not has_session:
                    await handle_legacy_sse(scope, receive, send)
                elif path.startswith("/messages"):
                    await sse_transport.handle_post_message(scope, receive, send)
                else:
                    await streamable_handler(scope, receive, send)
            else:
                await streamable_handler(scope, receive, send)

    return Starlette(
        routes=[Mount("/", app=CombinedASGIApp())],
        lifespan=lambda app: mcp.session_manager.run(),
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    logger.info("[NEXONOTES-MCP] MCP dual-transport server starting (SSE + Streamable HTTP)...")
    app = create_dual_app()
    host = os.getenv("FASTMCP_HOST", "0.0.0.0")
    port = int(os.getenv("FASTMCP_PORT", "8781"))
    config = uvicorn.Config(
        app,
        host=host,
        port=port,
        log_level="info",
    )
    server = uvicorn.Server(config)
    anyio.run(server.serve)

