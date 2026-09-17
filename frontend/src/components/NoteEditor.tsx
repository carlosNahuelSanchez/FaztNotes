import React, { useState, useEffect } from 'react';
import { Note, NoteCreatePayload } from '../types';
import { MarkdownView } from './MarkdownView';
import { MarkdownEditor } from './MarkdownEditor';
import { useI18n } from '../i18n';

// ponytail: Minimalist Markdown note editor with native textarea and instant preview
interface NoteEditorProps {
  note: Note | null;
  initialFolder?: string | null;
  availableFolders?: string[];
  onSave: (payload: NoteCreatePayload, id?: string) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  initialFolder,
  onSave,
  onCancel,
  saving
}) => {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [folder, setFolder] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setFolder(note.folder || '');
      setContent(note.content);
      setTagsInput(note.tags ? note.tags.join(', ') : '');
      setErrorMessage(null);
    } else {
      setTitle('');
      setFolder(initialFolder || '');
      setContent('');
      setTagsInput('');
      setErrorMessage(null);
    }
  }, [note, initialFolder]);

  const handleDiscard = () => {
    if (note) {
      setTitle(note.title);
      setFolder(note.folder || '');
      setContent(note.content);
      setTagsInput(note.tags ? note.tags.join(', ') : '');
    } else {
      setTitle('');
      setFolder(initialFolder || '');
      setContent('');
      setTagsInput('');
    }
    setErrorMessage(null);
    onCancel();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage(t.titleRequired);
      return;
    }
    if (!content.trim()) {
      setErrorMessage(t.contentRequired);
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      setErrorMessage(null);
      await onSave(
        {
          title: title.trim(),
          content: content.trim(),
          tags: parsedTags,
          folder: folder.trim() || null
        },
        note ? note.id : undefined
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save error';
      setErrorMessage(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-nexo-950 border border-nexo-800">
      {/* Editor Header / Toolbars */}
      <div className="p-3 border-b border-nexo-800 bg-nexo-900 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-nexo-100 uppercase">
            {note ? `${t.editNoteTitle} ${note.id.substring(0, 8)}...]` : t.newNoteTitle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border border-nexo-700 bg-nexo-950">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`px-2 py-1 ${
                viewMode === 'edit' ? 'bg-nexo-200 text-black font-bold' : 'text-nexo-400 hover:text-white'
              }`}
            >
              {t.modeEdit}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-2 py-1 ${
                viewMode === 'split' ? 'bg-nexo-200 text-black font-bold' : 'text-nexo-400 hover:text-white'
              }`}
            >
              {t.modeSplit}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-2 py-1 ${
                viewMode === 'preview' ? 'bg-nexo-200 text-black font-bold' : 'text-nexo-400 hover:text-white'
              }`}
            >
              {t.modePreview}
            </button>
          </div>

          <button
            type="button"
            onClick={handleDiscard}
            className="border border-nexo-700 px-3 py-1 text-nexo-400 hover:text-white hover:border-nexo-500"
          >
            {t.discard}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="border border-nexo-accent bg-nexo-accent text-black font-bold px-3 py-1 hover:bg-emerald-400 disabled:opacity-50"
          >
            {saving ? t.savingNote : t.saveNote}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-nexo-alert/20 border-b border-nexo-alert text-nexo-alert p-2 font-mono text-xs">
          [ERROR] {errorMessage}
        </div>
      )}

      {/* Metadata inputs */}
      <div className="p-3 border-b border-nexo-850 space-y-2 bg-nexo-900/50">
        <div>
          <div className="flex justify-between items-center mb-1 font-mono text-[11px]">
            <label className="text-nexo-600 uppercase">
              {t.docTitleLabel}
            </label>
            <span className="text-nexo-500 text-[10px] font-mono">
              {title.length} / 100
            </span>
          </div>
          <input
            type="text"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.docTitlePlaceholder}
            className="w-full bg-nexo-950 border border-nexo-800 px-3 py-1.5 text-sm text-nexo-100 focus:outline-none focus:border-white font-mono"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1 font-mono text-[11px]">
            <label className="text-nexo-600 uppercase">
              {t.folderInputLabel}
            </label>
            <span className="text-nexo-500 text-[10px] font-mono">
              {folder ? `/${folder}` : t.noFolderRoot}
            </span>
          </div>
          <input
            type="text"
            maxLength={100}
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder={t.folderInputPlaceholder}
            className="w-full bg-nexo-950 border border-nexo-800 px-3 py-1 text-xs text-nexo-200 focus:outline-none focus:border-white font-mono"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1 font-mono text-[11px]">
            <label className="text-nexo-600 uppercase">
              {t.tagsInputLabel}
            </label>
            <span className="text-nexo-500 text-[10px] font-mono">
              {tagsInput.length} / 150
            </span>
          </div>
          <input
            type="text"
            maxLength={150}
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="backend, postgres, rag"
            className="w-full bg-nexo-950 border border-nexo-800 px-3 py-1 text-xs text-nexo-200 focus:outline-none focus:border-white font-mono"
          />
        </div>
      </div>

      {/* Editor / Preview Area */}
      <div className="flex-1 flex overflow-hidden">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`flex flex-col ${viewMode === 'split' ? 'w-1/2 border-r border-nexo-800' : 'w-full'}`}>
            <div className="bg-nexo-900 px-3 py-1 border-b border-nexo-850 font-mono text-[10px] text-nexo-600 uppercase flex justify-between items-center">
              <span>{t.contentHeader}</span>
              <span className="text-nexo-500 text-[10px] font-mono">
                {content.length} CHARS (UNLIMITED)
              </span>
            </div>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder={t.editorPlaceholder}
            />
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`flex flex-col ${viewMode === 'split' ? 'w-1/2' : 'w-full'} bg-nexo-950`}>
            <div className="bg-nexo-900 px-3 py-1 border-b border-nexo-850 font-mono text-[10px] text-nexo-600 uppercase">
              {t.previewHeader}
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {content.trim() ? (
                <MarkdownView content={content} />
              ) : (
                <span className="font-mono text-xs text-nexo-700 italic">
                  {t.noPreviewContent}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="px-3 py-1.5 border-t border-nexo-800 bg-nexo-900 flex justify-between items-center font-mono text-[11px] text-nexo-600">
        <span>{t.bytesLength} {content.length} BYTES</span>
        <span>{t.linesCount} {content ? content.split('\n').length : 0} | CHARS: {content.length}</span>
      </div>
    </form>
  );
};
