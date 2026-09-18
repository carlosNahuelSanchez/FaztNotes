import React from 'react';
import { HealthStatus } from '../types';
import { useI18n } from '../i18n';
import { BarChartIcon, McpIcon } from './CyberIcons';
import { CyberTooltip } from './CyberTooltip';

interface HeaderProps {
  activeTab: 'notes' | 'nexo' | 'stats';
  onTabChange: (tab: 'notes' | 'nexo' | 'stats') => void;
  onOpenMcp: () => void;
  health: HealthStatus | null;
  loadingHealth: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenMcp,
  health,
  loadingHealth
}) => {
  const { lang, setLang, t } = useI18n();
  const isDbOk = health?.database === 'connected';
  const isGeminiOk = health?.gemini_configured === true;

  return (
    <header className="border-b border-nexo-800 bg-nexo-900 px-4 py-3 flex flex-wrap items-center justify-between gap-4 font-mono text-xs select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain border border-nexo-700 bg-black" />
          <span className="bg-white text-black px-2 py-0.5 font-bold tracking-widest text-sm">
            {t.headerTitle}
          </span>
          <span className="text-nexo-400 text-xs hidden md:inline">
            {t.headerSubtitle}
          </span>
        </div>

        <nav className="flex items-center border border-nexo-700 bg-nexo-950">
          <button
            type="button"
            onClick={() => onTabChange('notes')}
            className={`px-3 py-1.5 font-semibold transition-colors ${
              activeTab === 'notes'
                ? 'bg-nexo-200 text-black'
                : 'text-nexo-400 hover:text-white hover:bg-nexo-850'
            }`}
          >
            {t.tabNotes}
          </button>
          <button
            type="button"
            onClick={() => onTabChange('nexo')}
            className={`px-3 py-1.5 font-semibold transition-colors ${
              activeTab === 'nexo'
                ? 'bg-nexo-200 text-black'
                : 'text-nexo-400 hover:text-white hover:bg-nexo-850'
            }`}
          >
            {t.tabNexo}
          </button>
          <CyberTooltip text="Estadísticas [F3]" position="bottom" align="center">
            <button
              type="button"
              onClick={() => onTabChange('stats')}
              className={`px-2.5 py-1.5 transition-colors flex items-center justify-center border-l border-nexo-700 ${
                activeTab === 'stats'
                  ? 'bg-nexo-accent text-black'
                  : 'text-nexo-400 hover:text-white hover:bg-nexo-850'
              }`}
              title="Estadísticas [F3]"
              aria-label="Estadísticas"
            >
              <BarChartIcon className="w-4 h-4" />
            </button>
          </CyberTooltip>
          <CyberTooltip text="Integración MCP [8781]" position="bottom" align="center">
            <button
              type="button"
              onClick={onOpenMcp}
              className="px-2.5 py-1.5 transition-colors flex items-center justify-center border-l border-nexo-700 text-nexo-400 hover:text-emerald-300 hover:bg-nexo-850"
              title="Integración MCP [8781]"
              aria-label="Integración MCP"
            >
              <McpIcon className="w-4 h-4" />
            </button>
          </CyberTooltip>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <div className="flex items-center border border-nexo-700 bg-nexo-950 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setLang('es')}
            className={`px-2 py-1 transition-colors ${
              lang === 'es' ? 'bg-nexo-200 text-black' : 'text-nexo-400 hover:text-white'
            }`}
            title="Español (Predeterminado)"
          >
            {t.langEs}
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-2 py-1 transition-colors ${
              lang === 'en' ? 'bg-nexo-200 text-black' : 'text-nexo-400 hover:text-white'
            }`}
            title="English"
          >
            {t.langEn}
          </button>
        </div>

        {loadingHealth ? (
          <span className="text-nexo-600 animate-pulse">{t.probing}</span>
        ) : (
          <>
            <div className="flex items-center gap-1.5 border border-nexo-800 px-2 py-1 bg-nexo-950">
              <span className="text-nexo-600">{t.db}</span>
              <span className={isDbOk ? 'text-nexo-accent font-bold' : 'text-nexo-alert font-bold'}>
                {isDbOk ? t.dbConnected : t.dbFailed}
              </span>
            </div>

            <div className="flex items-center gap-1.5 border border-nexo-800 px-2 py-1 bg-nexo-950">
              <span className="text-nexo-600">{t.aiEngine}</span>
              <span className={isGeminiOk ? 'text-nexo-accent font-bold' : 'text-nexo-warn font-bold'}>
                {isGeminiOk ? t.aiActive : t.aiUnconfigured}
              </span>
            </div>

            <div className="flex items-center gap-1.5 border border-nexo-800 px-2 py-1 bg-nexo-950">
              <span className="text-nexo-600">{t.notesCount}</span>
              <span className="text-nexo-100 font-bold">
                {health?.total_notes ?? 0}
              </span>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
