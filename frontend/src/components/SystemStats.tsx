import React, { useState, useEffect, useCallback } from 'react';
import { fetchStats } from '../api';
import { useI18n } from '../i18n';
import { SystemStatsData, ActivityStat } from '../types';
import { DownloadIcon, UploadIcon, FileCodeIcon } from './CyberIcons';

interface SystemStatsProps {
  onNavigateToNote?: (noteId: string) => void;
}

const GLYPHS = "!<>-_\\/[]{}—=+*^?#_$%&01";

export const SystemStats: React.FC<SystemStatsProps> = ({ onNavigateToNote }) => {
  const { t, lang } = useI18n();
  const [stats, setStats] = useState<SystemStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [glitchTitle, setGlitchTitle] = useState<string>(t.statsTitle);
  const [hoveredActivity, setHoveredActivity] = useState<ActivityStat | null>(null);
  const [selectedDate, setSelectedDate] = useState<ActivityStat | null>(null);

  const refresh = useCallback(async () => {
    try {
      setStats(await fetchStats());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 15000);
    return () => clearInterval(iv);
  }, [refresh]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDate(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cyber glitch title animation on mount or click
  const triggerTitleGlitch = useCallback(() => {
    const original = t.statsTitle;
    let frame = 0;
    const totalFrames = 12;

    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;

      if (frame >= totalFrames) {
        setGlitchTitle(original);
        clearInterval(interval);
      } else {
        setGlitchTitle(
          original
            .split('')
            .map((char, idx) => {
              if (char === ' ') return ' ';
              if (idx / original.length < progress) return char;
              return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            })
            .join('')
        );
      }
    }, 35);
  }, [t.statsTitle]);

  useEffect(() => {
    triggerTitleGlitch();
  }, [triggerTitleGlitch]);

  const formatDateFull = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const handleExportJson = () => {
    if (!stats) return;
    const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexonotes_stats_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!stats) return;
    let csv = '\uFEFF'; // UTF-8 BOM for Microsoft Excel
    csv += '=== REPORTE DE METRICAS NEXONOTES ===\n';
    csv += `Fecha Emisión,${new Date().toLocaleString()}\n\n`;
    csv += `Total Notas,${stats.total_notes}\n`;
    csv += `Notas con Embedding,${stats.total_with_embedding}\n`;
    csv += `Cobertura Embedding,${stats.embedding_coverage_pct}%\n`;
    csv += `Total Carpetas,${stats.total_folders}\n`;
    csv += `Total Etiquetas,${stats.total_tags}\n\n`;

    csv += '=== NOTAS POR CARPETA ===\nCarpeta,Cantidad\n';
    stats.notes_by_folder.forEach((f) => {
      csv += `"${f.folder.replace(/"/g, '""')}",${f.count}\n`;
    });

    csv += '\n=== NOTAS POR ETIQUETA ===\nEtiqueta,Cantidad\n';
    stats.notes_by_tag.forEach((tg) => {
      csv += `"${tg.tag.replace(/"/g, '""')}",${tg.count}\n`;
    });

    csv += '\n=== ACTIVIDAD RECIENTE (ULTIMOS 14 DIAS) ===\nFecha,Cantidad\n';
    stats.recent_activity.forEach((a) => {
      csv += `${a.date},${a.count}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexonotes_stats_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center font-mono text-nexo-500 animate-pulse text-xs">
        {t.statsLoading}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex-1 flex items-center justify-center font-mono text-nexo-500 text-xs">
        {t.statsNoData}
      </div>
    );
  }

  const maxFolder = Math.max(...stats.notes_by_folder.map((f) => f.count), 1);
  const maxTag = Math.max(...stats.notes_by_tag.map((tg) => tg.count), 1);
  const maxActivity = Math.max(...stats.recent_activity.map((a) => a.count), 1);

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 font-mono text-xs bg-nexo-950 text-nexo-200">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header with Square Font & Export Actions */}
        <div className="border border-nexo-800 bg-nexo-900 p-4 matrix-card flex flex-wrap items-center justify-between gap-4 matrix-flicker">
          <div>
            <h1
              onClick={triggerTitleGlitch}
              className="text-nexo-accent font-bold text-base tracking-widest matrix-text-glow cursor-pointer select-none font-square"
              title="Click para activar efecto glitch"
            >
              {glitchTitle}
            </h1>
            <p className="text-nexo-500 text-[11px] mt-1 font-mono tracking-wide">{t.statsSubtitle}</p>
          </div>

          {/* Export Toolbar (JSON & Excel only) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-nexo-600 text-[10px] mr-1 select-none font-mono">// EXPORTAR:</span>
            <button
              type="button"
              onClick={handleExportJson}
              className="border border-nexo-700 bg-nexo-950 hover:border-emerald-400 hover:text-emerald-300 px-3 py-1 text-[11px] font-bold font-mono transition-colors flex items-center gap-1.5"
              title="Descargar métricas en formato JSON"
            >
              <DownloadIcon className="w-3 h-3 text-emerald-400" />
              <span>{t.statsExportJson}</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="border border-nexo-700 bg-nexo-950 hover:border-emerald-400 hover:text-emerald-300 px-3 py-1 text-[11px] font-bold font-mono transition-colors flex items-center gap-1.5"
              title="Descargar métricas para Excel (CSV UTF-8)"
            >
              <UploadIcon className="w-3 h-3 text-emerald-400" />
              <span>{t.statsExportExcel}</span>
            </button>
          </div>
        </div>

        {/* Summary Cards with Square Numbers (No vibration) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { value: stats.total_notes, label: t.statsTotalNotes },
            { value: stats.total_with_embedding, label: t.statsTotalVectors },
            { value: `${stats.embedding_coverage_pct.toFixed(1)}%`, label: t.statsEmbeddingCoverage, glow: true },
            { value: stats.total_folders, label: t.statsTotalFolders },
            { value: stats.total_tags, label: t.statsTotalTags }
          ].map((c, i) => (
            <div
              key={i}
              className="border border-nexo-800 bg-nexo-900 p-4 text-center matrix-card transition-colors hover:border-nexo-700"
            >
              <div
                className={`text-2xl font-bold font-square-nums ${
                  c.glow ? 'text-nexo-accent matrix-text-glow' : 'text-nexo-100'
                }`}
              >
                {c.value}
              </div>
              <div className="text-nexo-500 text-[10px] mt-1 tracking-wider font-mono uppercase">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Coverage Bar */}
        <div className="border border-nexo-800 bg-nexo-900 p-4 matrix-card">
          <div className="text-nexo-400 text-[10px] tracking-wider mb-2 font-mono uppercase">
            {t.statsEmbeddingCoverage}
          </div>
          <div className="h-3 bg-nexo-950 border border-nexo-800 overflow-hidden">
            <div
              className="h-full matrix-bar transition-all duration-1000"
              style={{ width: `${stats.embedding_coverage_pct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-nexo-500 mt-1 font-mono">
            <span>
              {stats.total_with_embedding} / {stats.total_notes} {t.statsTotalVectors.toLowerCase()}
            </span>
            <span className="text-nexo-accent font-bold font-square-nums">{stats.embedding_coverage_pct.toFixed(1)}%</span>
          </div>
        </div>

        {/* Folders + Tags: ALL items with internal scroll */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Notes by Folder */}
          <div className="border border-nexo-800 bg-nexo-900 p-4 matrix-card flex flex-col">
            <div className="text-nexo-400 text-[10px] tracking-wider mb-3 border-b border-nexo-800 pb-2 font-mono flex items-center justify-between">
              <span>// {t.statsNotesByFolder}</span>
              <span className="text-nexo-600 text-[10px]">{stats.notes_by_folder.length} carpetas</span>
            </div>
            {stats.notes_by_folder.length === 0 ? (
              <div className="text-nexo-600 text-center py-4 font-mono">{t.statsNoData}</div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                {stats.notes_by_folder.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <span
                      className="text-nexo-400 group-hover:text-white w-28 truncate text-right text-[10px] font-mono shrink-0"
                      title={f.folder}
                    >
                      /{f.folder}
                    </span>
                    <div className="flex-1 h-4 bg-nexo-950 border border-nexo-800 overflow-hidden">
                      <div
                        className="h-full matrix-bar transition-all duration-500 group-hover:brightness-110"
                        style={{ width: `${(f.count / maxFolder) * 100}%` }}
                      />
                    </div>
                    <span className="text-nexo-accent w-10 text-right font-bold text-[10px] font-square-nums shrink-0">
                      {f.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes by Tag */}
          <div className="border border-nexo-800 bg-nexo-900 p-4 matrix-card flex flex-col">
            <div className="text-nexo-400 text-[10px] tracking-wider mb-3 border-b border-nexo-800 pb-2 font-mono flex items-center justify-between">
              <span>// {t.statsNotesByTag}</span>
              <span className="text-nexo-600 text-[10px]">{stats.notes_by_tag.length} etiquetas</span>
            </div>
            {stats.notes_by_tag.length === 0 ? (
              <div className="text-nexo-600 text-center py-4 font-mono">{t.statsNoData}</div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                {stats.notes_by_tag.map((tg, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <span
                      className="text-nexo-400 group-hover:text-white w-28 truncate text-right text-[10px] font-mono shrink-0"
                      title={tg.tag}
                    >
                      #{tg.tag}
                    </span>
                    <div className="flex-1 h-4 bg-nexo-950 border border-nexo-800 overflow-hidden">
                      <div
                        className="h-full matrix-bar transition-all duration-500 group-hover:brightness-110"
                        style={{ width: `${(tg.count / maxTag) * 100}%` }}
                      />
                    </div>
                    <span className="text-nexo-accent w-10 text-right font-bold text-[10px] font-square-nums shrink-0">
                      {tg.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline (ÚLTIMOS 14 DÍAS with Click to view Notes) */}
        <div className="border border-nexo-800 bg-nexo-900 p-4 matrix-card space-y-3">
          <div className="text-nexo-400 text-[10px] tracking-wider border-b border-nexo-800 pb-2 font-mono flex items-center justify-between">
            <span>// {t.statsRecentActivity}</span>
            {hoveredActivity ? (
              <span className="text-emerald-300 font-bold text-[11px] animate-pulse">
                [ {formatDateFull(hoveredActivity.date)}: {hoveredActivity.count} nota(s) ]
              </span>
            ) : (
              <span className="text-nexo-600 text-[10px]">Haz clic en una barra para ver sus notas</span>
            )}
          </div>

          {stats.recent_activity.length === 0 ? (
            <div className="text-nexo-600 text-center py-4 font-mono">{t.statsNoData}</div>
          ) : (
            <div className="flex items-end gap-1.5 h-40 pt-6">
              {stats.recent_activity.map((a, i) => {
                const isHovered = hoveredActivity?.date === a.date;
                const isSelected = selectedDate?.date === a.date;
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDate(isSelected ? null : a)}
                    onMouseEnter={() => setHoveredActivity(a)}
                    onMouseLeave={() => setHoveredActivity(null)}
                    className={`flex-1 flex flex-col items-center justify-end h-full min-w-0 group cursor-pointer relative p-0.5 transition-colors ${
                      isSelected ? 'bg-emerald-950/40 ring-1 ring-emerald-400' : ''
                    }`}
                  >
                    {/* Hover popup with Día, Mes y Año */}
                    {isHovered && !isSelected && (
                      <div className="absolute -top-12 z-30 bg-black border border-emerald-400 px-2 py-1 text-[10px] text-white shadow-xl pointer-events-none whitespace-nowrap matrix-text-glow font-mono animate-tooltip-soft">
                        <div className="text-emerald-400 font-bold">{formatDateFull(a.date)}</div>
                        <div className="text-nexo-300">{a.count} nota(s) - Clic para ver</div>
                      </div>
                    )}

                    <span
                      className={`text-[9px] mb-1 font-bold font-square-nums transition-colors ${
                        isSelected ? 'text-white font-black' : isHovered ? 'text-emerald-300' : 'text-nexo-accent'
                      }`}
                    >
                      {a.count}
                    </span>

                    <div
                      className={`w-full matrix-bar transition-all duration-300 ${
                        isSelected
                          ? 'brightness-125 shadow-[0_0_15px_rgba(34,197,94,1)] scale-y-105'
                          : isHovered
                          ? 'brightness-75'
                          : ''
                      }`}
                      style={{
                        height: `${(a.count / maxActivity) * 100}%`,
                        minHeight: '4px'
                      }}
                    />

                    <span
                      className={`text-[9px] mt-1 font-mono transition-colors ${
                        isSelected
                          ? 'text-white font-bold'
                          : isHovered
                          ? 'text-emerald-300 font-bold'
                          : 'text-nexo-600'
                      }`}
                    >
                      {a.date.slice(-2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Floating Modal Popup on top for Selected Date Notes */}
        {selectedDate && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 select-none font-mono animate-popup-backdrop"
            onClick={() => setSelectedDate(null)}
          >
            <div
              className="w-full max-w-2xl bg-nexo-950 border border-emerald-500/70 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] matrix-card animate-popup-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Popup Header */}
              <div className="bg-nexo-900 border-b border-nexo-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-nexo-accent inline-block rounded-none animate-pulse" />
                  <span className="text-emerald-300 font-square text-xs uppercase tracking-wider font-bold">
                    // ENTRADAS DEL DÍA: {formatDateFull(selectedDate.date)}
                  </span>
                  <span className="text-nexo-400 text-[11px] font-mono">
                    [{selectedDate.notes?.length || selectedDate.count} notas]
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="text-nexo-400 hover:text-white px-2 py-0.5 border border-nexo-800 hover:border-nexo-600 text-xs font-mono transition-colors"
                >
                  [ESC / X]
                </button>
              </div>

              {/* Popup Body: Only Notes List */}
              <div className="p-4 overflow-y-auto max-h-[60vh] space-y-2.5">
                {!selectedDate.notes || selectedDate.notes.length === 0 ? (
                  <div className="text-nexo-500 text-xs py-8 text-center italic font-mono">
                    No se encontraron notas registradas en esta fecha.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedDate.notes.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (onNavigateToNote) {
                            onNavigateToNote(n.id);
                            setSelectedDate(null);
                          }
                        }}
                        className="border border-nexo-800 bg-nexo-900/80 p-3 space-y-1.5 hover:border-emerald-400 hover:bg-emerald-950/40 transition-all cursor-pointer group"
                        title="Clic para abrir esta nota en el editor"
                      >
                        <div className="text-emerald-300 group-hover:text-emerald-200 font-bold text-xs truncate flex items-center justify-between gap-2 font-mono">
                          <div className="flex items-center gap-2 truncate flex-1">
                            <FileCodeIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{n.title}.md</span>
                          </div>
                          <span className="text-[10px] text-nexo-500 group-hover:text-emerald-400 shrink-0 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            ABRIR →
                          </span>
                        </div>

                        <div className="text-[10px] text-nexo-500 font-mono">
                          <span>Carpeta: </span>
                          <span className="text-nexo-300 font-semibold">
                            {n.folder ? `/${n.folder}` : '/ (raíz)'}
                          </span>
                        </div>

                        {n.tags && n.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap pt-1">
                            {n.tags.map((tg, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 px-1.5 py-0.5 font-mono"
                              >
                                #{tg}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Popup Footer */}
              <div className="border-t border-nexo-800 bg-nexo-900/60 px-4 py-2 flex items-center justify-between text-[10px] text-nexo-500 font-mono">
                <span>TOTAL ENTRADAS: {selectedDate.notes?.length || selectedDate.count}</span>
                <span className="text-nexo-600">Presiona [ESC] o haz clic afuera para cerrar</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
