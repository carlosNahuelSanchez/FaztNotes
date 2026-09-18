import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, NexoSource } from '../types';
import { streamNexo } from '../api';
import { MarkdownView } from './MarkdownView';
import { AsciiNexo } from './AsciiNexo';
import { CyberTooltip } from './CyberTooltip';
import { HelpCircleIcon } from './CyberIcons';
import { useI18n } from '../i18n';

export const NexoConsole: React.FC = () => {
  const { lang, t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [topK, setTopK] = useState(4);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortStreamRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (abortStreamRef.current) {
        abortStreamRef.current();
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = inputQuery.trim();
    if (!cleanQuery || loading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: cleanQuery,
      timestamp: new Date().toISOString()
    };

    const nexoMessageId = crypto.randomUUID();
    const initialNexoMessage: ChatMessage = {
      id: nexoMessageId,
      role: 'nexo',
      content: '',
      timestamp: new Date().toISOString(),
      sources: [],
      streaming: true
    };

    setMessages((prev) => [...prev, userMessage, initialNexoMessage]);
    setInputQuery('');
    setLoading(true);

    const cancelStream = streamNexo(
      cleanQuery,
      topK,
      {
        onSources: (sources: NexoSource[]) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === nexoMessageId ? { ...msg, sources } : msg
            )
          );
        },
        onChunk: (chunkText: string) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === nexoMessageId
                ? { ...msg, content: msg.content + chunkText }
                : msg
            )
          );
        },
        onDone: (latency_ms: number) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === nexoMessageId
                ? { ...msg, latency_ms, streaming: false }
                : msg
            )
          );
          setLoading(false);
        },
        onError: (err: Error) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === nexoMessageId
                ? {
                    ...msg,
                    content: `[QUERY FAIL]: ${err.message}`,
                    streaming: false
                  }
                : msg
            )
          );
          setLoading(false);
        }
      }
    );

    abortStreamRef.current = cancelStream;
  };

  const clearHistory = () => {
    if (abortStreamRef.current) {
      abortStreamRef.current();
    }
    setMessages([]);
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-nexo-950 overflow-hidden font-mono">
      {/* Console Top Bar */}
      <div className="border-b border-nexo-800 bg-nexo-900 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-nexo-100 uppercase tracking-wide">
            {t.nexoConsoleTitle}
          </span>
          <span className="text-nexo-600 text-[11px] hidden sm:inline">
            {t.nexoSubtitle}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span className="text-nexo-400 font-bold uppercase tracking-wider">{t.topKLabel}</span>
            <CyberTooltip text={t.topKTooltip} position="bottom" maxWidth="w-64">
              <span className="text-nexo-500 hover:text-emerald-400 cursor-help transition-colors flex items-center">
                <HelpCircleIcon className="w-3.5 h-3.5" />
              </span>
            </CyberTooltip>
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="bg-nexo-950 border border-nexo-800 px-1.5 py-0.5 text-nexo-200 focus:outline-none ml-1 font-mono text-xs"
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
            className="border border-nexo-800 px-2 py-1 text-nexo-400 hover:text-white hover:border-nexo-600 transition-colors"
          >
            {t.clearSession}
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="border border-nexo-850 bg-nexo-900/30 p-6 text-nexo-500 text-xs max-w-2xl mx-auto space-y-4 font-mono">
            {/* Animated ASCII Banner */}
            <div className="border border-nexo-800 bg-black/60 p-4 rounded-sm flex flex-col items-center">
              <AsciiNexo />
              <div className="text-[11px] text-nexo-300 font-bold uppercase tracking-widest mt-1">
                {t.welcomeTitle}
              </div>
              <div className="text-[10px] text-nexo-500">
                {t.welcomeSubtitle}
              </div>
            </div>

            <div className="font-bold text-nexo-400 uppercase text-[11px]">
              {t.rulesHeader}
            </div>
            <p>{t.rule1}</p>
            <p>{t.rule2}</p>
            <p>{t.rule3}</p>
            <p>{t.rule4}</p>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const timeStr = new Date(msg.timestamp).toLocaleTimeString(lang === 'es' ? 'es-ES' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          return (
            <div
              key={msg.id}
              className={`border ${
                isUser ? 'border-nexo-700 bg-nexo-900/50' : 'border-nexo-800 bg-nexo-950'
              } p-3 text-xs`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between border-b border-nexo-850 pb-2 mb-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold px-1.5 py-0.5 ${
                      isUser ? 'bg-nexo-300 text-black' : 'bg-nexo-800 text-nexo-100'
                    }`}
                  >
                    {isUser ? t.userRole : t.nexoRole}
                  </span>
                  <span className="text-nexo-600">{timeStr}</span>
                  {!isUser && msg.streaming && (
                    <span className="text-emerald-400 text-[10px] animate-pulse">
                      {t.streamingStatus}
                    </span>
                  )}
                </div>

                {!isUser && msg.latency_ms !== undefined && (
                  <span className="text-nexo-500 text-[10px]">
                    [{t.totalLatency} {msg.latency_ms} ms]
                  </span>
                )}
              </div>

              {/* Message Body */}
              <div className="text-nexo-200 font-sans leading-relaxed">
                {isUser ? (
                  <p className="font-mono text-xs text-nexo-100 whitespace-pre-wrap">{msg.content}</p>
                ) : msg.content ? (
                  <MarkdownView content={msg.content} />
                ) : (
                  <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse" />
                )}
              </div>

              {/* Sources List for Nexo */}
              {!isUser && msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-nexo-850">
                  <div className="text-nexo-500 text-[10px] font-bold uppercase mb-2">
                    {t.retrievedSources} ({msg.sources.length}) // {t.docRelevance}:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {msg.sources.map((src) => (
                      <div
                        key={src.id}
                        className="border border-nexo-850 bg-nexo-900 p-2 font-mono text-[11px]"
                      >
                        <div className="flex items-center justify-between text-nexo-400 font-bold mb-1">
                          <span className="truncate flex-1">{src.title}</span>
                          <span className="text-nexo-accent text-[10px] ml-2 shrink-0">
                            {(src.similarity * 100).toFixed(1)}% {t.docRelevance}
                          </span>
                        </div>
                        <div className="text-nexo-600 text-[10px] mb-1 truncate">
                          ID: {src.id}
                        </div>
                        <div className="text-nexo-500 text-[10px] font-sans line-clamp-2">
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

        {loading && messages[messages.length - 1]?.role === 'user' && (
          <div className="border border-nexo-800 bg-nexo-950 p-4 text-xs font-mono">
            <div className="flex items-center gap-2 text-nexo-400">
              <span className="inline-block w-2 h-2 bg-nexo-accent animate-pulse" />
              <span>{t.startingStream}</span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="border-t border-nexo-800 bg-nexo-900 p-3">
        <div className="flex items-center gap-2">
          <span className="text-nexo-500 text-xs font-bold shrink-0">{t.queryPrefix}</span>
          <div className="flex-1 flex flex-col">
            <input
              type="text"
              maxLength={500}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={loading}
              placeholder={t.queryPlaceholder}
              className="w-full bg-nexo-950 border border-nexo-800 px-3 py-2 text-xs text-nexo-100 focus:outline-none focus:border-white font-mono disabled:opacity-50"
            />
          </div>
          <span className="text-nexo-500 text-[10px] font-mono shrink-0">
            {inputQuery.length} / 500
          </span>
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="border border-white bg-white text-black font-bold text-xs px-4 py-2 hover:bg-nexo-200 transition-colors disabled:opacity-40"
          >
            {loading ? t.queryButtonStreaming : t.queryButton}
          </button>
        </div>
      </form>
    </div>
  );
};
