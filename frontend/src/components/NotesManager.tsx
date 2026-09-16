import React, { useState, useEffect, useCallback } from 'react';
import { Note, NoteCreatePayload } from '../types';
import { fetchNotes, fetchTags, fetchFolders, createNote, updateNote, deleteNote } from '../api';
import { NoteList } from './NoteList';
import { NoteEditor } from './NoteEditor';
import { FolderTree } from './FolderTree';
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
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [notesData, tagsData, foldersData] = await Promise.all([
        fetchNotes(searchQuery, selectedTag || undefined, selectedFolder || undefined),
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
      setStatusMessage(`[ERROR] ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedTag, selectedFolder, selectedNote, customFolders, t.errorLoading]);

  useEffect(() => {
    loadData();
  }, [selectedTag, selectedFolder, searchQuery]);

  const handleSaveNote = async (payload: NoteCreatePayload, id?: string) => {
    setSaving(true);
    setStatusMessage(null);
    try {
      if (id) {
        const updated = await updateNote(id, payload);
        setStatusMessage(t.noteSavedOk.replace('{title}', updated.title));
        setSelectedNote(updated);
      } else {
        const created = await createNote(payload);
        setStatusMessage(t.noteCreatedOk.replace('{title}', created.title));
        setSelectedNote(created);
      }
      await loadData();
      onDataChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.errorProcessing;
      setStatusMessage(`[FAIL] ${msg}`);
      throw err;
    } finally {
      setSaving(false);
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
      setStatusMessage(`[FAIL] ${msg}`);
    }
  };

  const handleMoveFolder = async (sourceFolder: string, targetFolder: string | null) => {
    if (targetFolder === sourceFolder || (targetFolder && targetFolder.startsWith(`${sourceFolder}/`))) {
      setStatusMessage(`[FAIL] Cannot move folder '/${sourceFolder}' into itself or its own subfolder.`);
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
      setStatusMessage(`[SYSTEM] Folder '/${sourceFolder}' moved to '${targetDisplay}'`);
      await loadData();
      onDataChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error moving folder';
      setStatusMessage(`[FAIL] ${msg}`);
    }
  };

  const handleCreateFolder = (newFolder: string) => {
    const cleanFolder = newFolder.trim();
    if (!cleanFolder) return;

    setCustomFolders((prev) => Array.from(new Set([...prev, cleanFolder])).sort());
    setFolders((prev) => Array.from(new Set([...prev, cleanFolder])).sort());
    setSelectedFolder(cleanFolder);
    setStatusMessage(t.folderCreated.replace('{folder}', cleanFolder));
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteNote(deleteConfirm.id);
      setStatusMessage(t.recordPurged.replace('{id}', deleteConfirm.id));
      if (selectedNote?.id === deleteConfirm.id) {
        setSelectedNote(null);
      }
      setDeleteConfirm(null);
      await loadData();
      onDataChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.errorDeleting;
      setStatusMessage(`[FAIL] ${msg}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Action and Filter Bar */}
      <div className="border-b border-fazt-800 bg-fazt-900 p-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <span className="text-fazt-600 uppercase shrink-0">{t.filterLabel}</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-fazt-950 border border-fazt-800 px-2 py-1 text-fazt-200 focus:outline-none focus:border-white font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedNote(null)}
            className="border border-fazt-accent text-fazt-accent hover:bg-fazt-accent hover:text-black font-bold px-3 py-1 transition-colors"
          >
            {t.createNoteBtn}
          </button>
        </div>
      </div>

      {/* Tag Filter Strip */}
      {tags.length > 0 && (
        <div className="border-b border-fazt-850 bg-fazt-950 px-3 py-1.5 flex items-center gap-2 overflow-x-auto font-mono text-xs">
          <span className="text-fazt-600 text-[10px] uppercase shrink-0">{t.tagsLabel}</span>
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={`px-2 py-0.5 text-[11px] border transition-colors ${
              selectedTag === null
                ? 'border-white bg-white text-black font-bold'
                : 'border-fazt-800 text-fazt-400 hover:text-white'
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
                  : 'border-fazt-800 text-fazt-400 hover:text-white'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Status bar */}
      {statusMessage && (
        <div className="bg-fazt-900 border-b border-fazt-800 px-3 py-1 font-mono text-[11px] text-fazt-300">
          {statusMessage}
        </div>
      )}

      {/* Main 3-Column Panel */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Col 1: Folders Sidebar (2 cols) */}
        <div className="md:col-span-2 overflow-hidden flex flex-col bg-fazt-950">
          <FolderTree
            folders={folders}
            selectedFolder={selectedFolder}
            onSelectFolder={setSelectedFolder}
            onCreateFolder={handleCreateFolder}
            onDropNoteOnFolder={handleDropNoteOnFolder}
            onMoveFolder={handleMoveFolder}
            totalNotesCount={notes.length}
          />
        </div>

        {/* Col 2: Notes List (4 cols) */}
        <div className="md:col-span-4 border-r border-fazt-800 flex flex-col bg-fazt-950 overflow-hidden">
          <div className="bg-fazt-900 px-3 py-1.5 border-b border-fazt-850 flex justify-between items-center font-mono text-[11px] text-fazt-500">
            <span>{t.recordsCount} {notes.length}</span>
            <span className="text-[10px] text-zinc-500">{t.dragHint}</span>
          </div>
          <NoteList
            notes={notes}
            selectedNoteId={selectedNote?.id || null}
            onSelectNote={(note) => setSelectedNote(note)}
            onDeleteNote={(id, title) => setDeleteConfirm({ id, title })}
            loading={loading}
          />
        </div>

        {/* Col 3: Editor (6 cols) */}
        <div className="md:col-span-6 flex flex-col bg-fazt-950 overflow-hidden">
          <NoteEditor
            note={selectedNote}
            availableFolders={folders}
            onSave={handleSaveNote}
            onCancel={() => setSelectedNote(null)}
            saving={saving}
          />
        </div>
      </div>

      {/* Technical Deletion Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-fazt-900 border-2 border-fazt-alert p-5 max-w-md w-full font-mono">
            <div className="text-fazt-alert font-bold text-sm mb-3 uppercase tracking-wider">
              {t.deleteTitle}
            </div>
            <div className="text-xs text-fazt-200 mb-4 space-y-2">
              <p>{t.deleteWarning}</p>
              <div className="bg-fazt-950 p-2 border border-fazt-800">
                <div><span className="text-fazt-600">ID:</span> {deleteConfirm.id}</div>
                <div><span className="text-fazt-600">TITLE:</span> {deleteConfirm.title}</div>
              </div>
            </div>
            <div className="flex justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="border border-fazt-700 px-4 py-1.5 text-fazt-300 hover:text-white"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="border border-fazt-alert bg-fazt-alert text-black font-bold px-4 py-1.5 hover:bg-red-500"
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
