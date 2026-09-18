import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'es';

const translations = {
  en: {
    // Header
    headerTitle: 'NEXONOTES',
    headerSubtitle: '// DOCUMENTATION ENGINE & NEXO ASSISTANT',
    tabNotes: '[1] NOTES',
    tabNexo: '[2] NEXO CONSOLE',
    probing: '[PROBING SYSTEM...]',
    db: 'DB:',
    dbConnected: 'CONNECTED',
    dbFailed: 'FAILED',
    aiEngine: 'AI ENGINE:',
    aiActive: 'ACTIVE',
    aiUnconfigured: 'UNCONFIGURED',
    notesCount: 'NOTES:',
    langEn: 'EN',
    langEs: 'ES',
    madeBy: 'Made by the team at',
    sourceCode: 'SOURCE CODE',

    // NotesManager & Explorer
    explorerTitle: 'EXPLORER // FILES',
    filterLabel: 'FILTER:',
    searchPlaceholder: 'Search files and folders...',
    createNoteBtn: '+ NOTE',
    createFolderBtn: '+ FOLDER',
    addSubfolder: '+ SUB',
    folderPlaceholder: 'Folder name...',
    create: 'CREATE',
    dropHere: '[DROP HERE]',
    rootDropZone: '[MOVE TO ROOT /]',
    emptyExplorer: 'No files or folders found',
    noNoteSelectedTitle: '// NEXONOTES WORKSPACE',
    noNoteSelectedHint: 'Select a note from the explorer to view its Markdown content or create a new one.',
    createNewAction: '+ CREATE NOTE',
    importBtn: 'IMPORT',
    importHint: 'Import Markdown, Word (.docx), PDF or ZIP',
    importSuccess: "[OK] File '{title}' imported and converted to Markdown.",
    importMdSuccess: "[OK] File '{title}' imported successfully.",
    importZipSuccess: "[OK] {count} note(s) imported successfully.",
    importWarningsTitle: 'DISCARDED FILES (UNSUPPORTED FORMAT):',
    importFileTypes: 'Supported: .md, .txt, .docx, .pdf, .zip',
    importError: 'Error importing document: {error}',
    importAction: 'IMPORT FILE / ZIP',
    importingFile: 'CONVERTING TO MARKDOWN...',
    importingMdFile: 'IMPORTING FILE...',
    exportNote: 'EXPORT MD',
    exportFolder: 'EXPORT ZIP',
    exportAll: 'EXPORT ALL',
    btnEditNote: 'EDIT',
    btnCloseEdit: 'CLOSE EDIT',
    btnDeleteNote: 'DELETE',
    updatedLabel: 'UPDATED:',
    folderLabel: 'FOLDER:',
    noFolderRoot: 'root',
    tagsLabel: 'TAGS:',
    allTags: 'ALL',
    noTags: 'no tags',

    // Folder context menu options
    folderOptCreateNote: 'Create note',
    folderOptCreateFolder: 'Create folder',
    folderOptImport: 'Import',
    folderOptExport: 'Export',
    folderOptCopy: 'Copy folder',
    folderOptPaste: 'Paste here',
    folderOptDelete: 'Delete folder',

    // Note context menu options
    noteOptOpen: 'Open / View',
    noteOptCopy: 'Copy note',
    noteOptExport: 'Export (.md)',
    noteOptDelete: 'Delete note',

    // Clipboard & Shortcuts
    itemCopied: "[CLIPBOARD] Copied: {name}",
    itemPasted: "[SYSTEM] Pasted successfully to: {target}",
    clipboardEmpty: "[CLIPBOARD] Clipboard is empty",

    // Deletion Modal
    deleteTitle: '[CONFIRMATION]',
    deleteWarning: 'WARNING: This operation will permanently delete the record from the database.',
    deleteFolderTitle: '[DELETE FOLDER CONFIRMATION]',
    deleteFolderWarning: 'WARNING: This operation will permanently delete the folder /{folder} and ALL notes and subfolders inside it.',
    cancel: 'CANCEL',
    executeDelete: 'DELETE',
    executePurge: 'DELETE',

    // System Messages
    noteSavedOk: "[OK] Note '{title}' saved successfully.",
    noteCreatedOk: "[OK] Note '{title}' created successfully.",
    noteVectorFailed: "[ERROR] Note '{title}' saved, but vectorization failed: {error}",
    noteTransferred: "[SYSTEM] Note moved to: {target}",
    folderCreated: "[SYSTEM] Folder /{folder} created.",
    folderDeletedOk: "[OK] Folder /{folder} and its contents deleted successfully.",
    recordPurged: "[OK] Note deleted successfully.",
    errorLoading: "Error loading records from database",
    errorProcessing: "Error processing note",
    errorMoving: "Error moving note",
    errorDeleting: "Error deleting note",

    // NoteEditor
    editNoteTitle: '[EDITING NOTE:',
    newNoteTitle: '[NEW NOTE]',
    modeEdit: 'EDIT',
    modeSplit: 'SPLIT',
    modePreview: 'PREVIEW',
    discard: 'CANCEL',
    saveNote: '[SAVE NOTE]',
    savingNote: '[SAVING NOTE...]',
    titleRequired: 'The TITLE field is required.',
    contentRequired: 'The CONTENT field is required.',
    docTitleLabel: 'DOCUMENT TITLE:',
    docTitlePlaceholder: 'e.g. Architecture Guide',
    folderInputLabel: 'FOLDER (OPTIONAL):',
    folderInputPlaceholder: 'e.g. backend/api or leave empty for root',
    tagsInputLabel: 'TECHNICAL TAGS (COMMA SEPARATED):',
    contentHeader: 'CONTENT (MARKDOWN)',
    editorPlaceholder: 'Write in Markdown. Use # for headings, `code`, etc.',
    previewHeader: 'TECHNICAL RENDER',
    noPreviewContent: '[No content to preview]',
    bytesLength: 'LENGTH:',
    linesCount: 'LINES:',

    // NexoConsole
    nexoConsoleTitle: 'NEXO EXECUTIVE CONSOLE // RAG ENGINE',
    nexoSubtitle: '[INFERENCE ENGINE: ACTIVE | RAG ENGINE: CONNECTED]',
    topKLabel: 'NOTAS CONTEXTO:',
    topKTooltip: 'Number of most relevant notes that the RAG engine retrieves using pgvector to provide context to Nexo.',
    systemIdle: 'Standing by for command or interaction',
    clearSession: 'CLEAR SESSION',
    welcomeTitle: 'NEXO // DOCUMENTATION ENGINE & ASSISTANT',
    welcomeSubtitle: 'GENERATIVE RETRIEVAL AND QUERY SYSTEM',
    rulesHeader: '// OPERATIONAL RULES OF NEXO ASSISTANT',
    rule1: '1. Nexo answers exclusively using information extracted from stored notes.',
    rule2: '2. Each statement strictly cites its source document [Source: Title (ID)].',
    rule3: "3. In the absence of relevant context, it will declare: 'No hay información en las notas sobre este tema.'",
    rule4: '4. Responses are generated continuously in real time.',
    userRole: 'USER',
    nexoRole: 'NEXO',
    streamingStatus: '[GENERATING RESPONSE...]',
    totalLatency: 'TOTAL LATENCY:',
    retrievedSources: 'RETRIEVED SOURCES',
    docRelevance: 'RELEVANCE',
    startingStream: '[NEXO GENERATING RESPONSE // RETRIEVING CONTEXT...]',
    queryPrefix: 'QUERY >',
    queryPlaceholder: "Write your technical query for Nexo (e.g. 'What are the backend endpoints?')...",
    queryButton: 'QUERY [ENTER]',
    queryButtonStreaming: 'GENERATING RESPONSE...'
  },
  es: {
    // Header
    headerTitle: 'NEXONOTES',
    headerSubtitle: '// MOTOR DOCUMENTAL Y ASISTENTE NEXO',
    tabNotes: '[1] NOTAS',
    tabNexo: '[2] CONSOLA NEXO',
    probing: '[SONDEANDO SISTEMA...]',
    db: 'DB:',
    dbConnected: 'CONECTADO',
    dbFailed: 'FALLO',
    aiEngine: 'MOTOR IA:',
    aiActive: 'ACTIVO',
    aiUnconfigured: 'SIN CONFIGURAR',
    notesCount: 'NOTAS:',
    langEn: 'EN',
    langEs: 'ES',
    madeBy: 'Hecho por el equipo de',
    sourceCode: 'CÓDIGO FUENTE',

    // NotesManager & Explorer
    explorerTitle: 'EXPLORADOR // ARCHIVOS',
    filterLabel: 'FILTRAR:',
    searchPlaceholder: 'Buscar archivos y carpetas...',
    createNoteBtn: '+ NOTA',
    createFolderBtn: '+ CARPETA',
    addSubfolder: '+ SUB',
    folderPlaceholder: 'Nombre de carpeta...',
    create: 'CREAR',
    dropHere: '[SOLTAR AQUÍ]',
    rootDropZone: '[MOVER A RAÍZ /]',
    emptyExplorer: 'No se encontraron notas ni carpetas',
    noNoteSelectedTitle: '// ESPACIO DE TRABAJO NEXONOTES',
    noNoteSelectedHint: 'Selecciona una nota del explorador para ver su contenido en Markdown o crea una nueva.',
    createNewAction: '+ CREAR NOTA',
    importBtn: 'IMPORTAR',
    importHint: 'Importar Markdown, Word (.docx), PDF o ZIP',
    importSuccess: "[OK] Archivo '{title}' importado y convertido a Markdown.",
    importMdSuccess: "[OK] Archivo '{title}' importado correctamente.",
    importZipSuccess: "[OK] Se importaron {count} nota(s) correctamente.",
    importWarningsTitle: 'ARCHIVOS DESCARTADOS (FORMATO NO PERMITIDO):',
    importFileTypes: 'Admitidos: .md, .txt, .docx, .pdf, .zip',
    importError: 'Error al importar documento: {error}',
    importAction: 'IMPORTAR ARCHIVO / ZIP',
    importingFile: 'CONVIRTIENDO A MARKDOWN...',
    importingMdFile: 'IMPORTANDO ARCHIVO...',
    exportNote: 'EXPORTAR MD',
    exportFolder: 'EXPORTAR ZIP',
    exportAll: 'EXPORTAR TODO',
    btnEditNote: 'EDITAR',
    btnCloseEdit: 'CERRAR EDICIÓN',
    btnDeleteNote: 'ELIMINAR',
    updatedLabel: 'ACTUALIZADO:',
    folderLabel: 'CARPETA:',
    noFolderRoot: 'raíz',
    tagsLabel: 'ETIQUETAS:',
    allTags: 'TODAS',
    noTags: 'sin etiquetas',

    // Folder context menu options (en orden exacto: crear nota, crear carpeta, importar, exportar, eliminar)
    folderOptCreateNote: 'Crear nota',
    folderOptCreateFolder: 'Crear carpeta',
    folderOptImport: 'Importar',
    folderOptExport: 'Exportar',
    folderOptCopy: 'Copiar carpeta',
    folderOptPaste: 'Pegar aquí',
    folderOptDelete: 'Eliminar carpeta',

    // Note context menu options
    noteOptOpen: 'Abrir / Ver',
    noteOptCopy: 'Copiar nota',
    noteOptExport: 'Exportar (.md)',
    noteOptDelete: 'Eliminar nota',

    // Clipboard & Shortcuts
    itemCopied: "[PORTAPAPELES] Copiado: {name}",
    itemPasted: "[SISTEMA] Pegado exitoso en: {target}",
    clipboardEmpty: "[PORTAPAPELES] El portapapeles está vacío",

    // Deletion Modal
    deleteTitle: '[CONFIRMACION]',
    deleteWarning: 'ADVERTENCIA: Esta operacion eliminara de forma permanente la nota de la base de datos.',
    deleteFolderTitle: '[CONFIRMACION DE ELIMINACION DE CARPETA]',
    deleteFolderWarning: 'ADVERTENCIA: Esta operacion eliminara la carpeta /{folder} y TODAS las notas y subcarpetas contenidas en ella de forma permanente.',
    cancel: 'CANCELAR',
    executeDelete: 'ELIMINAR',
    executePurge: 'ELIMINAR',

    // System Messages
    noteSavedOk: "[OK] Nota '{title}' guardada correctamente.",
    noteCreatedOk: "[OK] Nota '{title}' creada correctamente.",
    noteVectorFailed: "[ERROR] Nota '{title}' guardada, pero falló la vectorización: {error}",
    noteTransferred: "[SISTEMA] Nota transferida exitosamente a: {target}",
    folderCreated: "[SISTEMA] Carpeta /{folder} creada.",
    folderDeletedOk: "[OK] Carpeta /{folder} y su contenido eliminados correctamente.",
    recordPurged: "[OK] Nota eliminada correctamente.",
    errorLoading: "Error al cargar registros desde la base de datos",
    errorProcessing: "Error al procesar nota",
    errorMoving: "Error al mover nota",
    errorDeleting: "Error al eliminar nota",

    // NoteEditor
    editNoteTitle: '[EDITANDO NOTA:',
    newNoteTitle: '[NUEVA NOTA]',
    modeEdit: 'EDICION',
    modeSplit: 'DIVIDIDO',
    modePreview: 'VISTA PREVIA',
    discard: 'CANCELAR',
    saveNote: '[GUARDAR NOTA]',
    savingNote: '[GUARDANDO NOTA...]',
    titleRequired: 'El campo TITULO es obligatorio.',
    contentRequired: 'El campo CONTENIDO es obligatorio.',
    docTitleLabel: 'TITULO DEL DOCUMENTO:',
    docTitlePlaceholder: 'Ejemplo: Guía de Arquitectura',
    folderInputLabel: 'CARPETA (OPCIONAL):',
    folderInputPlaceholder: 'Ej: backend/api o dejar vacío para raíz',
    tagsInputLabel: 'ETIQUETAS TECNICAS (SEPARADAS POR COMA):',
    contentHeader: 'CONTENIDO (MARKDOWN)',
    editorPlaceholder: 'Escriba el cuerpo en Markdown. Use # para encabezados, `codigo`, etc.',
    previewHeader: 'RENDERIZADO TECNICO',
    noPreviewContent: '[Sin contenido para previsualizar]',
    bytesLength: 'LONGITUD:',
    linesCount: 'LINEAS:',

    // NexoConsole
    nexoConsoleTitle: 'CONSOLA EJECUTIVA NEXO // RAG ENGINE',
    nexoSubtitle: '[MOTOR DE INFERENCIA: ACTIVO | MOTOR RAG: CONECTADO]',
    topKLabel: 'NOTAS CONTEXTO:',
    topKTooltip: 'Cantidad de notas más relevantes que el motor RAG busca con pgvector y provee a Nexo como base de conocimiento para contestar.',
    systemIdle: 'En espera de comando o interacción',
    clearSession: 'LIMPIAR SESION',
    welcomeTitle: 'NEXO // MOTOR DOCUMENTAL Y ASISTENTE',
    welcomeSubtitle: 'SISTEMA DE RECUPERACION GENERATIVA Y CONSULTA',
    rulesHeader: '// REGLAS OPERATIVAS DEL ASISTENTE NEXO',
    rule1: '1. Nexo responde exclusivamente con informacion extraida de las notas almacenadas.',
    rule2: '2. Cada afirmacion cita de manera precisa la fuente documental [Fuente: Título (ID)].',
    rule3: "3. En ausencia de contexto relevante, declarara: 'No hay información en las notas sobre este tema.'",
    rule4: '4. Las respuestas se generan de forma continua en tiempo real.',
    userRole: 'USUARIO',
    nexoRole: 'NEXO',
    streamingStatus: '[GENERANDO RESPUESTA...]',
    totalLatency: 'LATENCIA TOTAL:',
    retrievedSources: 'FUENTES RECUPERADAS',
    docRelevance: 'RELEVANCIA',
    startingStream: '[NEXO INICIANDO TRANSMISION // RECUPERANDO CONTEXTO...]',
    queryPrefix: 'QUERY >',
    queryPlaceholder: "Escriba su consulta tecnica para Nexo (ej: '¿Cuales son los endpoints del backend?')...",
    queryButton: 'CONSULTAR [ENTER]',
    queryButtonStreaming: 'GENERANDO RESPUESTA...'
  }
};

type Translations = typeof translations.en;

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ponytail: Default directly to Spanish as requested
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('nexonotes_lang');
    return (saved === 'es' || saved === 'en') ? saved : 'es';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('nexonotes_lang', newLang);
  };

  const t = translations[lang];

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
