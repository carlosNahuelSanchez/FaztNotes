// ponytail: 2-panel IDE layout (VS Code style explorer on left, full Markdown reading/editing on right)
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Note, NoteCreatePayload } from '../types';
import {
  fetchNotes,
  fetchTags,
  fetchFolders,
  createNote,
  updateNote,
  deleteNote,
  deleteFolder,
  renameFolderInBackend,
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

const GLYPHS = "!<>-_\\/[]{}—=+*^?#_$%&01";

export const NotesManager: React.FC<NotesManagerProps> = ({ onDataChanged }) => {
  const { t } = useI18n();
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<{
    type: 'note' | 'folder';
    data?: Note;
    path?: string;
    name: string;
  } | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [targetFolderForNewNote, setTargetFolderForNewNote] = useState<string | null>(null);
  const [, setLoading] = useState(true);
  const emptyStateFileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    text: string;
    type: 'loading' | 'success' | 'error';
  } | null>(null);
  const [glitchText, setGlitchText] = useState<string | null>(null);
  const currentStatusRef = useRef<{
    text: string;
    type: 'loading' | 'success' | 'error';
  } | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const glitchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  const triggerGlitchClear = useCallback(() => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
    if (glitchIntervalRef.current) {
      clearInterval(glitchIntervalRef.current);
      glitchIntervalRef.current = null;
    }

    const current = currentStatusRef.current;
    if (!current) {
      setStatus(null);
      setGlitchText(null);
      return;
    }

    const original = current.text;
    let frame = 0;
    const totalFrames = 10;

    glitchIntervalRef.current = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;

      if (frame >= totalFrames) {
        if (glitchIntervalRef.current) clearInterval(glitchIntervalRef.current);
        glitchIntervalRef.current = null;
        currentStatusRef.current = null;
        setStatus(null);
        setGlitchText(null);
      } else {
        setGlitchText(
          original
            .split('')
            .map((char, idx) => {
              if (char === ' ') return ' ';
              if (idx / original.length > 1 - progress) {
                return '';
              }
              return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            })
            .join('')
        );
      }
    }, 32);
  }, []);

  const setStatusMessage = useCallback((msg: string | null, type?: 'loading' | 'success' | 'error') => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
    if (glitchIntervalRef.current) {
      clearInterval(glitchIntervalRef.current);
      glitchIntervalRef.current = null;
    }
    setGlitchText(null);

    if (!msg) {
      currentStatusRef.current = null;
      setStatus(null);
      return;
    }

    let calculatedType: 'loading' | 'success' | 'error' = type || 'success';
    if (!type) {
      const lower = msg.toLowerCase();
      if (
        lower.includes('[fail]') ||
        lower.includes('[error]') ||
        lower.includes('falló') ||
        lower.includes('fallo') ||
        lower.includes('error') ||
        lower.includes('no se puede')
      ) {
        calculatedType = 'error';
      } else if (
        lower.includes('cargando') ||
        lower.includes('guardando') ||
        lower.includes('procesando') ||
        lower.includes('importando') ||
        lower.includes('eliminando') ||
        lower.includes('pegando') ||
        lower.includes('moviendo')
      ) {
        calculatedType = 'loading';
      }
    }

    const newStatus = { text: msg, type: calculatedType };
    currentStatusRef.current = newStatus;
    setStatus(newStatus);

    if (calculatedType !== 'loading') {
      statusTimerRef.current = setTimeout(() => {
        triggerGlitchClear();
      }, 5000);
    }
  }, [triggerGlitchClear]);

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      if (glitchIntervalRef.current) clearInterval(glitchIntervalRef.current);
    };
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [notesData, tagsData, foldersData] = await Promise.all([
        fetchNotes(),
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
  }, [selectedNote, customFolders, t.errorLoading]);

  useEffect(() => {
    loadData();
  }, []);

  const displayedNotes = useMemo(() => {
    if (selectedTags.length === 0) return notes;
    return notes.filter((n) =>
      selectedTags.some((tag) => (n.tags || []).includes(tag))
    );
  }, [notes, selectedTags]);

  // Save handler: saves to database and checks for embedding / Gemini errors
  const handleSaveNote = async (payload: NoteCreatePayload, id?: string) => {
    setSaving(true);
    setStatusMessage(id ? 'Guardando nota...' : 'Creando nota...', 'loading');
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
            : `[ERROR] Falló la vectorización: ${saved.embedding_error}`,
          'error'
        );
      } else {
        setSystemError(null);
        setStatusMessage(
          id
            ? t.noteSavedOk.replace('{title}', saved.title)
            : t.noteCreatedOk.replace('{title}', saved.title),
          'success'
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
    const isMdFile = file.name.match(/\.(md|markdown|txt)$/i);
    const loadingMsg = isMdFile ? (t.importingMdFile || 'IMPORTANDO ARCHIVO...') : t.importingFile;
    setStatusMessage(loadingMsg, 'loading');
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
          setStatusMessage(t.importZipSuccess.replace('{count}', String(res.imported_count)), 'success');
        } else {
          const isMdFile = file.name.match(/\.(md|markdown|txt)$/i);
          const msg = isMdFile
            ? (t.importMdSuccess || "[OK] Archivo '{title}' importado correctamente.").replace('{title}', first.title)
            : t.importSuccess.replace('{title}', first.title);
          setStatusMessage(msg, 'success');
        }
      } else if (!res.success) {
        setStatusMessage('[ADVERTENCIA] No se pudo importar ninguna nota. Revisa los archivos descartados.', 'error');
      }
      setIsEditing(false);
      setTargetFolderForNewNote(null);
      await loadData();
      onDataChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al importar documento';
      setSystemError(msg);
      setStatusMessage(`[FAIL] ${msg}`, 'error');
    }
  };

  const handleDropNoteOnFolder = async (noteId: string, folderTarget: string | null) => {
    try {
      setStatusMessage('Moviendo nota...', 'loading');
      const targetDisplay = folderTarget ? `/${folderTarget}` : 'root';
      await updateNote(noteId, { folder: folderTarget });
      setStatusMessage(t.noteTransferred.replace('{target}', targetDisplay), 'success');
      await loadData();
      onDataChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.errorMoving;
      setSystemError(msg);
      setStatusMessage(`[FAIL] ${msg}`, 'error');
    }
  };

  const handleMoveFolder = async (sourceFolder: string, targetFolder: string | null) => {
    if (targetFolder === sourceFolder || (targetFolder && targetFolder.startsWith(`${sourceFolder}/`))) {
      setStatusMessage(`[FAIL] No se puede mover '/${sourceFolder}' dentro de sí misma.`, 'error');
      return;
    }

    const folderName = sourceFolder.split('/').pop() || sourceFolder;
    const newSourcePath = targetFolder ? `${targetFolder}/${folderName}` : folderName;

    if (newSourcePath === sourceFolder) return;

    try {
      setStatusMessage(`Moviendo carpeta '/${sourceFolder}'...`, 'loading');
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
      setStatusMessage(`[SISTEMA] Carpeta '/${sourceFolder}' movida a '${targetDisplay}'`, 'success');
      await loadData();
      onDataChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al mover carpeta';
      setSystemError(msg);
      setStatusMessage(`[FAIL] ${msg}`, 'error');
    }
  };

  const handleRenameNote = async (note: Note, newTitle: string) => {
    const cleanTitle = newTitle.trim();
    if (!cleanTitle || cleanTitle === note.title) return;
    try {
      setStatusMessage(`Renombrando nota '${note.title}'...`, 'loading');
      const updated = await updateNote(note.id, { title: cleanTitle });
      if (selectedNote && selectedNote.id === note.id) {
        setSelectedNote(updated);
      }
      setStatusMessage(`[OK] Nota renombrada a '${updated.title}'.`, 'success');
      await loadData();
      onDataChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al renombrar nota';
      setSystemError(msg);
      setStatusMessage(`[FAIL] ${msg}`, 'error');
    }
  };

  const handleRenameFolder = async (oldFolder: string, newFolder: string) => {
    const cleanOld = oldFolder.trim();
    const cleanNew = newFolder.trim();
    if (!cleanNew || cleanOld === cleanNew) return;

    try {
      setStatusMessage(`Renombrando carpeta '/${cleanOld}' a '/${cleanNew}'...`, 'loading');
      await renameFolderInBackend(cleanOld, cleanNew);

      setCustomFolders((prev) => {
        const updated = prev.map((f) => {
          if (f === cleanOld) return cleanNew;
          if (f.startsWith(`${cleanOld}/`)) {
            const sub = f.substring(cleanOld.length + 1);
            return `${cleanNew}/${sub}`;
          }
          return f;
        });
        if (!updated.includes(cleanNew)) updated.push(cleanNew);
        return Array.from(new Set(updated)).sort();
      });

      if (selectedFolder) {
        if (selectedFolder === cleanOld) {
          setSelectedFolder(cleanNew);
        } else if (selectedFolder.startsWith(`${cleanOld}/`)) {
          const sub = selectedFolder.substring(cleanOld.length + 1);
          setSelectedFolder(`${cleanNew}/${sub}`);
        }
      }

      setStatusMessage(`[OK] Carpeta '/${cleanOld}' renombrada a '/${cleanNew}'.`, 'success');
      await loadData();
      onDataChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al renombrar carpeta';
      setSystemError(msg);
      setStatusMessage(`[FAIL] ${msg}`, 'error');
    }
  };

  const handleCreateFolder = (newFolder: string) => {
    const cleanFolder = newFolder.trim();
    if (!cleanFolder) return;

    setCustomFolders((prev) => Array.from(new Set([...prev, cleanFolder])).sort());
    setFolders((prev) => Array.from(new Set([...prev, cleanFolder])).sort());
    setStatusMessage(t.folderCreated.replace('{folder}', cleanFolder), 'success');
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;
    try {
      setStatusMessage('Eliminando nota...', 'loading');
      await deleteNote(deleteConfirm.id);
      setStatusMessage(t.recordPurged.replace('{id}', deleteConfirm.id), 'success');
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
      setStatusMessage(`[FAIL] ${msg}`, 'error');
    }
  };

  const handleDeleteFolderConfirmed = async () => {
    if (!deleteFolderConfirm) return;
    const folderTarget = deleteFolderConfirm;
    try {
      setStatusMessage(`Eliminando carpeta '/${folderTarget}'...`, 'loading');
      await deleteFolder(folderTarget);
      setStatusMessage(t.folderDeletedOk.replace('{folder}', folderTarget), 'success');
      if (
        selectedNote &&
        selectedNote.folder &&
        (selectedNote.folder === folderTarget || selectedNote.folder.startsWith(`${folderTarget}/`))
      ) {
        setSelectedNote(null);
        setIsEditing(false);
      }
      setDeleteFolderConfirm(null);
      await loadData();
      onDataChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar carpeta';
      setSystemError(msg);
      setStatusMessage(`[FAIL] ${msg}`, 'error');
      setDeleteFolderConfirm(null);
    }
  };

  const handleCopyNote = useCallback((note: Note) => {
    setClipboard({
      type: 'note',
      data: note,
      name: `${note.title}.md`
    });
    setStatusMessage(t.itemCopied.replace('{name}', `${note.title}.md`), 'success');
  }, [t.itemCopied]);

  const handleCopyFolder = useCallback((folderPath: string) => {
    setClipboard({
      type: 'folder',
      path: folderPath,
      name: `/${folderPath}`
    });
    setStatusMessage(t.itemCopied.replace('{name}', `/${folderPath}`), 'success');
  }, [t.itemCopied]);

  const handlePaste = useCallback(async (targetFolder: string | null) => {
    if (!clipboard) {
      setStatusMessage(t.clipboardEmpty, 'error');
      return;
    }
    const dest = targetFolder !== undefined ? targetFolder : selectedFolder;
    try {
      setStatusMessage('Pegando elemento...', 'loading');
      if (clipboard.type === 'note' && clipboard.data) {
        const isSameFolder = (clipboard.data.folder || null) === (dest || null);
        const newTitle = isSameFolder ? `${clipboard.data.title} (copia)` : clipboard.data.title;
        await handleSaveNote({
          title: newTitle,
          content: clipboard.data.content,
          tags: clipboard.data.tags,
          folder: dest || null
        });
        setStatusMessage(t.itemPasted.replace('{target}', dest ? `/${dest}` : t.noFolderRoot), 'success');
      } else if (clipboard.type === 'folder' && clipboard.path) {
        const srcPath = clipboard.path;
        const folderName = srcPath.split('/').pop() || 'copia';
        const destFolder = dest
          ? `${dest}/${folderName}`
          : (srcPath === folderName ? `${folderName}_copia` : folderName);

        const notesToCopy = notes.filter(
          (n) => n.folder === srcPath || (n.folder && n.folder.startsWith(`${srcPath}/`))
        );
        for (const n of notesToCopy) {
          const subRelative = (n.folder && n.folder !== srcPath) ? n.folder.slice(srcPath.length) : '';
          const newNoteFolder = subRelative ? `${destFolder}${subRelative}` : destFolder;
          await createNote({
            title: n.title,
            content: n.content,
            tags: n.tags,
            folder: newNoteFolder
          });
        }
        await loadData();
        onDataChanged();
        setStatusMessage(t.itemPasted.replace('{target}', `/${destFolder}`), 'success');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al pegar elemento';
      setStatusMessage(`[FAIL] ${msg}`, 'error');
    }
  }, [clipboard, selectedFolder, notes, t.clipboardEmpty, t.itemPasted, t.noFolderRoot, onDataChanged, loadData]);

  // Global & Contextual Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );

      // Global shortcuts (Alt + key)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          setSelectedNote(null);
          setTargetFolderForNewNote(selectedFolder || null);
          setIsEditing(true);
          return;
        }
      }

      // Contextual shortcuts when not actively editing text
      if (!isInput) {
        // Delete / Supr
        if (e.key === 'Delete' || e.key === 'Del') {
          if (selectedNote) {
            e.preventDefault();
            setDeleteConfirm({ id: selectedNote.id, title: selectedNote.title });
          } else if (selectedFolder) {
            e.preventDefault();
            setDeleteFolderConfirm(selectedFolder);
          }
          return;
        }

        // Ctrl+C / Cmd+C
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
          if (selectedNote) {
            e.preventDefault();
            handleCopyNote(selectedNote);
          } else if (selectedFolder) {
            e.preventDefault();
            handleCopyFolder(selectedFolder);
          }
          return;
        }

        // Ctrl+V / Cmd+V
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
          if (clipboard) {
            e.preventDefault();
            handlePaste(selectedFolder || null);
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNote, selectedFolder, clipboard, handleCopyNote, handleCopyFolder, handlePaste, handleCreateFolder, handleExportFolder]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-nexo-950">
      {/* Optional Tag Filter Strip (Multi-select) */}
      {tags.length > 0 && (
        <div className="border-b border-nexo-850 bg-nexo-950 px-3 py-1.5 flex items-center gap-2 overflow-x-auto font-mono text-xs shrink-0">
          <span className="text-nexo-600 text-[10px] uppercase shrink-0">{t.tagsLabel}</span>
          <button
            type="button"
            onClick={() => setSelectedTags([])}
            className={`px-2 py-0.5 text-[11px] border transition-colors ${
              selectedTags.length === 0
                ? 'border-white bg-white text-black font-bold'
                : 'border-nexo-800 text-nexo-400 hover:text-white'
            }`}
          >
            {t.allTags}
          </button>
          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setSelectedTags((prev) =>
                    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                  )
                }
                className={`px-2 py-0.5 text-[11px] border transition-colors ${
                  isSelected
                    ? 'border-emerald-400 bg-emerald-950/80 text-emerald-300 font-bold'
                    : 'border-nexo-800 text-nexo-400 hover:text-white'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}

      {/* Permanent System Status Line: always visible with [SYSTEM], shows real-time events and clears with cyber-glitch after 5s */}
      <div
        className={`border-b px-3 py-1 font-mono text-[11px] flex justify-between items-center shrink-0 transition-colors duration-200 ${
          status
            ? status.type === 'loading'
              ? 'bg-neutral-900 border-neutral-700 text-neutral-300'
              : status.type === 'error'
              ? 'bg-red-950/80 border-red-500/60 text-red-300'
              : 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
            : 'bg-nexo-950 border-nexo-850 text-nexo-500'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          <span className="font-bold tracking-wider shrink-0 flex items-center gap-1.5 select-none">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                status
                  ? status.type === 'loading'
                    ? 'bg-neutral-400 animate-pulse'
                    : status.type === 'error'
                    ? 'bg-red-400'
                    : 'bg-emerald-400'
                  : 'bg-emerald-600/60'
              }`}
            />
            <span>
              {status
                ? status.type === 'loading'
                  ? '[SYSTEM: CARGANDO]'
                  : status.type === 'error'
                  ? '[SYSTEM: FALLO]'
                  : '[SYSTEM: OK]'
                : '[SYSTEM]'}
            </span>
          </span>
          <span className="truncate font-mono">
            {glitchText !== null
              ? glitchText
              : status
              ? status.text
              : t.systemIdle}
          </span>
        </div>
        {status && (
          <button
            type="button"
            onClick={triggerGlitchClear}
            className="opacity-70 hover:opacity-100 text-xs px-1 font-mono cursor-pointer shrink-0 ml-2"
            title="Descartar mensaje"
          >
            [X]
          </button>
        )}
      </div>

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
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: IDE Explorer (VS Code style file tree with z-20 so tooltips/popups overlay on top of right panel) */}
        <div className="w-72 md:w-80 shrink-0 h-full flex flex-col bg-nexo-950 relative z-20">
          <FolderTree
            notes={displayedNotes}
            folders={folders}
            selectedNoteId={selectedNote?.id || null}
            selectedFolder={selectedFolder}
            onSelectFolder={(folder) => {
              setSelectedFolder(folder);
              setSelectedNote(null);
            }}
            onSelectNote={(note) => {
              if (note) {
                setSelectedNote(note);
                setIsEditing(false);
                setSystemError(note.embedding_error || null);
              } else {
                setSelectedNote(null);
              }
            }}
            onDeleteNote={(id, title) => setDeleteConfirm({ id, title })}
            onDeleteFolder={(folder) => setDeleteFolderConfirm(folder)}
            onCreateFolder={handleCreateFolder}
            onCreateNote={(folder) => {
              setSelectedNote(null);
              setTargetFolderForNewNote(folder || null);
              setIsEditing(true);
            }}
            onImportFile={handleImportFile}
            onExportFolder={handleExportFolder}
            onExportNote={handleExportNote}
            onCopyNote={handleCopyNote}
            onCopyFolder={handleCopyFolder}
            onPaste={handlePaste}
            hasClipboardItem={!!clipboard}
            onDropNoteOnFolder={handleDropNoteOnFolder}
            onMoveFolder={handleMoveFolder}
            onRenameNote={handleRenameNote}
            onRenameFolder={handleRenameFolder}
          />
        </div>

        {/* Right Panel: Note Viewer / Editor Area */}
        <div className="flex-1 h-full overflow-hidden flex flex-col bg-nexo-950 relative z-10">
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
                {t.executeDelete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folder Deletion Confirmation Modal */}
      {deleteFolderConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-nexo-900 border-2 border-nexo-alert p-5 max-w-md w-full font-mono">
            <div className="text-nexo-alert font-bold text-sm mb-3 uppercase tracking-wider">
              {t.deleteFolderTitle}
            </div>
            <div className="text-xs text-nexo-200 mb-4 space-y-2">
              <p>{t.deleteFolderWarning.replace('{folder}', deleteFolderConfirm)}</p>
              <div className="bg-nexo-950 p-2 border border-nexo-800">
                <div><span className="text-nexo-600">CARPETA:</span> /{deleteFolderConfirm}</div>
              </div>
            </div>
            <div className="flex justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setDeleteFolderConfirm(null)}
                className="border border-nexo-700 px-4 py-1.5 text-nexo-300 hover:text-white"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteFolderConfirmed}
                className="border border-nexo-alert bg-nexo-alert text-black font-bold px-4 py-1.5 hover:bg-red-500"
              >
                {t.executeDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
