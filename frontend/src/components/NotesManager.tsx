// ponytail: 2-panel IDE layout (VS Code style explorer on left, full Markdown reading/editing on right)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Note, NoteCreatePayload } from '../types';
import {
  fetchNotes,
  fetchTags,
  fetchFolders,
  createNote,
  updateNote,
  deleteNote,
  importNoteFile,
  getExportNoteUrl,
  getExportFolderUrl,
  triggerDownload
} from '../api';
import { FolderTree } from './FolderTree';
import { NoteEditor } from './NoteEditor';
import { MarkdownView } from './MarkdownView';
import { FileCodeIcon, EditIcon, AlertTriangleIcon, TerminalIcon, UploadIcon, DownloadIcon } from './CyberIcons';
import { useI18n } from '../i18n';

interface NotesManagerProps {
  onDataChanged: () => void;
}

export const NotesManager: React.FC<NotesManagerProps> = ({ onDataChanged }) => {
  const { t } = useI18n();
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [targetFolderForNewNote, setTargetFolderForNewNote] = useState<string | null>(null);
  const [, setLoading] = useState(true);
  const emptyStateFileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [notesData, tagsData, foldersData] = await Promise.all([
        fetchNotes(undefined, selectedTag || undefined, undefined),
        fetchTags(),
        fetchFolders()
      ]);
      setNotes(notesData);
      setTags(tagsData);

      // Merge backend folders with custom created folders so empty folders remain visible
      const combinedFolders = Array.from(new Set([...foldersData, ...customFolders])).sort();
      setFolders(combinedFolders);

      if (selectedNote) {
        const found = notesData.find((n) => n.id === selectedNote.id);
        if (found) setSelectedNote(found);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.errorLoading;
      setSystemError(msg);
      setStatusMessage(`[ERROR] ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [selectedTag, selectedNote, customFolders, t.errorLoading]);

  useEffect(() => {
    loadData();
  }, [selectedTag]);

  // Save handler: saves to database and checks for embedding / Gemini errors
  const handleSaveNote = async (payload: NoteCreatePayload, id?: string) => {
    setSaving(true);
    setStatusMessage(null);
    setSystemError(null);
    try {
      let saved: Note;
      if (id) {
        saved = await updateNote(id, payload);
      } else {
        saved = await createNote(payload);
      }

      // If backend reports Gemini vectorization failed, show explicit red error banner
      if (saved.embedding_error) {
        setSystemError(saved.embedding_error);
        setStatusMessage(
          t.noteVectorFailed
            ? t.noteVectorFailed.replace('{title}', saved.title).replace('{error}', saved.embedding_error)
            : `[ERROR] Falló la vectorización: ${saved.embedding_error}`
        );
      } else {
        setSystemError(null);
        setStatusMessage(
          id
            ? t.noteSavedOk.replace('{title}', saved.title)
            : t.noteCreatedOk.replace('{title}', saved.title)
        );
      }

      // Automatically exit editing mode and view the full note in Markdown
      setSelectedNote(saved);
      setIsEditing(false);
      setTargetFolderForNewNote(null);
      await loadData();
      onDataChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.errorProcessing;
      setSystemError(msg);
      setStatusMessage(`[FAIL] ${msg}`);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleExportNote = (note: Note) => {
    const url = getExportNoteUrl(note.id);
    triggerDownload(url);
    setStatusMessage(`[OK] Descargando nota '${note.title}.md'...`);
  };

  const handleExportFolder = (folder: string | null) => {
    const url = getExportFolderUrl(folder);
    triggerDownload(url);
    const target = folder ? `/${folder}` : 'workspace completo';
    setStatusMessage(`[OK] Generando archivo ZIP para ${target}...`);
  };

  const handleImportFile = async (file: File, folderTarget?: string | null) => {
    setStatusMessage(t.importingFile);
    setSystemError(null);
    setImportWarnings([]);
    try {
      const res = await importNoteFile(file, folderTarget || null);
      if (res.warnings && res.warnings.length > 0) {
        setImportWarnings(res.warnings);
      }
      if (res.notes && res.notes.length > 0) {
        const first = res.notes[0];
        setSelectedNote(first);
        if (first.embedding_error) {
          setSystemError(first.embedding_error);
        } else {
          setSystemError(null);
        }
        if (res.imported_count > 1) {
          setStatusMessage(t.importZipSuccess.replace('{count}', String(res.imported_count)));
        } else {
          setStatusMessage(t.importSuccess.replace('{title}', first.title));
        }
      } else if (!res.success) {
        setStatusMessage('[ADVERTENCIA] No se pudo importar ninguna nota. Revisa los archivos descartados.');
      }
      setIsEditing(false);
      setTargetFolderForNewNote(null);
      await loadData();
      onDataChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al importar documento';
      setSystemError(msg);
      setStatusMessage(`[FAIL] ${msg}`);
    }
  };

  const handleDropNoteOnFolder = async (noteId: string, folderTarget: string | null) => {
    try {
      const targetDisplay = folderTarget ? `/${folderTarget}` : 'root';
      await updateNote(noteId, { folder: folderTarget });
      setStatusMessage(t.noteTransferred.replace('{target}', targetDisplay));
      await loadData();
      onDataChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.errorMoving;
      setSystemError(msg);
      setStatusMessage(`[FAIL] ${msg}`);
    }
  };

  const handleMoveFolder = async (sourceFolder: string, targetFolder: string | null) => {
    if (targetFolder === sourceFolder || (targetFolder && targetFolder.startsWith(`${sourceFolder}/`))) {
      setStatusMessage(`[FAIL] No se puede mover '/${sourceFolder}' dentro de sí misma.`);
      return;
    }

    const folderName = sourceFolder.split('/').pop() || sourceFolder;
    const newSourcePath = targetFolder ? `${targetFolder}/${folderName}` : folderName;

    if (newSourcePath === sourceFolder) return;

    try {
      const affectedNotes = notes.filter(
        (n) => n.folder === sourceFolder || (n.folder && n.folder.startsWith(`${sourceFolder}/`))
      );

      await Promise.all(
        affectedNotes.map((note) => {
          let updatedFolder = newSourcePath;
          if (note.folder && note.folder.startsWith(`${sourceFolder}/`)) {
            const subPath = note.folder.substring(sourceFolder.length + 1);
            updatedFolder = `${newSourcePath}/${subPath}`;
          }
          return updateNote(note.id, { folder: updatedFolder });
        })
      );

      setCustomFolders((prev) => {
        const updated = prev.map((f) => {
          if (f === sourceFolder) return newSourcePath;
          if (f.startsWith(`${sourceFolder}/`)) {
            const sub = f.substring(sourceFolder.length + 1);
            return `${newSourcePath}/${sub}`;
          }
          return f;
        });
        if (!updated.includes(newSourcePath)) updated.push(newSourcePath);
        return Array.from(new Set(updated)).sort();
      });

      const targetDisplay = targetFolder ? `/${targetFolder}` : 'root';
      setStatusMessage(`[SISTEMA] Carpeta '/${sourceFolder}' movida a '${targetDisplay}'`);
      await loadData();
      onDataChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al mover carpeta';
      setSystemError(msg);
      setStatusMessage(`[FAIL] ${msg}`);
    }
  };

  const handleCreateFolder = (newFolder: string) => {
    const cleanFolder = newFolder.trim();
    if (!cleanFolder) return;

    setCustomFolders((prev) => Array.from(new Set([...prev, cleanFolder])).sort());
    setFolders((prev) => Array.from(new Set([...prev, cleanFolder])).sort());
    setStatusMessage(t.folderCreated.replace('{folder}', cleanFolder));
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteNote(deleteConfirm.id);
      setStatusMessage(t.recordPurged.replace('{id}', deleteConfirm.id));
      if (selectedNote?.id === deleteConfirm.id) {
        setSelectedNote(null);
        setIsEditing(false);
      }
      setDeleteConfirm(null);
      await loadData();
      onDataChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.errorDeleting;
      setSystemError(msg);
      setStatusMessage(`[FAIL] ${msg}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-nexo-950">
      {/* Optional Tag Filter Strip */}
      {tags.length > 0 && (
        <div className="border-b border-nexo-850 bg-nexo-950 px-3 py-1.5 flex items-center gap-2 overflow-x-auto font-mono text-xs shrink-0">
          <span className="text-nexo-600 text-[10px] uppercase shrink-0">{t.tagsLabel}</span>
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={`px-2 py-0.5 text-[11px] border transition-colors ${
              selectedTag === null
                ? 'border-white bg-white text-black font-bold'
                : 'border-nexo-800 text-nexo-400 hover:text-white'
            }`}
          >
            {t.allTags}
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-2 py-0.5 text-[11px] border transition-colors ${
                selectedTag === tag
                  ? 'border-white bg-white text-black font-bold'
                  : 'border-nexo-800 text-nexo-400 hover:text-white'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Global Status Banner (subtle feedback) */}
      {statusMessage && !systemError && (
        <div className="bg-nexo-900 border-b border-nexo-800 px-3 py-1 font-mono text-[11px] text-nexo-300 flex justify-between items-center shrink-0">
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-nexo-500 hover:text-white text-xs px-1 font-mono"
          >
            [X]
          </button>
        </div>
      )}

      {/* Discarded Files Warning Banner (ZIP / Import verification) */}
      {importWarnings.length > 0 && (
        <div className="bg-amber-950/90 border-2 border-amber-500 text-amber-100 p-3 m-3 mb-0 font-mono text-xs rounded-sm shadow-xl flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1.5 flex-1">
            <div className="font-bold text-amber-300 text-xs uppercase flex items-center gap-1.5">
              <AlertTriangleIcon className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t.importWarningsTitle}</span>
            </div>
            <ul className="list-disc pl-5 text-amber-200 text-[11px] space-y-1 max-h-36 overflow-y-auto">
              {importWarnings.map((warn, idx) => (
                <li key={idx}>{warn}</li>
              ))}
            </ul>
            <div className="text-[10px] text-amber-400/90 pt-0.5 font-mono">
              {t.importFileTypes}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setImportWarnings([])}
            className="text-amber-400 hover:text-white border border-amber-700 px-2 py-0.5 text-xs shrink-0 font-mono"
          >
            [X]
          </button>
        </div>
      )}

      {/* 2-Panel IDE Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: IDE Explorer (VS Code style file tree) */}
        <div className="w-72 md:w-80 shrink-0 h-full overflow-hidden flex flex-col bg-nexo-950">
          <FolderTree
            notes={notes}
            folders={folders}
            selectedNoteId={selectedNote?.id || null}
            onSelectNote={(note) => {
              setSelectedNote(note);
              setIsEditing(false);
              setSystemError(note.embedding_error || null);
            }}
            onDeleteNote={(id, title) => setDeleteConfirm({ id, title })}
            onCreateFolder={handleCreateFolder}
            onCreateNote={(folder) => {
              setSelectedNote(null);
              setTargetFolderForNewNote(folder || null);
              setIsEditing(true);
            }}
            onImportFile={handleImportFile}
            onExportFolder={handleExportFolder}
            onExportNote={handleExportNote}
            onDropNoteOnFolder={handleDropNoteOnFolder}
            onMoveFolder={handleMoveFolder}
          />
        </div>

        {/* Right Panel: Note Viewer / Editor Area */}
        <div className="flex-1 h-full overflow-hidden flex flex-col bg-nexo-950">
          {isEditing ? (
            /* Editing / Creating Mode */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {systemError && (
                <div className="bg-red-950/90 border-2 border-red-500 text-red-100 p-3 m-3 mb-0 font-mono text-xs rounded-sm shadow-xl flex items-start justify-between gap-3 shrink-0">
                  <div className="space-y-1 flex-1">
                    <div className="font-bold text-red-300 text-xs uppercase flex items-center gap-1.5">
                      <AlertTriangleIcon className="w-4 h-4 text-red-400 shrink-0" />
                      <span>[ERROR DE VECTORIZACIÓN / GEMINI]</span>
                    </div>
                    <pre className="bg-black/80 border border-red-800 p-2 text-red-300 text-[11px] whitespace-pre-wrap select-all font-mono">
                      {systemError}
                    </pre>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemError(null)}
                    className="text-red-400 hover:text-white border border-red-700 px-2 py-0.5 text-xs shrink-0 font-mono"
                  >
                    [X]
                  </button>
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <NoteEditor
                  note={selectedNote}
                  initialFolder={targetFolderForNewNote}
                  availableFolders={folders}
                  onSave={handleSaveNote}
                  onCancel={() => {
                    setIsEditing(false);
                  }}
                  saving={saving}
                />
              </div>
            </div>
          ) : selectedNote ? (
            /* Full Markdown Reading Mode */
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-nexo-950">
              {/* Note Header / Actions */}
              <div className="p-3 border-b border-nexo-800 bg-nexo-900 flex flex-wrap items-center justify-between gap-3 font-mono text-xs shrink-0">
                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                  <FileCodeIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-nexo-100 text-sm truncate">
                    {selectedNote.title}.md
                  </span>
                  <span className="text-[10px] text-zinc-400 bg-nexo-950 px-1.5 py-0.5 border border-nexo-800 shrink-0">
                    /{selectedNote.folder || t.noFolderRoot}
                  </span>
                  {selectedNote.tags && selectedNote.tags.length > 0 && (
                    <div className="hidden md:flex items-center gap-1 overflow-hidden">
                      {selectedNote.tags.map((tag) => (
                        <span key={tag} className="text-[10px] text-nexo-400 bg-nexo-950 px-1 border border-nexo-850 truncate">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleExportNote(selectedNote)}
                    className="border border-cyan-500/60 bg-cyan-950/30 text-cyan-300 font-bold px-3 py-1 text-xs hover:bg-cyan-500 hover:text-black transition-colors flex items-center gap-1.5"
                    title="Exportar archivo Markdown (.md)"
                  >
                    <DownloadIcon className="w-3.5 h-3.5" />
                    <span>{t.exportNote}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="border border-nexo-accent bg-nexo-accent text-black font-bold px-3 py-1 text-xs hover:bg-emerald-400 transition-colors flex items-center gap-1.5"
                  >
                    <EditIcon className="w-3.5 h-3.5" />
                    <span>{t.btnEditNote}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm({ id: selectedNote.id, title: selectedNote.title })}
                    className="border border-nexo-alert/60 text-nexo-alert px-2.5 py-1 text-xs hover:bg-nexo-alert hover:text-black transition-colors"
                  >
                    {t.btnDeleteNote}
                  </button>
                </div>
              </div>

              {/* Explicit Red System Error Banner if Gemini embedding failed */}
              {systemError && (
                <div className="bg-red-950/90 border-2 border-red-500 text-red-100 p-3.5 m-4 mb-0 font-mono text-xs rounded-sm shadow-xl flex items-start justify-between gap-3 shrink-0">
                  <div className="space-y-1 flex-1">
                    <div className="font-bold text-red-300 text-xs uppercase flex items-center gap-1.5">
                      <AlertTriangleIcon className="w-4 h-4 text-red-400 shrink-0" />
                      <span>[ERROR DE VECTORIZACIÓN / GEMINI]</span>
                    </div>
                    <p className="text-red-200 text-[11px]">
                      La nota está guardada en la base de datos, pero falló la vectorización con Gemini:
                    </p>
                    <pre className="bg-black/80 border border-red-800 p-2 text-red-300 text-[11px] whitespace-pre-wrap select-all font-mono overflow-x-auto">
                      {systemError}
                    </pre>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemError(null)}
                    className="text-red-400 hover:text-white border border-red-700 px-2 py-0.5 text-xs shrink-0 font-mono"
                  >
                    [X]
                  </button>
                </div>
              )}

              {/* Full Markdown Render Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-nexo-950">
                <div className="max-w-4xl mx-auto font-sans">
                  <MarkdownView content={selectedNote.content} />
                </div>
              </div>

              {/* Note Footer Metadata */}
              <div className="px-4 py-2 border-t border-nexo-800 bg-nexo-900 flex flex-wrap justify-between items-center font-mono text-[11px] text-nexo-600 gap-2 shrink-0">
                <span>
                  {t.updatedLabel} {new Date(selectedNote.updated_at).toLocaleString()}
                </span>
                <div className="flex items-center gap-3">
                  <span>{selectedNote.content.length} BYTES</span>
                  <span>{selectedNote.content.split('\n').length} LÍNEAS</span>
                  <span className="text-nexo-700">ID: {selectedNote.id}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Clean Empty Workspace State */
            <div className="flex-1 flex flex-col items-center justify-center bg-nexo-950 p-6 text-center font-mono">
              <div className="max-w-md border border-nexo-800 bg-nexo-900/40 p-8 space-y-4">
                <div className="flex items-center justify-center gap-2 text-emerald-400">
                  <TerminalIcon className="w-5 h-5 animate-pulse" />
                  <span className="font-bold text-sm tracking-wider uppercase text-nexo-100">
                    {t.noNoteSelectedTitle}
                  </span>
                </div>
                <p className="text-xs text-nexo-400 leading-relaxed">
                  {t.noNoteSelectedHint}
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNote(null);
                      setTargetFolderForNewNote(null);
                      setIsEditing(true);
                    }}
                    className="border border-nexo-accent bg-nexo-accent text-black font-bold px-4 py-1.5 text-xs hover:bg-emerald-400 transition-colors inline-flex items-center gap-1.5"
                  >
                    <TerminalIcon className="w-3.5 h-3.5" />
                    <span>{t.createNewAction}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => emptyStateFileRef.current?.click()}
                    className="border border-nexo-700 bg-nexo-900 text-nexo-200 hover:text-white hover:border-emerald-500 font-bold px-4 py-1.5 text-xs transition-colors inline-flex items-center gap-1.5"
                    title={t.importHint}
                  >
                    <UploadIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.importAction}</span>
                  </button>
                  <input
                    type="file"
                    ref={emptyStateFileRef}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImportFile(f, null);
                    }}
                    accept=".md,.markdown,.txt,.pdf,.docx,.doc,.pptx,.xlsx,.html,.zip"
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Permanent Deletion Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-nexo-900 border-2 border-nexo-alert p-5 max-w-md w-full font-mono">
            <div className="text-nexo-alert font-bold text-sm mb-3 uppercase tracking-wider">
              {t.deleteTitle}
            </div>
            <div className="text-xs text-nexo-200 mb-4 space-y-2">
              <p>{t.deleteWarning}</p>
              <div className="bg-nexo-950 p-2 border border-nexo-800">
                <div><span className="text-nexo-600">ID:</span> {deleteConfirm.id}</div>
                <div><span className="text-nexo-600">TITULO:</span> {deleteConfirm.title}</div>
              </div>
            </div>
            <div className="flex justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="border border-nexo-700 px-4 py-1.5 text-nexo-300 hover:text-white"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="border border-nexo-alert bg-nexo-alert text-black font-bold px-4 py-1.5 hover:bg-red-500"
              >
                {t.executePurge}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
