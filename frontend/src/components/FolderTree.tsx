import React, { useState } from 'react';

interface FolderTreeProps {
  folders: string[];
  selectedFolder: string | null;
  onSelectFolder: (folder: string | null) => void;
  onCreateFolder: (name: string) => void;
  onDropNoteOnFolder: (noteId: string, folderName: string | null) => void;
  totalNotesCount: number;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  selectedFolder,
  onSelectFolder,
  onCreateFolder,
  onDropNoteOnFolder,
  totalNotesCount
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreating(false);
    }
  };

  const handleDragOver = (e: React.DragEvent, folderKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(folderKey);
  };

  const handleDragLeave = () => {
    setDragOverFolder(null);
  };

  const handleDrop = (e: React.DragEvent, folderTarget: string | null) => {
    e.preventDefault();
    setDragOverFolder(null);
    const noteId = e.dataTransfer.getData('text/plain');
    if (noteId) {
      onDropNoteOnFolder(noteId, folderTarget);
    }
  };

  return (
    <div className="border-b md:border-b-0 md:border-r border-fazt-800 bg-fazt-950 flex flex-col font-mono text-xs select-none">
      <div className="bg-fazt-900 px-3 py-2 border-b border-fazt-850 flex items-center justify-between">
        <span className="font-bold text-fazt-300 text-[11px] uppercase tracking-wider">
          DIRECTORIOS
        </span>
        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="text-fazt-accent hover:text-emerald-300 text-[11px] px-1 border border-fazt-accent/40 bg-fazt-accent/10"
        >
          {isCreating ? 'CANCELAR' : '+ CARPETA'}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-fazt-850 bg-fazt-900/60">
          <input
            type="text"
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Nombre de carpeta..."
            className="w-full bg-fazt-950 border border-fazt-800 px-2 py-1 text-xs text-white focus:outline-none focus:border-fazt-accent"
          />
          <div className="flex justify-end gap-1 mt-1">
            <button
              type="submit"
              className="bg-fazt-accent text-black font-bold text-[10px] px-2 py-0.5"
            >
              CREAR
            </button>
          </div>
        </form>
      )}

      <div className="p-1 space-y-0.5 overflow-y-auto max-h-48 md:max-h-none flex-1">
        {/* All notes */}
        <button
          type="button"
          onClick={() => onSelectFolder(null)}
          className={`w-full text-left px-2 py-1.5 transition-colors border ${
            selectedFolder === null
              ? 'bg-fazt-900 border-white text-white font-bold'
              : 'border-transparent text-fazt-400 hover:bg-fazt-900 hover:text-fazt-200'
          }`}
        >
          [/] TODAS ({totalNotesCount})
        </button>

        {/* Root notes (without folder) */}
        <div
          onDragOver={(e) => handleDragOver(e, '__root__')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
          onClick={() => onSelectFolder('__root__')}
          className={`px-2 py-1.5 cursor-pointer transition-colors border ${
            dragOverFolder === '__root__'
              ? 'bg-emerald-950/40 border-emerald-400 text-emerald-300'
              : selectedFolder === '__root__'
              ? 'bg-fazt-900 border-white text-white font-bold'
              : 'border-transparent text-fazt-400 hover:bg-fazt-900 hover:text-fazt-200'
          }`}
        >
          [#] RAIZ / SIN CARPETA
        </div>

        {/* Custom folders */}
        {folders.map((folder) => {
          const isSelected = selectedFolder === folder;
          const isDragOver = dragOverFolder === folder;

          return (
            <div
              key={folder}
              onDragOver={(e) => handleDragOver(e, folder)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folder)}
              onClick={() => onSelectFolder(folder)}
              className={`px-2 py-1.5 cursor-pointer transition-colors border flex items-center justify-between ${
                isDragOver
                  ? 'bg-emerald-950/40 border-emerald-400 text-emerald-300'
                  : isSelected
                  ? 'bg-fazt-900 border-white text-white font-bold'
                  : 'border-transparent text-fazt-400 hover:bg-fazt-900 hover:text-fazt-200'
              }`}
            >
              <span className="truncate flex-1">/{folder}</span>
              {isDragOver && (
                <span className="text-[10px] text-emerald-400 shrink-0 font-bold">[SOLTAR]</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
