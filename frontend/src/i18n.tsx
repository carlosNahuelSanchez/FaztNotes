import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'es';

const translations = {
  en: {
    // Header
    headerTitle: 'FAZTNOTES',
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

    // NotesManager
    filterLabel: 'FILTER:',
    searchPlaceholder: 'Search in title or content...',
    createNoteBtn: '+ CREATE NEW NOTE',
    tagsLabel: 'TAGS:',
    allTags: 'ALL',
    recordsCount: 'RECORDS:',
    dragHint: 'DRAG TO FOLDER',
    deleteTitle: '[PERMANENT DELETION CONFIRMATION]',
    deleteWarning: 'WARNING: This operation will irreversibly remove the record from the database.',
    cancel: 'CANCEL',
    executePurge: 'EXECUTE PURGE',
    noteSavedOk: "[OK] Note '{title}' saved and vectorized.",
    noteCreatedOk: "[OK] Note '{title}' created in root and vectorized.",
    noteTransferred: "[SYSTEM] Note successfully transferred to: {target}",
    folderCreated: "[SYSTEM] Folder /{folder} created.",
    recordPurged: "[OK] Record {id} purged from database.",
    errorLoading: "Error loading notes",
    errorProcessing: "Error processing note",
    errorMoving: "Error moving note",
    errorDeleting: "Error deleting note",

    // FolderTree
    directoriesTitle: 'DIRECTORIES',
    addFolder: '+ FOLDER',
    addSubfolder: '+ SUB',
    folderPlaceholder: 'Folder name...',
    create: 'CREATE',
    allNotes: '[/] ALL',
    rootFolder: '[#] ROOT / NO FOLDER',
    dropHere: '[DROP]',

    // NoteList
    loadingRecords: '[LOADING RECORDS FROM POSTGRESQL...]',
    noNotesFound: '[NO NOTES FOUND UNDER CURRENT CRITERIA]',
    vectStatus: 'VECT',
    noVectStatus: 'NO-VECT',
    deleteShort: 'DEL',
    noTags: '[no tags]',

    // NoteEditor
    editNoteTitle: '[EDIT NOTE:',
    newNoteTitle: '[NEW NOTE]',
    vectorizedBadge: 'VECTORIZED',
    noVectorBadge: 'NO VECTOR',
    modeEdit: 'EDIT',
    modeSplit: 'SPLIT',
    modePreview: 'PREVIEW',
    discard: 'DISCARD',
    saveNote: '[SAVE NOTE]',
    savingNote: '[SAVING & VECTORIZING...]',
    titleRequired: 'The TITLE field is required.',
    contentRequired: 'The CONTENT field is required.',
    docTitleLabel: 'DOCUMENT TITLE:',
    docTitlePlaceholder: 'Example: RAG Pipelines Architecture',
    tagsInputLabel: 'TECHNICAL TAGS (COMMA SEPARATED):',
    contentHeader: 'CONTENT (MARKDOWN)',
    editorPlaceholder: 'Write body in Markdown. Use # for headings, `code`, etc.',
    previewHeader: 'TECHNICAL RENDER',
    noPreviewContent: '[No content to preview]',
    bytesLength: 'LENGTH:',
    linesCount: 'LINES:',

    // NexoConsole
    nexoConsoleTitle: 'NEXO EXECUTIVE CONSOLE // RAG ENGINE',
    nexoSubtitle: '[INFERENCE ENGINE: ACTIVE | RAG ENGINE: CONNECTED]',
    topKLabel: 'TOP-K:',
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
    headerTitle: 'FAZTNOTES',
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

    // NotesManager
    filterLabel: 'FILTRAR:',
    searchPlaceholder: 'Buscar en titulo o contenido...',
    createNoteBtn: '+ CREAR NUEVA NOTA',
    tagsLabel: 'ETIQUETAS:',
    allTags: 'TODAS',
    recordsCount: 'REGISTROS:',
    dragHint: 'ARRASTRE A CARPETA',
    deleteTitle: '[CONFIRMACION DE ELIMINACION PERMANENTE]',
    deleteWarning: 'ADVERTENCIA: Esta operacion eliminara de forma irreversible el registro de la base de datos.',
    cancel: 'CANCELAR',
    executePurge: 'EJECUTAR PURGA',
    noteSavedOk: "[OK] Nota '{title}' guardada y vectorizada.",
    noteCreatedOk: "[OK] Nota '{title}' creada en raiz y vectorizada.",
    noteTransferred: "[SISTEMA] Nota transferida exitosamente a: {target}",
    folderCreated: "[SISTEMA] Carpeta /{folder} creada.",
    recordPurged: "[OK] Registro {id} purgado de la base de datos.",
    errorLoading: "Error al cargar notas",
    errorProcessing: "Error al procesar nota",
    errorMoving: "Error al mover nota",
    errorDeleting: "Error al eliminar",

    // FolderTree
    directoriesTitle: 'DIRECTORIOS',
    addFolder: '+ CARPETA',
    addSubfolder: '+ SUB',
    folderPlaceholder: 'Nombre de carpeta...',
    create: 'CREAR',
    allNotes: '[/] TODAS',
    rootFolder: '[#] RAIZ / SIN CARPETA',
    dropHere: '[SOLTAR]',

    // NoteList
    loadingRecords: '[CARGANDO REGISTROS DESDE POSTGRESQL...]',
    noNotesFound: '[NO SE REGISTRAN NOTAS BAJO EL CRITERIO ACTUAL]',
    vectStatus: 'VECT',
    noVectStatus: 'SIN-VECT',
    deleteShort: 'DEL',
    noTags: '[sin etiquetas]',

    // NoteEditor
    editNoteTitle: '[EDITAR NOTA:',
    newNoteTitle: '[NUEVA NOTA]',
    vectorizedBadge: 'VECTORIZADA',
    noVectorBadge: 'SIN VECTOR',
    modeEdit: 'EDICION',
    modeSplit: 'DIVIDIDO',
    modePreview: 'VISTA PREVIA',
    discard: 'DESCARTAR',
    saveNote: '[GUARDAR NOTA]',
    savingNote: '[GUARDANDO Y VECTORIZANDO...]',
    titleRequired: 'El campo TITULO es obligatorio.',
    contentRequired: 'El campo CONTENIDO es obligatorio.',
    docTitleLabel: 'TITULO DEL DOCUMENTO:',
    docTitlePlaceholder: 'Ejemplo: Arquitectura de Pipelines RAG',
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
    topKLabel: 'TOP-K:',
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
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('faztnotes_lang');
    return (saved === 'es' || saved === 'en') ? saved : 'en'; // DEFAULT EN
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('faztnotes_lang', newLang);
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
