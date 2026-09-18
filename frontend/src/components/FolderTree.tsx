import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Note } from '../types';
import { useI18n } from '../i18n';
import {
  FileCodeIcon,
  FolderIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  UploadIcon,
  DownloadIcon,
  DotsVerticalIcon,
  TrashIcon
} from './CyberIcons';
import { CyberTooltip } from './CyberTooltip';

interface FolderTreeProps {
  notes: Note[];
  folders: string[];
  selectedNoteId: string | null;
  onSelectNote: (note: Note) => void;
  onDeleteNote: (id: string, title: string) => void;
  onDeleteFolder?: (folderPath: string) => void;
  onCreateFolder: (name: string) => void;
  onCreateNote: (folder?: string | null) => void;
  onImportFile: (file: File, folderTarget?: string | null) => void;
  onExportFolder?: (folder: string | null) => void;
  onExportNote?: (note: Note) => void;
  onDropNoteOnFolder: (noteId: string, folderName: string | null) => void;
  onMoveFolder: (sourceFolder: string, targetFolder: string | null) => void;
}

interface TreeNode {
  name: string;
  fullPath: string;
  subfolders: Map<string, TreeNode>;
  notes: Note[];
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  notes,
  folders,
  selectedNoteId,
  onSelectNote,
  onDeleteNote,
  onDeleteFolder,
  onCreateFolder,
  onCreateNote,
  onImportFile,
  onExportFolder,
  onExportNote,
  onDropNoteOnFolder,
  onMoveFolder
}) => {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importTargetFolder, setImportTargetFolder] = useState<string | null>(null);
  const [activeMenuFolder, setActiveMenuFolder] = useState<string | null>(null);
  const [isCreatingRootFolder, setIsCreatingRootFolder] = useState(false);
  const [creatingSubFor, setCreatingSubFor] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuFolder(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveMenuFolder(null);
    };
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // ponytail: Build true hierarchical IDE file tree in a single pass
  const tree = useMemo(() => {
    const root = {
      subfolders: new Map<string, TreeNode>(),
      notes: [] as Note[]
    };

    // 1. Register explicit and inherited folder paths
    folders.forEach((path) => {
      const parts = path.split('/').filter(Boolean);
      let currentMap = root.subfolders;
      let accPath = '';

      parts.forEach((part) => {
        accPath = accPath ? `${accPath}/${part}` : part;
        if (!currentMap.has(part)) {
          currentMap.set(part, {
            name: part,
            fullPath: accPath,
            subfolders: new Map(),
            notes: []
          });
        }
        currentMap = currentMap.get(part)!.subfolders;
      });
    });

    // 2. Distribute notes: directly to root or to their exact immediate folder
    notes.forEach((note) => {
      const folderPath = (note.folder || '').trim();
      if (!folderPath) {
        root.notes.push(note);
      } else {
        const parts = folderPath.split('/').filter(Boolean);
        let currentMap = root.subfolders;
        let targetNode: TreeNode | null = null;
        let accPath = '';

        for (const part of parts) {
          accPath = accPath ? `${accPath}/${part}` : part;
          if (!currentMap.has(part)) {
            currentMap.set(part, {
              name: part,
              fullPath: accPath,
              subfolders: new Map(),
              notes: []
            });
          }
          const foundNode = currentMap.get(part);
          if (foundNode) {
            targetNode = foundNode;
            currentMap = foundNode.subfolders;
          }
        }

        if (targetNode) {
          (targetNode as TreeNode).notes.push(note);
        } else {
          root.notes.push(note);
        }
      }
    });

    return root;
  }, [folders, notes]);

  const triggerImport = (folder: string | null) => {
    setImportTargetFolder(folder);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file, importTargetFolder);
    }
  };

  const toggleFolder = (fullPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsed((prev) => ({ ...prev, [fullPath]: !prev[fullPath] }));
  };

  const handleCreateFolderSubmit = (e: React.FormEvent, parentPath: string | null) => {
    e.preventDefault();
    const clean = newFolderName.trim();
    if (clean) {
      const fullPath = parentPath ? `${parentPath}/${clean}` : clean;
      onCreateFolder(fullPath);
      setNewFolderName('');
      setIsCreatingRootFolder(false);
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

    const rawItem = e.dataTransfer.getData('application/nexo-item');
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

  // Filter helper for search
  const matchesSearch = (title: string) => {
    if (!searchTerm.trim()) return true;
    return title.toLowerCase().includes(searchTerm.trim().toLowerCase());
  };

  // Render a note item in the IDE tree
  const renderNoteItem = (note: Note, depth: number) => {
    if (!matchesSearch(note.title)) return null;
    const isSelected = selectedNoteId === note.id;

    return (
      <div
        key={note.id}
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData('text/plain', note.id);
          e.dataTransfer.setData('application/nexo-item', JSON.stringify({ type: 'note', id: note.id }));
          e.dataTransfer.effectAllowed = 'move';
        }}
        onClick={() => onSelectNote(note)}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        className={`group py-1 pr-2 cursor-pointer flex items-center justify-between text-xs transition-colors select-none ${
          isSelected
            ? 'bg-nexo-900 text-white font-bold border-l-2 border-nexo-accent'
            : 'border-l-2 border-transparent text-nexo-300 hover:bg-nexo-900/60 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2 truncate flex-1 font-mono">
          <FileCodeIcon className="w-3.5 h-3.5 text-emerald-500/80 group-hover:text-emerald-400 shrink-0 transition-colors" />
          <span className="truncate">{note.title}.md</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onExportNote && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExportNote(note);
              }}
              className="text-[10px] text-cyan-400 hover:text-white px-1 hover:bg-cyan-950/50 transition-colors"
              title="Exportar nota (.md)"
            >
              EXP
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNote(note.id, note.title);
            }}
            className="text-[10px] text-nexo-alert hover:text-red-400 px-1 hover:bg-red-950/50 transition-colors"
            title="Eliminar nota"
          >
            DEL
          </button>
        </div>
      </div>
    );
  };

  // Recursive renderer for folders and their direct immediate notes
  const renderFolderNode = (node: TreeNode, depth: number = 0) => {
    const isCollapsed = !!collapsed[node.fullPath];
    const isDragOver = dragOverFolder === node.fullPath;
    const isAddingSub = creatingSubFor === node.fullPath;
    const directNotes = node.notes;
    const childFolders = Array.from(node.subfolders.values());

    return (
      <div key={node.fullPath} className="flex flex-col">
        {/* Folder Header Row */}
        <div
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.setData('application/nexo-item', JSON.stringify({ type: 'folder', path: node.fullPath }));
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(e) => handleDragOver(e, node.fullPath)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node.fullPath)}
          onClick={(e) => toggleFolder(node.fullPath, e)}
          style={{ paddingLeft: `${depth * 14 + 6}px` }}
          className={`group py-1 pr-2 cursor-pointer flex items-center justify-between text-xs transition-colors select-none ${
            isDragOver
              ? 'bg-emerald-950/40 border-l-2 border-emerald-400 text-emerald-300 font-bold'
              : 'border-l-2 border-transparent text-nexo-400 hover:bg-nexo-900/60 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate flex-1 font-mono">
            <span className="text-nexo-500 group-hover:text-emerald-400 shrink-0 w-3 flex justify-center">
              {isCollapsed ? <ChevronRightIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
            </span>
            <FolderIcon className="w-3.5 h-3.5 text-amber-400/90 group-hover:text-amber-300 shrink-0 transition-colors" />
            <span className="truncate font-semibold">{node.name}</span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative">
            {isDragOver && (
              <span className="text-[10px] text-emerald-400 font-bold mr-1">{t.dropHere}</span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuFolder(activeMenuFolder === node.fullPath ? null : node.fullPath);
              }}
              className="text-nexo-400 hover:text-white px-1 py-0.5 border border-transparent hover:border-nexo-700 hover:bg-nexo-850 transition-colors"
              title="Opciones de carpeta"
            >
              <DotsVerticalIcon className="w-3.5 h-3.5" />
            </button>

            {activeMenuFolder === node.fullPath && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 z-50 w-36 bg-nexo-950 border border-nexo-700 shadow-2xl py-1 font-mono text-xs flex flex-col"
              >
                {/* 1. Crear nota */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenuFolder(null);
                    onCreateNote(node.fullPath);
                  }}
                  className="px-2.5 py-1 text-left text-nexo-200 hover:text-white hover:bg-nexo-850 flex items-center gap-2"
                >
                  <FileCodeIcon className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{t.folderOptCreateNote}</span>
                </button>

                {/* 2. Crear carpeta */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenuFolder(null);
                    setCreatingSubFor(node.fullPath);
                    setIsCreatingRootFolder(false);
                    setNewFolderName('');
                  }}
                  className="px-2.5 py-1 text-left text-nexo-200 hover:text-white hover:bg-nexo-850 flex items-center gap-2"
                >
                  <FolderIcon className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>{t.folderOptCreateFolder}</span>
                </button>

                {/* 3. Importar */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenuFolder(null);
                    triggerImport(node.fullPath);
                  }}
                  className="px-2.5 py-1 text-left text-emerald-400 hover:text-emerald-300 hover:bg-nexo-850 flex items-center gap-2"
                >
                  <UploadIcon className="w-3 h-3 shrink-0" />
                  <span>{t.folderOptImport}</span>
                </button>

                {/* 4. Exportar */}
                {onExportFolder && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuFolder(null);
                      onExportFolder(node.fullPath);
                    }}
                    className="px-2.5 py-1 text-left text-cyan-400 hover:text-cyan-300 hover:bg-nexo-850 flex items-center gap-2"
                  >
                    <DownloadIcon className="w-3 h-3 shrink-0" />
                    <span>{t.folderOptExport}</span>
                  </button>
                )}

                <div className="border-t border-nexo-800 my-0.5" />

                {/* 5. Eliminar carpeta */}
                {onDeleteFolder && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuFolder(null);
                      onDeleteFolder(node.fullPath);
                    }}
                    className="px-2.5 py-1 text-left text-red-400 hover:text-red-300 hover:bg-red-950/50 flex items-center gap-2"
                  >
                    <TrashIcon className="w-3 h-3 shrink-0" />
                    <span>{t.folderOptDelete}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Subfolder form */}
        {isAddingSub && (
          <form
            onSubmit={(e) => handleCreateFolderSubmit(e, node.fullPath)}
            style={{ paddingLeft: `${(depth + 1) * 14 + 10}px` }}
            className="p-1.5 border-b border-nexo-850 bg-nexo-900/80 my-1 space-y-1"
          >
            <input
              type="text"
              autoFocus
              maxLength={60}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="subcarpeta..."
              className="w-full bg-nexo-950 border border-nexo-800 px-2 py-0.5 text-xs text-white focus:outline-none focus:border-nexo-accent font-mono"
            />
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={() => setCreatingSubFor(null)}
                className="text-[10px] text-nexo-400 hover:text-white px-1.5 py-0.5"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="bg-nexo-accent text-black font-bold text-[10px] px-2 py-0.5"
              >
                {t.create}
              </button>
            </div>
          </form>
        )}

        {/* Expanded Folder Content: Child Folders FIRST, then Direct Immediate Notes */}
        {!isCollapsed && (
          <div className="flex flex-col">
            {childFolders.map((subNode) => renderFolderNode(subNode, depth + 1))}
            {directNotes.map((note) => renderNoteItem(note, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-nexo-950 border-r border-nexo-800 flex flex-col font-mono text-xs select-none">
      {/* Explorer Top Toolbar */}
      <div className="bg-nexo-900 px-3 py-2 border-b border-nexo-850 flex items-center justify-between shrink-0">
        <span className="font-bold text-nexo-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <span>{t.explorerTitle}</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onCreateNote(null)}
            className="text-nexo-accent hover:text-emerald-300 text-[10px] px-1.5 py-0.5 border border-nexo-accent/40 bg-nexo-accent/10 font-bold"
            title="Crear nueva nota en la raíz"
          >
            {t.createNoteBtn}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreatingRootFolder(!isCreatingRootFolder);
              setCreatingSubFor(null);
              setNewFolderName('');
            }}
            className="text-nexo-300 hover:text-white text-[10px] px-1.5 py-0.5 border border-nexo-700 bg-nexo-850 font-bold"
            title="Crear nueva carpeta raíz"
          >
            {t.createFolderBtn}
          </button>
          <CyberTooltip text={t.importHint}>
            <button
              type="button"
              onClick={() => triggerImport(null)}
              className="text-emerald-400 hover:text-white p-1 border border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-900/60 font-bold flex items-center justify-center transition-colors"
              aria-label={t.importBtn}
            >
              <UploadIcon className="w-3.5 h-3.5" />
            </button>
          </CyberTooltip>
          {onExportFolder && (
            <CyberTooltip text={t.exportAll}>
              <button
                type="button"
                onClick={() => onExportFolder(null)}
                className="text-cyan-400 hover:text-white p-1 border border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-900/60 font-bold flex items-center justify-center transition-colors"
                aria-label={t.exportAll}
              >
                <DownloadIcon className="w-3.5 h-3.5" />
              </button>
            </CyberTooltip>
          )}
        </div>
      </div>

      {/* Hidden File Input for Document Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".md,.markdown,.txt,.pdf,.docx,.doc,.pptx,.xlsx,.html,.zip"
        className="hidden"
      />

      {/* Quick Search Filter */}
      <div className="p-2 border-b border-nexo-850 bg-nexo-950 shrink-0">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full bg-nexo-900 border border-nexo-800 px-2 py-1 text-xs text-nexo-200 focus:outline-none focus:border-white font-mono placeholder:text-nexo-600"
        />
      </div>

      {/* Root Folder Creation Form */}
      {isCreatingRootFolder && (
        <form
          onSubmit={(e) => handleCreateFolderSubmit(e, null)}
          className="p-2 border-b border-nexo-850 bg-nexo-900/60 shrink-0 space-y-1"
        >
          <input
            type="text"
            autoFocus
            maxLength={60}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder={t.folderPlaceholder}
            className="w-full bg-nexo-950 border border-nexo-800 px-2 py-1 text-xs text-white focus:outline-none focus:border-nexo-accent font-mono"
          />
          <div className="flex justify-end gap-1 mt-1">
            <button
              type="button"
              onClick={() => setIsCreatingRootFolder(false)}
              className="text-[10px] text-nexo-400 hover:text-white px-2 py-0.5"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="bg-nexo-accent text-black font-bold text-[10px] px-2 py-0.5"
            >
              {t.create}
            </button>
          </div>
        </form>
      )}

      {/* IDE Tree Content Area */}
      <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
        {/* Render Root Folders */}
        {Array.from(tree.subfolders.values()).map((folderNode) => renderFolderNode(folderNode, 0))}

        {/* Render Root Notes directly in the tree */}
        {tree.notes.map((note) => renderNoteItem(note, 0))}

        {tree.subfolders.size === 0 && tree.notes.length === 0 && (
          <div className="p-4 text-center text-nexo-600 font-mono text-xs">
            {t.emptyExplorer}
          </div>
        )}
      </div>

      {/* Root Drag & Drop Zone at bottom */}
      <div
        onDragOver={(e) => handleDragOver(e, '__root__')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, null)}
        className={`p-2 border-t text-center text-[10px] font-mono transition-colors shrink-0 ${
          dragOverFolder === '__root__'
            ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300 font-bold'
            : 'border-nexo-850 text-nexo-600 hover:text-nexo-400'
        }`}
      >
        {dragOverFolder === '__root__' ? t.dropHere : t.rootDropZone}
      </div>
    </div>
  );
};
