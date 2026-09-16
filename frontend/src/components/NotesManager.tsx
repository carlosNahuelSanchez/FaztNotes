import React, { useState, useEffect, useCallback } from 'react';
import { Note, NoteCreatePayload } from '../types';
import { fetchNotes, fetchTags, fetchFolders, createNote, updateNote, deleteNote } from '../api';
import { NoteList } from './NoteList';
import { NoteEditor } from './NoteEditor';
import { FolderTree } from './FolderTree';

interface NotesManagerProps {
  onDataChanged: () => void;
}

export const NotesManager: React.FC<NotesManagerProps> = ({ onDataChanged }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
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
      setFolders(foldersData);

      if (selectedNote) {
        const found = notesData.find((n) => n.id === selectedNote.id);
        if (found) setSelectedNote(found);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar notas';
      setStatusMessage(`[ERROR] ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedTag, selectedFolder, selectedNote]);

  useEffect(() => {
    loadData();
  }, [selectedTag, selectedFolder, searchQuery]);

  const handleSaveNote = async (payload: NoteCreatePayload, id?: string) => {
    setSaving(true);
    setStatusMessage(null);
    try {
      if (id) {
        const updated = await updateNote(id, payload);
        setStatusMessage(`[OK] Nota '${updated.title}' guardada y vectorizada.`);
        setSelectedNote(updated);
      } else {
        const created = await createNote(payload);
        setStatusMessage(`[OK] Nota '${created.title}' creada y vectorizada.`);
        setSelectedNote(created);
      }
      await loadData();
      onDataChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar nota';
      setStatusMessage(`[FALLO] ${msg}`);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleDropNoteOnFolder = async (noteId: string, folderTarget: string | null) => {
    try {
      const targetDisplay = folderTarget ? `/${folderTarget}` : 'raiz';
      await updateNote(noteId, { folder: folderTarget });
      setStatusMessage(`[SISTEMA] Nota transferida exitosamente a: ${targetDisplay}`);
      await loadData();
      onDataChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al mover nota';
      setStatusMessage(`[FALLO] ${msg}`);
    }
  };

  const handleCreateFolder = (newFolder: string) => {
    if (!folders.includes(newFolder)) {
      setFolders((prev) => [...prev, newFolder].sort());
      setSelectedFolder(newFolder);
      setStatusMessage(`[SISTEMA] Carpeta /${newFolder} creada. Puede arrastrar notas hacia ella.`);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteNote(deleteConfirm.id);
      setStatusMessage(`[OK] Registro ${deleteConfirm.id} purgado de la base de datos.`);
      if (selectedNote?.id === deleteConfirm.id) {
        setSelectedNote(null);
      }
      setDeleteConfirm(null);
      await loadData();
      onDataChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar';
      setStatusMessage(`[FALLO] ${msg}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Action and Filter Bar */}
      <div className="border-b border-fazt-800 bg-fazt-900 p-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <span className="text-fazt-600 uppercase shrink-0">FILTRAR:</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en titulo o contenido..."
            className="w-full bg-fazt-950 border border-fazt-800 px-2 py-1 text-fazt-200 focus:outline-none focus:border-white font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedNote(null)}
            className="border border-fazt-accent text-fazt-accent hover:bg-fazt-accent hover:text-black font-bold px-3 py-1 transition-colors"
          >
            + CREAR NUEVA NOTA
          </button>
        </div>
      </div>

      {/* Tag Filter Strip */}
      {tags.length > 0 && (
        <div className="border-b border-fazt-850 bg-fazt-950 px-3 py-1.5 flex items-center gap-2 overflow-x-auto font-mono text-xs">
          <span className="text-fazt-600 text-[10px] uppercase shrink-0">ETIQUETAS:</span>
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={`px-2 py-0.5 text-[11px] border transition-colors ${
              selectedTag === null
                ? 'border-white bg-white text-black font-bold'
                : 'border-fazt-800 text-fazt-400 hover:text-white'
            }`}
          >
            TODAS
          </button>
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTag(selectedTag === t ? null : t)}
              className={`px-2 py-0.5 text-[11px] border transition-colors ${
                selectedTag === t
                  ? 'border-white bg-white text-black font-bold'
                  : 'border-fazt-800 text-fazt-400 hover:text-white'
              }`}
            >
              #{t}
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
            totalNotesCount={notes.length}
          />
        </div>

        {/* Col 2: Notes List (4 cols) */}
        <div className="md:col-span-4 border-r border-fazt-800 flex flex-col bg-fazt-950 overflow-hidden">
          <div className="bg-fazt-900 px-3 py-1.5 border-b border-fazt-850 flex justify-between items-center font-mono text-[11px] text-fazt-500">
            <span>REGISTROS: {notes.length}</span>
            <span className="text-[10px] text-zinc-500">ARRASTRE A CARPETA</span>
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
              [CONFIRMACION DE ELIMINACION PERMANENTE]
            </div>
            <div className="text-xs text-fazt-200 mb-4 space-y-2">
              <p>ADVERTENCIA: Esta operacion eliminara de forma irreversible el registro de la base de datos.</p>
              <div className="bg-fazt-950 p-2 border border-fazt-800">
                <div><span className="text-fazt-600">ID:</span> {deleteConfirm.id}</div>
                <div><span className="text-fazt-600">TITULO:</span> {deleteConfirm.title}</div>
              </div>
            </div>
            <div className="flex justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="border border-fazt-700 px-4 py-1.5 text-fazt-300 hover:text-white"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="border border-fazt-alert bg-fazt-alert text-black font-bold px-4 py-1.5 hover:bg-red-500"
              >
                EJECUTAR PURGA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
