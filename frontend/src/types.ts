export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folder?: string | null;
  created_at: string;
  updated_at: string;
  has_embedding: boolean;
}

export interface NoteCreatePayload {
  title: string;
  content: string;
  tags: string[];
  folder?: string | null;
}

export interface NoteUpdatePayload {
  title?: string;
  content?: string;
  tags?: string[];
  folder?: string | null;
}

export interface NexoSource {
  id: string;
  title: string;
  similarity: number;
  content_snippet: string;
}

export interface NexoQueryResponse {
  query: string;
  answer: string;
  sources: NexoSource[];
  latency_ms: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'nexo';
  content: string;
  timestamp: string;
  sources?: NexoSource[];
  latency_ms?: number;
  streaming?: boolean;
}

export interface HealthStatus {
  status: string;
  database: string;
  gemini_configured: boolean;
  total_notes: number;
}
