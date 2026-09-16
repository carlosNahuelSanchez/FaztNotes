import {
  Note,
  NoteCreatePayload,
  NoteUpdatePayload,
  NexoQueryResponse,
  HealthStatus
} from './types';

const API_BASE = '/api';

export async function fetchNotes(search?: string, tag?: string): Promise<Note[]> {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (tag && tag.trim()) params.append('tag', tag.trim());

  const url = `${API_BASE}/notes${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error ${res.status}: Fallo al listar notas.`);
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

export async function checkHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error('Servicio degradado o no disponible.');
  }
  return res.json();
}
