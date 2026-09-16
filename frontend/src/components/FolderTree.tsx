import React, { useState, useMemo } from 'react';
import { useI18n } from '../i18n';

interface FolderTreeProps {
  folders: string[];
  selectedFolder: string | null;
  onSelectFolder: (folder: string | null) => void;
  onCreateFolder: (name: string) => void;
  onDropNoteOnFolder: (noteId: string, folderName: string | null) => void;
  onMoveFolder: (sourceFolder: string, targetFolder: string | null) => void;
  totalNotesCount: number;
}

interface TreeNode {
  name: string;
  fullPath: string;
  children: Map<string, TreeNode>;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  selectedFolder,
  onSelectFolder,
  onCreateFolder,
  onDropNoteOnFolder,
  onMoveFolder,
  totalNotesCount
}) => {
  const { t } = useI18n();
  const [isCreatingRoot, setIsCreatingRoot] = useState(false);
  const [creatingSubFor, setCreatingSubFor] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Build tree hierarchy from folder paths list
  const treeRoot = useMemo(() => {
    const root: TreeNode = { name: 'root', fullPath: '', children: new Map() };
    
    folders.forEach((path) => {
      const parts = path.split('/').filter(Boolean);
      let current = root;
      let currentPath = '';

      parts.forEach((part) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        if (!current.children.has(part)) {
          current.children.set(part, {
            name: part,
            fullPath: currentPath,
            children: new Map()
          });
        }
        current = current.children.get(part)!;
      });
    });

    return root;
  }, [folders]);

  const toggleCollapse = (fullPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsed((prev) => ({ ...prev, [fullPath]: !prev[fullPath] }));
  };

  const handleCreateSubmit = (e: React.FormEvent, parentPath: string | null) => {
    e.preventDefault();
    const cleanName = newFolderName.trim();
    if (cleanName) {
      const fullPath = parentPath ? `${parentPath}/${cleanName}` : cleanName;
      onCreateFolder(fullPath);
      setNewFolderName('');
      setIsCreatingRoot(false);
      setCreatingSubFor(null);
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
    e.stopPropagation();
    setDragOverFolder(null);

    const rawItem = e.dataTransfer.getData('application/fazt-item');
    if (rawItem) {
      try {
        const item = JSON.parse(rawItem);
        if (item.type === 'folder' && item.path) {
          onMoveFolder(item.path, folderTarget);
          return;
        } else if (item.type === 'note' && item.id) {
          onDropNoteOnFolder(item.id, folderTarget);
          return;
        }
      } catch {}
    }

    const noteId = e.dataTransfer.getData('text/plain');
    if (noteId) {
      onDropNoteOnFolder(noteId, folderTarget);
    }
  };

  // Recursive renderer for IDE tree nodes
  const renderNode = (node: TreeNode, depth: number = 0) => {
    const hasChildren = node.children.size > 0;
    const isCollapsed = !!collapsed[node.fullPath];
    const isSelected = selectedFolder === node.fullPath;
    const isDragOver = dragOverFolder === node.fullPath;
    const isAddingSub = creatingSubFor === node.fullPath;

    return (
      <div key={node.fullPath} className="flex flex-col">
        <div
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.setData('application/fazt-item', JSON.stringify({ type: 'folder', path: node.fullPath }));
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(e) => handleDragOver(e, node.fullPath)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node.fullPath)}
          onClick={() => onSelectFolder(node.fullPath)}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className={`py-1 pr-2 cursor-grab active:cursor-grabbing transition-colors border flex items-center justify-between text-xs group ${
            isDragOver
              ? 'bg-emerald-950/40 border-emerald-400 text-emerald-300 font-bold'
              : isSelected
              ? 'bg-fazt-900 border-white text-white font-bold'
              : 'border-transparent text-fazt-400 hover:bg-fazt-900 hover:text-fazt-200'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate flex-1">
            {hasChildren ? (
              <span
                onClick={(e) => toggleCollapse(node.fullPath, e)}
                className="text-fazt-500 hover:text-white px-0.5 select-none font-bold text-[10px]"
              >
                {isCollapsed ? '►' : '▼'}
              </span>
            ) : (
              <span className="text-fazt-700 text-[10px]">└</span>
            )}
            <span className="truncate">/{node.name}</span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isDragOver && (
              <span className="text-[10px] text-emerald-400 shrink-0 font-bold">{t.dropHere}</span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCreatingSubFor(isAddingSub ? null : node.fullPath);
                setIsCreatingRoot(false);
                setNewFolderName('');
              }}
              className="text-[10px] px-1 border border-fazt-700 bg-fazt-950 text-fazt-400 hover:text-white hover:border-fazt-500"
              title="Add subfolder"
            >
              + SUB
            </button>
          </div>
        </div>

        {/* Subfolder creation form inline */}
        {isAddingSub && (
          <form
            onSubmit={(e) => handleCreateSubmit(e, node.fullPath)}
            style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
            className="p-1.5 border-b border-fazt-850 bg-fazt-900/80 my-1 space-y-1"
          >
            <div className="flex items-center justify-between text-[10px] text-fazt-500">
              <span>+ Subfolder inside /{node.fullPath}:</span>
              <span className="text-fazt-600 font-mono text-[9px]">
                {newFolderName.length} / 60
              </span>
            </div>
            <input
              type="text"
              autoFocus
              maxLength={60}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSubmit(e, node.fullPath);
              }}
              placeholder="e.g. api, utils..."
              className="w-full bg-fazt-950 border border-fazt-800 px-2 py-1 text-xs text-white focus:outline-none focus:border-fazt-accent font-mono"
            />
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={() => setCreatingSubFor(null)}
                className="text-[10px] text-fazt-400 hover:text-white px-2 py-0.5"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="bg-fazt-accent text-black font-bold text-[10px] px-2 py-0.5"
              >
                {t.create}
              </button>
            </div>
          </form>
        )}

        {/* Nested Child Folders */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col">
            {Array.from(node.children.values()).map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border-b md:border-b-0 md:border-r border-fazt-800 bg-fazt-950 flex flex-col font-mono text-xs select-none h-full">
      {/* Header bar */}
      <div className="bg-fazt-900 px-3 py-2 border-b border-fazt-850 flex items-center justify-between shrink-0">
        <span className="font-bold text-fazt-300 text-[11px] uppercase tracking-wider">
          {t.directoriesTitle}
        </span>
        <button
          type="button"
          onClick={() => {
            setIsCreatingRoot(!isCreatingRoot);
            setCreatingSubFor(null);
            setNewFolderName('');
          }}
          className="text-fazt-accent hover:text-emerald-300 text-[11px] px-1.5 py-0.5 border border-fazt-accent/40 bg-fazt-accent/10 font-bold"
        >
          {isCreatingRoot ? t.cancel : t.addFolder}
        </button>
      </div>

      {/* Root creation form */}
      {isCreatingRoot && (
        <form
          onSubmit={(e) => handleCreateSubmit(e, null)}
          className="p-2 border-b border-fazt-850 bg-fazt-900/60 shrink-0 space-y-1"
        >
          <div className="flex justify-between items-center text-[10px] text-fazt-500">
            <span>{t.folderPlaceholder}</span>
            <span className="text-fazt-600 font-mono text-[9px]">
              {newFolderName.length} / 60
            </span>
          </div>
          <input
            type="text"
            autoFocus
            maxLength={60}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateSubmit(e, null);
            }}
            placeholder="e.g. backend, docs..."
            className="w-full bg-fazt-950 border border-fazt-800 px-2 py-1 text-xs text-white focus:outline-none focus:border-fazt-accent font-mono"
          />
          <div className="flex justify-end gap-1 mt-1">
            <button
              type="submit"
              className="bg-fazt-accent text-black font-bold text-[10px] px-2 py-0.5"
            >
              {t.create}
            </button>
          </div>
        </form>
      )}

      {/* Directories Tree Area */}
      <div className="p-1 space-y-0.5 overflow-y-auto max-h-48 md:max-h-none flex-1">
        {/* All notes */}
        <button
          type="button"
          onClick={() => onSelectFolder(null)}
          onDragOver={(e) => handleDragOver(e, '__all__')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
          className={`w-full text-left px-2 py-1.5 transition-colors border ${
            selectedFolder === null
              ? 'bg-fazt-900 border-white text-white font-bold'
              : 'border-transparent text-fazt-400 hover:bg-fazt-900 hover:text-fazt-200'
          }`}
        >
          {t.allNotes} ({totalNotesCount})
        </button>

        {/* Root notes (without folder) */}
        <div
          onDragOver={(e) => handleDragOver(e, '__root__')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
          onClick={() => onSelectFolder('__root__')}
          className={`px-2 py-1.5 cursor-pointer transition-colors border flex items-center justify-between ${
            dragOverFolder === '__root__'
              ? 'bg-emerald-950/40 border-emerald-400 text-emerald-300 font-bold'
              : selectedFolder === '__root__'
              ? 'bg-fazt-900 border-white text-white font-bold'
              : 'border-transparent text-fazt-400 hover:bg-fazt-900 hover:text-fazt-200'
          }`}
        >
          <span>{t.rootFolder}</span>
          {dragOverFolder === '__root__' && (
            <span className="text-[10px] text-emerald-400 shrink-0 font-bold">{t.dropHere}</span>
          )}
        </div>

        {/* Nested IDE Tree Render */}
        {Array.from(treeRoot.children.values()).map((child) => renderNode(child, 0))}
      </div>
    </div>
  );
};
