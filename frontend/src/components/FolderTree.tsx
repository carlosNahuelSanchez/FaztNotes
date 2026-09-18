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
  TrashIcon,
  CopyIcon,
  ClipboardIcon,
  EditIcon
} from './CyberIcons';
import { CyberTooltip } from './CyberTooltip';

interface FolderTreeProps {
  notes: Note[];
  folders: string[];
  selectedNoteId: string | null;
  selectedFolder?: string | null;
  selectedType?: 'note' | 'folder' | null;
  onSelectType?: (type: 'note' | 'folder' | null) => void;
  onSelectFolder?: (folder: string | null) => void;
  onSelectNote: (note: Note) => void;
  onDeleteNote: (id: string, title: string) => void;
  onDeleteFolder?: (folderPath: string) => void;
  onCreateFolder: (name: string) => void;
  onCreateNote: (folder?: string | null) => void;
  onImportFile: (file: File, folderTarget?: string | null) => void;
  onExportFolder?: (folder: string | null) => void;
  onExportNote?: (note: Note) => void;
  onCopyNote?: (note: Note) => void;
  onCopyFolder?: (folderPath: string) => void;
  onPaste?: (targetFolder: string | null) => void;
  hasClipboardItem?: boolean;
  onDropNoteOnFolder: (noteId: string, folderName: string | null) => void;
  onMoveFolder: (sourceFolder: string, targetFolder: string | null) => void;
  onRenameNote?: (note: Note, newTitle: string) => void;
  onRenameFolder?: (oldFolder: string, newFolder: string) => void;
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
  selectedFolder,
  selectedType,
  onSelectType,
  onSelectFolder,
  onSelectNote,
  onDeleteNote,
  onDeleteFolder,
  onCreateFolder,
  onCreateNote,
  onImportFile,
  onExportFolder,
  onExportNote,
  onCopyNote,
  onCopyFolder,
  onPaste,
  hasClipboardItem = false,
  onDropNoteOnFolder,
  onMoveFolder,
  onRenameNote,
  onRenameFolder
}) => {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importTargetFolder, setImportTargetFolder] = useState<string | null>(null);
  const [activeMenuFolder, setActiveMenuFolder] = useState<string | null>(null);
  const [activeMenuNote, setActiveMenuNote] = useState<string | null>(null);
  const [isCreatingRootFolder, setIsCreatingRootFolder] = useState(false);
  const [creatingSubFor, setCreatingSubFor] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null);
  const [renameNoteTitle, setRenameNoteTitle] = useState<string>('');
  const [renamingFolderPath, setRenamingFolderPath] = useState<string | null>(null);
  const [renameFolderName, setRenameFolderName] = useState<string>('');
  const [lastSelectedType, setLastSelectedType] = useState<'note' | 'folder' | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const activeSelectedType = selectedType !== undefined ? selectedType : lastSelectedType;
  const setEffectiveSelectedType = (type: 'note' | 'folder' | null) => {
    setLastSelectedType(type);
    if (onSelectType) onSelectType(type);
  };

  const selectedTypeRef = useRef<'note' | 'folder' | null>(activeSelectedType);
  selectedTypeRef.current = activeSelectedType;
  const selectedFolderRef = useRef<string | null>(selectedFolder || null);
  selectedFolderRef.current = selectedFolder || null;
  const selectedNoteIdRef = useRef<string | null>(selectedNoteId);
  selectedNoteIdRef.current = selectedNoteId;
  const notesRef = useRef<Note[]>(notes);
  notesRef.current = notes;

  const startRenameNote = (note: Note) => {
    setActiveMenuNote(null);
    setRenamingFolderPath(null);
    setRenamingNoteId(note.id);
    setRenameNoteTitle(note.title);
  };

  const startRenameFolder = (folderPath: string) => {
    setActiveMenuFolder(null);
    setRenamingNoteId(null);
    const folderName = folderPath.split('/').pop() || folderPath;
    setRenamingFolderPath(folderPath);
    setRenameFolderName(folderName);
  };

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuFolder(null);
      setActiveMenuNote(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenuFolder(null);
        setActiveMenuNote(null);
        setIsCreatingRootFolder(false);
        setCreatingSubFor(null);
        setRenamingNoteId(null);
        setRenamingFolderPath(null);
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'r') {
        const target = e.target as HTMLElement;
        const isInput = (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        );
        if (!isInput) {
          const curType = selectedTypeRef.current;
          const curFolder = selectedFolderRef.current;
          const curNoteId = selectedNoteIdRef.current;
          const curNotes = notesRef.current;

          if (curType === 'folder' && curFolder) {
            e.preventDefault();
            startRenameFolder(curFolder);
          } else if (curType === 'note' && curNoteId) {
            const found = curNotes.find((n) => n.id === curNoteId);
            if (found) {
              e.preventDefault();
              startRenameNote(found);
            }
          } else if (curFolder && !curNoteId) {
            e.preventDefault();
            startRenameFolder(curFolder);
          } else if (curNoteId) {
            const found = curNotes.find((n) => n.id === curNoteId);
            if (found) {
              e.preventDefault();
              startRenameNote(found);
            }
          }
        }
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'c')) {
        const target = e.target as HTMLElement;
        const isInput = (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        );
        if (!isInput) {
          e.preventDefault();
          const curFolder = selectedFolderRef.current;
          if (curFolder) {
            setCreatingSubFor((prev) => (prev === curFolder ? null : curFolder));
            setCollapsed((prev) => ({ ...prev, [curFolder]: false }));
            setIsCreatingRootFolder(false);
          } else {
            setIsCreatingRootFolder((prev) => !prev);
            setCreatingSubFor(null);
          }
          setNewFolderName('');
        }
      }
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
    e.stopPropagation();
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

    // Case 1: External files dropped from OS file manager / desktop
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      for (const file of filesArray) {
        onImportFile(file, folderTarget);
      }
      return;
    }

    // Case 2: Internal drag & drop of notes and folders within the tree
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

  // Filter helper for search: searches title, content and tags
  const matchesSearch = (note: Note) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.trim().toLowerCase();
    const titleMatch = note.title.toLowerCase().includes(q);
    const contentMatch = (note.content || '').toLowerCase().includes(q);
    const tagMatch = (note.tags || []).some((t) => t.toLowerCase().includes(q));
    return titleMatch || contentMatch || tagMatch;
  };

  // Helper to check if a folder node has any matching note or subfolder
  const folderHasMatch = (node: TreeNode, query: string): boolean => {
    if (!query) return false;
    const q = query.toLowerCase();
    if (node.name.toLowerCase().includes(q)) return true;
    if (node.notes.some((note) => matchesSearch(note))) return true;
    for (const sub of node.subfolders.values()) {
      if (folderHasMatch(sub, query)) return true;
    }
    return false;
  };

  // Render a note item in the IDE tree
  const renderNoteItem = (note: Note, depth: number) => {
    if (!matchesSearch(note)) return null;
    const isSelected = activeSelectedType === 'note' && selectedNoteId === note.id;

    if (renamingNoteId === note.id) {
      return (
        <form
          key={note.id}
          onSubmit={(e) => {
            e.preventDefault();
            if (renameNoteTitle.trim() && onRenameNote) {
              onRenameNote(note, renameNoteTitle.trim());
            }
            setRenamingNoteId(null);
          }}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className="py-1 pr-2 flex items-center gap-1.5 text-xs bg-nexo-900/90 border-l-2 border-nexo-accent font-mono my-0.5"
        >
          <FileCodeIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={renameNoteTitle}
            onChange={(e) => setRenameNoteTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setRenamingNoteId(null);
            }}
            className="flex-1 bg-nexo-950 border border-nexo-700 px-1.5 py-0.5 text-xs text-white focus:outline-none focus:border-nexo-accent font-mono"
          />
          <button type="submit" className="text-[10px] bg-nexo-accent text-black font-bold px-1.5 py-0.5">
            OK
          </button>
          <button
            type="button"
            onClick={() => setRenamingNoteId(null)}
            className="text-[10px] text-nexo-400 hover:text-white px-1 py-0.5"
          >
            X
          </button>
        </form>
      );
    }

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
        onClick={() => {
          setEffectiveSelectedType('note');
          onSelectNote(note);
        }}
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

        {/* 3-dots Menu for note */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuNote(activeMenuNote === note.id ? null : note.id);
              setActiveMenuFolder(null);
            }}
            className="text-nexo-400 hover:text-white px-1 py-0.5 border border-transparent hover:border-nexo-700 hover:bg-nexo-850 opacity-0 group-hover:opacity-100 transition-all"
            title="Opciones de archivo"
          >
            <DotsVerticalIcon className="w-3.5 h-3.5" />
          </button>

          {activeMenuNote === note.id && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 z-50 w-36 bg-nexo-950 border border-nexo-700 shadow-2xl py-1 font-mono text-xs flex flex-col"
            >
              {/* 1. Abrir / Ver */}
              <button
                type="button"
                onClick={() => {
                  setActiveMenuNote(null);
                  onSelectNote(note);
                }}
                className="px-2.5 py-1 text-left text-nexo-200 hover:text-white hover:bg-nexo-850 flex items-center gap-2"
              >
                <FileCodeIcon className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{t.noteOptOpen}</span>
              </button>

              {/* 2. Renombrar */}
              {onRenameNote && (
                <button
                  type="button"
                  onClick={() => startRenameNote(note)}
                  className="px-2.5 py-1 text-left text-nexo-200 hover:text-white hover:bg-nexo-850 flex items-center gap-2"
                >
                  <EditIcon className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>{t.noteOptRename}</span>
                </button>
              )}

              {/* 3. Copiar */}
              {onCopyNote && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenuNote(null);
                    onCopyNote(note);
                  }}
                  className="px-2.5 py-1 text-left text-nexo-200 hover:text-white hover:bg-nexo-850 flex items-center gap-2"
                >
                  <CopyIcon className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>{t.noteOptCopy}</span>
                </button>
              )}

              {/* 4. Exportar */}
              {onExportNote && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenuNote(null);
                    onExportNote(note);
                  }}
                  className="px-2.5 py-1 text-left text-lime-400 hover:text-lime-300 hover:bg-nexo-850 flex items-center gap-2"
                >
                  <UploadIcon className="w-3 h-3 shrink-0" />
                  <span>{t.noteOptExport}</span>
                </button>
              )}

              <div className="border-t border-nexo-800 my-0.5" />

              {/* 5. Eliminar */}
              <button
                type="button"
                onClick={() => {
                  setActiveMenuNote(null);
                  onDeleteNote(note.id, note.title);
                }}
                className="px-2.5 py-1 text-left text-red-400 hover:text-red-300 hover:bg-red-950/50 flex items-center gap-2"
              >
                <TrashIcon className="w-3 h-3 shrink-0" />
                <span>{t.noteOptDelete}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Recursive renderer for folders and their direct immediate notes
  const renderFolderNode = (node: TreeNode, depth: number = 0) => {
    const isSearching = !!searchTerm.trim();
    const hasMatch = isSearching ? folderHasMatch(node, searchTerm.trim()) : false;
    const isCollapsed = isSearching ? !hasMatch : !!collapsed[node.fullPath];
    const isFolderSelected = activeSelectedType === 'folder' && selectedFolder === node.fullPath;
    const isDragOver = dragOverFolder === node.fullPath;
    const isAddingSub = creatingSubFor === node.fullPath;
    const directNotes = node.notes;
    const childFolders = Array.from(node.subfolders.values());

    if (isSearching && !hasMatch) {
      return null;
    }

    if (renamingFolderPath === node.fullPath) {
      return (
        <form
          key={node.fullPath}
          onSubmit={(e) => {
            e.preventDefault();
            const cleanName = renameFolderName.trim();
            if (cleanName && cleanName !== node.name && onRenameFolder) {
              const parts = node.fullPath.split('/');
              parts.pop();
              const parentPath = parts.join('/');
              const newFullPath = parentPath ? `${parentPath}/${cleanName}` : cleanName;
              onRenameFolder(node.fullPath, newFullPath);
            }
            setRenamingFolderPath(null);
          }}
          style={{ paddingLeft: `${depth * 14 + 6}px` }}
          className="py-1 pr-2 flex items-center gap-1.5 text-xs bg-nexo-900/90 border-l-2 border-amber-400 font-mono my-0.5"
        >
          <FolderIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={renameFolderName}
            onChange={(e) => setRenameFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setRenamingFolderPath(null);
            }}
            className="flex-1 bg-nexo-950 border border-nexo-700 px-1.5 py-0.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
          />
          <button type="submit" className="text-[10px] bg-amber-400 text-black font-bold px-1.5 py-0.5">
            OK
          </button>
          <button
            type="button"
            onClick={() => setRenamingFolderPath(null)}
            className="text-[10px] text-nexo-400 hover:text-white px-1 py-0.5"
          >
            X
          </button>
        </form>
      );
    }

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
          onClick={(e) => {
            toggleFolder(node.fullPath, e);
            setEffectiveSelectedType('folder');
            if (onSelectFolder) onSelectFolder(node.fullPath);
          }}
          style={{ paddingLeft: `${depth * 14 + 6}px` }}
          className={`group py-1 pr-2 cursor-pointer flex items-center justify-between text-xs transition-colors select-none ${
            isFolderSelected
              ? 'bg-nexo-850 text-white border-l-2 border-emerald-400 font-semibold'
              : isDragOver
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
                setActiveMenuNote(null);
              }}
              className="text-nexo-400 hover:text-white px-1 py-0.5 border border-transparent hover:border-nexo-700 hover:bg-nexo-850 transition-colors"
              title="Opciones de carpeta"
            >
              <DotsVerticalIcon className="w-3.5 h-3.5" />
            </button>

            {activeMenuFolder === node.fullPath && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 z-50 w-40 bg-nexo-950 border border-nexo-700 shadow-2xl py-1 font-mono text-xs flex flex-col"
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

                {/* 3. Renombrar carpeta */}
                {onRenameFolder && (
                  <button
                    type="button"
                    onClick={() => startRenameFolder(node.fullPath)}
                    className="px-2.5 py-1 text-left text-nexo-200 hover:text-white hover:bg-nexo-850 flex items-center gap-2"
                  >
                    <EditIcon className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{t.folderOptRename}</span>
                  </button>
                )}

                {/* 4. Importar */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenuFolder(null);
                    triggerImport(node.fullPath);
                  }}
                  className="px-2.5 py-1 text-left text-emerald-400 hover:text-emerald-300 hover:bg-nexo-850 flex items-center gap-2"
                >
                  <DownloadIcon className="w-3 h-3 shrink-0" />
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
                    className="px-2.5 py-1 text-left text-lime-400 hover:text-lime-300 hover:bg-nexo-850 flex items-center gap-2"
                  >
                    <UploadIcon className="w-3 h-3 shrink-0" />
                    <span>{t.folderOptExport}</span>
                  </button>
                )}

                {/* 5. Copiar carpeta */}
                {onCopyFolder && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuFolder(null);
                      onCopyFolder(node.fullPath);
                    }}
                    className="px-2.5 py-1 text-left text-nexo-200 hover:text-white hover:bg-nexo-850 flex items-center gap-2"
                  >
                    <CopyIcon className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>{t.folderOptCopy}</span>
                  </button>
                )}

                {/* 6. Pegar en esta carpeta */}
                {onPaste && hasClipboardItem && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuFolder(null);
                      onPaste(node.fullPath);
                    }}
                    className="px-2.5 py-1 text-left text-emerald-400 hover:text-emerald-300 hover:bg-nexo-850 flex items-center gap-2"
                  >
                    <ClipboardIcon className="w-3 h-3 shrink-0" />
                    <span>{t.folderOptPaste}</span>
                  </button>
                )}

                <div className="border-t border-nexo-800 my-0.5" />

                {/* 7. Eliminar carpeta */}
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
      <div className="bg-nexo-900 px-2 py-1.5 border-b border-nexo-850 flex items-center justify-between gap-2 shrink-0 relative z-30">
        <div className="font-bold text-nexo-300 text-[10px] uppercase tracking-wider shrink-0 leading-tight flex flex-col select-none">
          {t.explorerTitle.includes('//') ? (
            <>
              <span>{t.explorerTitle.split('//')[0].trim()}</span>
              <span className="text-nexo-500 text-[9px]">// {t.explorerTitle.split('//')[1].trim()}</span>
            </>
          ) : (
            <span>{t.explorerTitle}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <button
            type="button"
            onClick={() => {
              const targetFolder = activeSelectedType === 'folder'
                ? (selectedFolder || null)
                : (notes.find((n) => n.id === selectedNoteId)?.folder || selectedFolder || null);
              onCreateNote(targetFolder);
            }}
            className="flex-1 text-center bg-nexo-accent hover:bg-emerald-400 text-black font-bold text-[10px] py-1 transition-colors uppercase tracking-wider truncate"
            title="Crear nueva nota"
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
            className="flex-1 text-center border border-nexo-700 bg-nexo-850 hover:bg-nexo-800 text-nexo-200 hover:text-white text-[10px] py-1 transition-colors uppercase tracking-wider truncate"
            title="Crear nueva carpeta raíz"
          >
            {t.createFolderBtn}
          </button>
          <CyberTooltip text={t.importHint} position="bottom" align="right">
            <button
              type="button"
              onClick={() => triggerImport(selectedFolder || null)}
              className="text-emerald-400 hover:text-white p-1 border border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-900/60 font-bold flex items-center justify-center transition-colors shrink-0"
              aria-label={t.importBtn}
            >
              <DownloadIcon className="w-3.5 h-3.5" />
            </button>
          </CyberTooltip>
          {onExportFolder && (
            <CyberTooltip text={t.exportAll} position="bottom" align="right">
              <button
                type="button"
                onClick={() => onExportFolder(null)}
                className="text-lime-400 hover:text-white p-1 border border-lime-500/40 bg-lime-950/20 hover:bg-lime-900/60 font-bold flex items-center justify-center transition-colors shrink-0"
                aria-label={t.exportAll}
              >
                <UploadIcon className="w-3.5 h-3.5" />
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

      {/* IDE Tree Content Area: acts as root drop target when dragging over root space */}
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setEffectiveSelectedType(null);
            if (onSelectFolder) onSelectFolder(null);
            if (onSelectNote) onSelectNote(null as any);
            setActiveMenuFolder(null);
            setActiveMenuNote(null);
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (!dragOverFolder || dragOverFolder === '__root__') {
            setDragOverFolder('__root__');
          }
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragOverFolder(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOverFolder(null);
          handleDrop(e, null);
        }}
        className={`flex-1 overflow-y-auto p-1.5 space-y-0.5 transition-colors ${
          dragOverFolder === '__root__'
            ? 'bg-emerald-950/25 ring-2 ring-emerald-500/80 ring-inset'
            : ''
        }`}
      >
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
    </div>
  );
};
