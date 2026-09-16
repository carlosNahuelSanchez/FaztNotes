import React from 'react';
import { Note } from '../types';
import { useI18n } from '../i18n';

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (note: Note) => void;
  onDeleteNote: (id: string, title: string) => void;
  loading: boolean;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  selectedNoteId,
  onSelectNote,
  onDeleteNote,
  loading
}) => {
  const { lang, t } = useI18n();

  if (loading) {
    return (
      <div className="p-8 text-center font-mono text-fazt-600 text-xs">
        {t.loadingRecords}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-fazt-800 text-fazt-600 font-mono text-xs">
        {t.noNotesFound}
      </div>
    );
  }

  return (
    <div className="divide-y divide-fazt-850 overflow-y-auto max-h-[calc(100vh-210px)]">
      {notes.map((note) => {
        const isSelected = selectedNoteId === note.id;
        const formattedDate = new Date(note.updated_at).toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        return (
          <div
            key={note.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', note.id);
              e.dataTransfer.setData('application/fazt-item', JSON.stringify({ type: 'note', id: note.id }));
              e.dataTransfer.effectAllowed = 'move';
            }}
            onClick={() => onSelectNote(note)}
            className={`p-3 cursor-grab active:cursor-grabbing transition-colors text-xs font-mono border-l-2 ${
              isSelected
                ? 'bg-fazt-900 border-white text-white'
                : 'bg-fazt-950 border-transparent text-fazt-400 hover:bg-fazt-900 hover:text-fazt-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 truncate flex-1">
                {note.folder && (
                  <span className="text-zinc-500 text-[10px] bg-zinc-900 border border-zinc-800 px-1">
                    /{note.folder}
                  </span>
                )}
                <span className="font-bold text-sm text-fazt-100 truncate">
                  {note.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`px-1 py-0.2 text-[10px] uppercase border ${
                    note.has_embedding
                      ? 'border-fazt-accent/40 text-fazt-accent bg-fazt-accent/10'
                      : 'border-fazt-600 text-fazt-600 bg-fazt-900'
                  }`}
                >
                  {note.has_embedding ? t.vectStatus : t.noVectStatus}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNote(note.id, note.title);
                  }}
                  className="px-1.5 py-0.5 text-[10px] text-fazt-alert border border-fazt-alert/40 hover:bg-fazt-alert hover:text-black transition-colors"
                  title={t.deleteShort}
                >
                  {t.deleteShort}
                </button>
              </div>
            </div>

            <p className="text-fazt-400 line-clamp-2 mb-2 font-sans text-xs">
              {note.content}
            </p>

            <div className="flex items-center justify-between text-[11px] text-fazt-600">
              <div className="flex flex-wrap gap-1">
                {note.tags && note.tags.length > 0 ? (
                  note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="border border-fazt-800 bg-fazt-900 px-1 py-0.2 text-fazt-400 text-[10px]"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-fazt-700 italic">{t.noTags}</span>
                )}
              </div>
              <span className="text-fazt-600 shrink-0">{formattedDate}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
