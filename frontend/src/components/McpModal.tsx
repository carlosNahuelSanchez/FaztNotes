import React, { useState } from 'react';
import { McpIcon, CopyIcon, BoltIcon } from './CyberIcons';

interface McpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ClientType = 'antigravity' | 'claude' | 'cursor' | 'windsurf';

interface ClientConfig {
  name: string;
  badge: string;
  configPathWin: string;
  configPathMac: string;
  jsonConfig: string;
  notes: string;
}

const CLIENT_CONFIGS: Record<ClientType, ClientConfig> = {
  antigravity: {
    name: 'Antigravity (Google)',
    badge: 'NATIVE SSE',
    configPathWin: '%USERPROFILE%\\.gemini\\config\\mcp_config.json',
    configPathMac: '~/.gemini/config/mcp_config.json',
    jsonConfig: JSON.stringify(
      {
        mcpServers: {
          nexonotes: {
            serverUrl: 'http://localhost:8781/sse'
          }
        }
      },
      null,
      2
    ),
    notes: 'También puedes ubicarlo en la raíz de tu proyecto como .agents/mcp_config.json para detección por proyecto.'
  },
  claude: {
    name: 'Claude Desktop',
    badge: 'SSE URL',
    configPathWin: '%APPDATA%\\Claude\\claude_desktop_config.json',
    configPathMac: '~/Library/Application Support/Claude/claude_desktop_config.json',
    jsonConfig: JSON.stringify(
      {
        mcpServers: {
          nexonotes: {
            url: 'http://localhost:8781/sse'
          }
        }
      },
      null,
      2
    ),
    notes: 'En Claude Desktop ve a Settings > Developer > Edit Config, pega este bloque y reinicia la aplicación.'
  },
  cursor: {
    name: 'Cursor IDE',
    badge: 'PROJECT / GLOBAL',
    configPathWin: '.cursor\\mcp.json (en la raíz de tu repo)',
    configPathMac: '.cursor/mcp.json (en la raíz de tu repo)',
    jsonConfig: JSON.stringify(
      {
        mcpServers: {
          nexonotes: {
            url: 'http://localhost:8781/sse'
          }
        }
      },
      null,
      2
    ),
    notes: 'Cursor detecta automáticamente este archivo al abrir el proyecto, o puedes agregarlo en Settings > Features > MCP.'
  },
  windsurf: {
    name: 'Windsurf / VS Code',
    badge: 'SSE TRANSPORT',
    configPathWin: '%USERPROFILE%\\.codeium\\windsurf\\mcp_config.json',
    configPathMac: '~/.codeium/windsurf/mcp_config.json',
    jsonConfig: JSON.stringify(
      {
        mcpServers: {
          nexonotes: {
            serverUrl: 'http://localhost:8781/sse'
          }
        }
      },
      null,
      2
    ),
    notes: 'Compatible con Windsurf y extensiones MCP de VS Code (Cline, Roo Code, Continue) usando transporte SSE.'
  }
};

const TOOLS_LIST = [
  { name: 'search_notes', desc: 'Búsqueda semántica vectorial con pgvector' },
  { name: 'get_note', desc: 'Lectura de nota completa en Markdown por ID' },
  { name: 'list_notes', desc: 'Listar notas filtradas por carpeta o etiquetas' },
  { name: 'create_note', desc: 'Creación de nota con auto-vectorización inmediata' },
  { name: 'list_folders', desc: 'Estructura de directorios del workspace' },
  { name: 'ask_nexo', desc: 'Consulta RAG con respuesta sintética y fuentes citadas' }
];

