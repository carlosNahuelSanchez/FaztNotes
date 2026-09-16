import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { queryNexo } from '../api';
import { MarkdownView } from './MarkdownView';

export const NexoConsole: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [topK, setTopK] = useState(4);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = inputQuery.trim();
    if (!cleanQuery || loading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: cleanQuery,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await queryNexo(cleanQuery, topK);
      const nexoMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'nexo',
        content: response.answer,
        timestamp: new Date().toISOString(),
        sources: response.sources,
        latency_ms: response.latency_ms
      };
      setMessages((prev) => [...prev, nexoMessage]);
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Error desconocido de comunicacion con Nexo';
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'nexo',
        content: `[FALLO DE CONSULTA]: ${errorText}`,
        timestamp: new Date().toISOString(),
        sources: []
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
  };

  return (
    <div className="flex-1 flex flex-col bg-fazt-950 overflow-hidden font-mono">
      {/* Console Top Bar */}
      <div className="border-b border-fazt-800 bg-fazt-900 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-fazt-100 uppercase tracking-wide">
            CONSOLA EJECUTIVA NEXO // RAG ENGINE
          </span>
          <span className="text-fazt-600 text-[11px] hidden sm:inline">
            [MODELO: GEMINI FLASH | SIMILITUD COSENO: PGVECTOR]
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-fazt-600">TOP-K:</span>
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="bg-fazt-950 border border-fazt-800 px-1 py-0.5 text-fazt-200 focus:outline-none"
            >
              <option value={2}>2</option>
              <option value={4}>4</option>
              <option value={6}>6</option>
              <option value={8}>8</option>
            </select>
          </div>

          <button
            type="button"
            onClick={clearHistory}
            className="border border-fazt-800 px-2 py-1 text-fazt-400 hover:text-white hover:border-fazt-600 transition-colors"
          >
            LIMPIAR SESION
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="border border-fazt-850 bg-fazt-900/30 p-6 text-fazt-500 text-xs max-w-2xl mx-auto space-y-2">
            <div className="font-bold text-fazt-300 uppercase">
              // REGLAS OPERATIVAS DEL ASISTENTE NEXO
            </div>
            <p>1. Nexo responde exclusivamente con informacion extraida de las notas almacenadas.</p>
            <p>2. Cada afirmacion cita de manera precisa la fuente documental [Fuente: Titulo (ID)].</p>
            <p>3. En ausencia de contexto relevante, declarara: 'No hay información en las notas sobre este tema.'</p>
            <p>4. Ingrese una consulta tecnica en la barra inferior para ejecutar la busqueda vectorial.</p>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const timeStr = new Date(msg.timestamp).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          return (
            <div
              key={msg.id}
              className={`border ${
                isUser ? 'border-fazt-700 bg-fazt-900/50' : 'border-fazt-800 bg-fazt-950'
              } p-3 text-xs`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between border-b border-fazt-850 pb-2 mb-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold px-1.5 py-0.5 ${
                      isUser ? 'bg-fazt-300 text-black' : 'bg-fazt-800 text-fazt-100'
                    }`}
                  >
                    {isUser ? 'USUARIO' : 'NEXO'}
                  </span>
                  <span className="text-fazt-600">{timeStr}</span>
                </div>

                {!isUser && msg.latency_ms !== undefined && (
                  <span className="text-fazt-500 text-[10px]">
                    [LATENCIA: {msg.latency_ms} ms]
                  </span>
                )}
              </div>

              {/* Message Body */}
              <div className="text-fazt-200 font-sans leading-relaxed">
                {isUser ? (
                  <p className="font-mono text-xs text-fazt-100 whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <MarkdownView content={msg.content} />
                )}
              </div>

              {/* Sources List for Nexo */}
              {!isUser && msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-fazt-850">
                  <div className="text-fazt-500 text-[10px] font-bold uppercase mb-2">
                    FUENTES RECUPERADAS ({msg.sources.length}) // BUSQUEDA POR COSENO:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {msg.sources.map((src) => (
                      <div
                        key={src.id}
                        className="border border-fazt-850 bg-fazt-900 p-2 font-mono text-[11px]"
                      >
                        <div className="flex items-center justify-between text-fazt-400 font-bold mb-1">
                          <span className="truncate flex-1">{src.title}</span>
                          <span className="text-fazt-accent text-[10px] ml-2 shrink-0">
                            {(src.similarity * 100).toFixed(1)}% SIM
                          </span>
                        </div>
                        <div className="text-fazt-600 text-[10px] mb-1 truncate">
                          ID: {src.id}
                        </div>
                        <div className="text-fazt-500 text-[10px] font-sans line-clamp-2">
                          {src.content_snippet}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="border border-fazt-800 bg-fazt-950 p-4 text-xs font-mono">
            <div className="flex items-center gap-2 text-fazt-400">
              <span className="inline-block w-2 h-2 bg-fazt-accent animate-pulse" />
              <span>[NEXO PROCESANDO CONSULTA // EXTRACCION VECTORIAL EN CURSO...]</span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="border-t border-fazt-800 bg-fazt-900 p-3">
        <div className="flex items-center gap-2">
          <span className="text-fazt-500 text-xs font-bold shrink-0">QUERY &gt;</span>
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={loading}
            placeholder="Escriba su consulta tecnica para Nexo (ej: '¿Cuales son los endpoints del backend?')..."
            className="flex-1 bg-fazt-950 border border-fazt-800 px-3 py-2 text-xs text-fazt-100 focus:outline-none focus:border-white font-mono disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="border border-white bg-white text-black font-bold text-xs px-4 py-2 hover:bg-fazt-200 transition-colors disabled:opacity-40"
          >
            {loading ? 'BUSCANDO...' : 'CONSULTAR [ENTER]'}
          </button>
        </div>
      </form>
    </div>
  );
};
