import React, { useState, useEffect } from 'react';
import { Note, NoteCreatePayload } from '../types';
import { MarkdownView } from './MarkdownView';
import { MarkdownEditor } from './MarkdownEditor';

interface NoteEditorProps {
  note: Note | null;
  availableFolders: string[];
  onSave: (payload: NoteCreatePayload, id?: string) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  availableFolders,
  onSave,
  onCancel,
  saving
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [folderInput, setFolderInput] = useState('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTagsInput(note.tags ? note.tags.join(', ') : '');
      setFolderInput(note.folder || '');
      setErrorMessage(null);
    } else {
      setTitle('');
      setContent('');
      setTagsInput('');
      setFolderInput('');
      setErrorMessage(null);
    }
  }, [note]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('El campo TITULO es obligatorio.');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('El campo CONTENIDO es obligatorio.');
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      setErrorMessage(null);
      await onSave(
        {
          title: title.trim(),
          content: content.trim(),
          tags: parsedTags,
          folder: folderInput.trim() || null
        },
        note ? note.id : undefined
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al guardar';
      setErrorMessage(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-fazt-950 border border-fazt-800">
      {/* Editor Header / Toolbars */}
      <div className="p-3 border-b border-fazt-800 bg-fazt-900 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-fazt-100 uppercase">
            {note ? `[EDITAR NOTA: ${note.id.substring(0, 8)}...]` : '[NUEVA NOTA]'}
          </span>
          {note && (
            <span
              className={`px-1.5 py-0.5 text-[10px] border uppercase ${
                note.has_embedding
                  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20'
                  : 'border-fazt-600 text-fazt-500'
              }`}
            >
              {note.has_embedding ? 'VECTORIZADA' : 'SIN VECTOR'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border border-fazt-700 bg-fazt-950">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`px-2 py-1 ${
                viewMode === 'edit' ? 'bg-fazt-200 text-black font-bold' : 'text-fazt-400 hover:text-white'
              }`}
            >
              EDICION
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-2 py-1 ${
                viewMode === 'split' ? 'bg-fazt-200 text-black font-bold' : 'text-fazt-400 hover:text-white'
              }`}
            >
              DIVIDIDO
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-2 py-1 ${
                viewMode === 'preview' ? 'bg-fazt-200 text-black font-bold' : 'text-fazt-400 hover:text-white'
              }`}
            >
              VISTA PREVIA
            </button>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="border border-fazt-700 px-3 py-1 text-fazt-400 hover:text-white hover:border-fazt-500"
          >
            DESCARTAR
          </button>

          <button
            type="submit"
            disabled={saving}
            className="border border-fazt-accent bg-fazt-accent text-black font-bold px-3 py-1 hover:bg-emerald-400 disabled:opacity-50"
          >
            {saving ? '[GUARDANDO Y VECTORIZANDO...]' : '[GUARDAR NOTA]'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-fazt-alert/20 border-b border-fazt-alert text-fazt-alert p-2 font-mono text-xs">
          [ERROR] {errorMessage}
        </div>
      )}

      {/* Metadata inputs */}
      <div className="p-3 border-b border-fazt-850 space-y-2 bg-fazt-900/50">
        <div>
          <label className="block font-mono text-[11px] text-fazt-600 uppercase mb-1">
            TITULO DEL DOCUMENTO:
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ejemplo: Arquitectura de Pipelines RAG"
            className="w-full bg-fazt-950 border border-fazt-800 px-3 py-1.5 text-sm text-fazt-100 focus:outline-none focus:border-white font-mono"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label className="block font-mono text-[11px] text-fazt-600 uppercase mb-1">
              ETIQUETAS TECNICAS (SEPARADAS POR COMA):
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="backend, postgres, rag"
              className="w-full bg-fazt-950 border border-fazt-800 px-3 py-1 text-xs text-fazt-200 focus:outline-none focus:border-white font-mono"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] text-fazt-600 uppercase mb-1">
              CARPETA / DIRECTORIO:
            </label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                list="folders-list"
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                placeholder="Raiz (o escribe una nueva carpeta)"
                className="w-full bg-fazt-950 border border-fazt-800 px-3 py-1 text-xs text-fazt-200 focus:outline-none focus:border-white font-mono"
              />
              <datalist id="folders-list">
                {availableFolders.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>
          </div>
        </div>
      </div>

      {/* Editor / Preview Area */}
      <div className="flex-1 flex overflow-hidden">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`flex flex-col ${viewMode === 'split' ? 'w-1/2 border-r border-fazt-800' : 'w-full'}`}>
            <div className="bg-fazt-900 px-3 py-1 border-b border-fazt-850 font-mono text-[10px] text-fazt-600 uppercase">
              CONTENIDO (MARKDOWN)
            </div>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="Escriba el cuerpo en Markdown. Use # para encabezados, `codigo`, etc."
            />
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`flex flex-col ${viewMode === 'split' ? 'w-1/2' : 'w-full'} bg-fazt-950`}>
            <div className="bg-fazt-900 px-3 py-1 border-b border-fazt-850 font-mono text-[10px] text-fazt-600 uppercase">
              RENDERIZADO TECNICO
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {content.trim() ? (
                <MarkdownView content={content} />
              ) : (
                <span className="font-mono text-xs text-fazt-700 italic">
                  [Sin contenido para previsualizar]
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="px-3 py-1.5 border-t border-fazt-800 bg-fazt-900 flex justify-between items-center font-mono text-[11px] text-fazt-600">
        <span>LONGITUD: {content.length} BYTES</span>
        <span>LINEAS: {content ? content.split('\n').length : 0}</span>
      </div>
    </form>
  );
};