export const McpModal: React.FC<McpModalProps> = ({ isOpen, onClose }) => {
  const [selectedClient, setSelectedClient] = useState<ClientType>('antigravity');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const current = CLIENT_CONFIGS[selectedClient];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.jsonConfig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 font-mono select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-nexo-950 border border-nexo-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] matrix-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-nexo-900 border-b border-nexo-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <McpIcon className="w-4 h-4 text-nexo-accent" />
            <span className="text-white font-bold text-xs tracking-wider">
              [MCP INTEGRATION // MODEL CONTEXT PROTOCOL]
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 border border-emerald-500/40 bg-emerald-950/40 text-[10px]">
              <span className="w-2 h-2 rounded-full bg-nexo-accent animate-pulse" />
              <span className="text-nexo-accent font-bold">ONLINE :8781</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-nexo-400 hover:text-white px-1.5 py-0.5 border border-transparent hover:border-nexo-700 text-xs"
            >
              [ESC / X]
            </button>
          </div>
        </div>

        {/* Client Selector Tabs */}
        <div className="flex border-b border-nexo-800 bg-nexo-950/80 overflow-x-auto text-xs">
          {(Object.keys(CLIENT_CONFIGS) as ClientType[]).map((key) => {
            const c = CLIENT_CONFIGS[key];
            const isSel = selectedClient === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedClient(key);
                  setCopied(false);
                }}
                className={`px-3 py-2 font-bold transition-colors whitespace-nowrap border-r border-nexo-800 flex items-center gap-1.5 ${
                  isSel
                    ? 'bg-nexo-accent text-black'
                    : 'text-nexo-400 hover:text-white hover:bg-nexo-900'
                }`}
              >
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* CLI Auto-Configuration Banner */}
          <div className="border border-emerald-500/50 bg-emerald-950/25 p-3 flex items-start gap-2.5">
            <span className="text-nexo-accent font-bold text-sm leading-none shrink-0 font-mono">💡</span>
            <div className="text-[11px] space-y-1 font-mono">
              <div className="text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span>[CONFIGURACIÓN AUTOMÁTICA DISPONIBLE]</span>
              </div>
              <p className="text-nexo-300 leading-relaxed">
                Si ya configuraste el agente mediante el comando <code className="text-emerald-400 bg-black/70 px-1.5 py-0.5 border border-emerald-800/60 font-bold">nexonotes mcp-auto</code> en tu terminal, <strong className="text-white font-bold">no hace falta hacer nada de esto manualmente</strong>. Tu archivo de configuración ya contiene los parámetros necesarios.
              </p>
            </div>
          </div>

          {/* File location info */}
          <div className="border border-nexo-800 bg-nexo-900/60 p-3 space-y-1.5">
            <div className="text-nexo-400 text-[10px] tracking-wider uppercase flex items-center justify-between">
              <span>// RUTA DEL ARCHIVO DE CONFIGURACIÓN</span>
              <span className="text-emerald-400 text-[9px] font-bold">{current.badge}</span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-nexo-500 w-16 shrink-0">Windows:</span>
                <code className="text-emerald-300 bg-black/60 px-1.5 py-0.5 border border-nexo-800 truncate flex-1 select-all">
                  {current.configPathWin}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-nexo-500 w-16 shrink-0">Mac/Linux:</span>
                <code className="text-nexo-300 bg-black/60 px-1.5 py-0.5 border border-nexo-800 truncate flex-1 select-all">
                  {current.configPathMac}
                </code>
              </div>
            </div>
            <p className="text-nexo-500 text-[10px] mt-1 italic">{current.notes}</p>
          </div>

          {/* JSON Block with Copy Button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-nexo-400 text-[10px] tracking-wider uppercase">
                // BLOQUE DE CONFIGURACIÓN JSON (SSE :8781)
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className={`px-3 py-1 font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                  copied
                    ? 'bg-emerald-400 text-black shadow-[0_0_10px_rgba(52,211,153,0.8)]'
                    : 'bg-nexo-accent hover:bg-emerald-400 text-black'
                }`}
              >
                <CopyIcon className="w-3 h-3" />
                <span>{copied ? '¡COPIADO AL PORTAPAPELES!' : 'COPIAR CONFIGURACIÓN'}</span>
              </button>
            </div>

            <pre className="bg-black/90 border border-nexo-800 p-3 text-emerald-400 text-xs font-mono overflow-x-auto select-all leading-relaxed">
              {current.jsonConfig}
            </pre>
          </div>

          {/* Available Tools Reference */}
          <div className="border border-nexo-800 bg-nexo-900/30 p-3 space-y-2">
            <div className="text-nexo-400 text-[10px] tracking-wider uppercase">
              // HERRAMIENTAS ACTIVAS EXPUESTAS POR EL SERVIDOR (6 TOOLS)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TOOLS_LIST.map((t, idx) => (
                <div key={idx} className="bg-nexo-950/80 border border-nexo-850 p-2 space-y-0.5">
                  <div className="text-emerald-400 font-bold text-[11px] flex items-center gap-1.5 font-mono">
                    <BoltIcon className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{t.name}</span>
                  </div>
                  <div className="text-nexo-500 text-[10px] leading-tight">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-nexo-800 bg-nexo-900 px-4 py-2 flex items-center justify-between text-[11px] text-nexo-500">
          <span>TRANSPORTE: SSE (SERVER-SENT EVENTS)</span>
          <button
            type="button"
            onClick={onClose}
            className="text-nexo-300 hover:text-white border border-nexo-700 px-3 py-0.5"
          >
            CERRAR
          </button>
        </div>
      </div>
    </div>
  );
};
