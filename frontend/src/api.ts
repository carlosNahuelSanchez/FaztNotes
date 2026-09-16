import {
  Note,
  NoteCreatePayload,
  NoteUpdatePayload,
  NexoQueryResponse,
  NexoSource,
  HealthStatus
} from './types';

const API_BASE = '/api';

export async function fetchNotes(
  search?: string,
  tag?: string,
  folder?: string | null
): Promise<Note[]> {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (tag && tag.trim()) params.append('tag', tag.trim());
  if (folder !== undefined && folder !== null) params.append('folder', folder);

  const url = `${API_BASE}/notes${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error ${res.status}: Fallo al listar notas.`);
  }
  return res.json();
}

export async function fetchFolders(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/notes/folders`);
  if (!res.ok) {
    throw new Error('Fallo al recuperar lista de carpetas.');
  }
  return res.json();
}

export async function fetchNote(id: string): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes/${id}`);
  if (!res.ok) {
    throw new Error(`Error ${res.status}: Nota con ID '${id}' no encontrada.`);
  }
  return res.json();
}

export async function createNote(payload: NoteCreatePayload): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Fallo al crear nota' }));
    throw new Error(err.detail || 'Fallo al crear la nota');
  }
  return res.json();
}

export async function updateNote(id: string, payload: NoteUpdatePayload): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Fallo al actualizar nota' }));
    throw new Error(err.detail || 'Fallo al actualizar la nota');
  }
  return res.json();
}

export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    throw new Error(`Error ${res.status}: Fallo al eliminar la nota '${id}'.`);
  }
}

export async function fetchTags(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/notes/tags`);
  if (!res.ok) {
    throw new Error('Fallo al recuperar lista de etiquetas.');
  }
  return res.json();
}

export async function queryNexo(query: string, top_k = 4): Promise<NexoQueryResponse> {
  const res = await fetch(`${API_BASE}/nexo/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, top_k })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Fallo al procesar consulta Nexo' }));
    throw new Error(err.detail || 'Fallo al procesar consulta en Nexo');
  }
  return res.json();
}

export function streamNexo(
  query: string,
  top_k: number,
  callbacks: {
    onSources: (sources: NexoSource[]) => void;
    onChunk: (chunkText: string) => void;
    onDone: (latency_ms: number) => void;
    onError: (err: Error) => void;
  }
): () => void {
  const controller = new AbortController();

  const runStream = async () => {
    try {
      const params = new URLSearchParams({
        query: query.trim(),
        top_k: top_k.toString()
      });
      const response = await fetch(`${API_BASE}/nexo/stream?${params.toString()}`, {
        signal: controller.signal
      });

      if (!response.ok || !response.body) {
        throw new Error(`Error HTTP ${response.status} en flujo de streaming`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const eventStr of events) {
          if (!eventStr.trim()) continue;
          const lines = eventStr.split('\n');
          let eventType = 'message';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.replace('event: ', '').trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.replace('data: ', '').trim();
            }
          }

          if (!dataStr) continue;

          try {
            const parsed = JSON.parse(dataStr);
            if (eventType === 'sources') {
              callbacks.onSources(parsed.sources || []);
            } else if (eventType === 'chunk') {
              callbacks.onChunk(parsed.text || '');
            } else if (eventType === 'done') {
              callbacks.onDone(parsed.latency_ms || 0);
            }
          } catch {
            // Raw text fallback
            if (eventType === 'chunk') callbacks.onChunk(dataStr);
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        callbacks.onError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  };

  runStream();

  return () => {
    controller.abort();
  };
}

export async function checkHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error('Servicio degradado o no disponible.');
  }
  return res.json();
}
