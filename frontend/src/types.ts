export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folder?: string | null;
  created_at: string;
  updated_at: string;
  has_embedding: boolean;
  embedding_error?: string | null;
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

export interface NoteImportResult {
  success: boolean;
  imported_count: number;
  notes: Note[];
  note?: Note | null;
  warnings: string[];
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

export interface FolderStat { folder: string; count: number; }
export interface TagStat { tag: string; count: number; }
export interface ActivityNote { id: string; title: string; folder?: string | null; tags?: string[]; }
export interface ActivityStat { date: string; count: number; notes?: ActivityNote[]; }

export interface SystemStatsData {
  total_notes: number;
  total_with_embedding: number;
  embedding_coverage_pct: number;
  total_folders: number;
  total_tags: number;
  notes_by_folder: FolderStat[];
  notes_by_tag: TagStat[];
  recent_activity: ActivityStat[];
}
