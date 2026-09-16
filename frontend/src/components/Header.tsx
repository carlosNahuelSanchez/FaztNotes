import React from 'react';
import { HealthStatus } from '../types';
import { useI18n } from '../i18n';

interface HeaderProps {
  activeTab: 'notes' | 'nexo';
  onTabChange: (tab: 'notes' | 'nexo') => void;
  health: HealthStatus | null;
  loadingHealth: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  health,
  loadingHealth
}) => {
  const { lang, setLang, t } = useI18n();
  const isDbOk = health?.database === 'connected';
  const isGeminiOk = health?.gemini_configured === true;

  return (
    <header className="border-b border-fazt-800 bg-fazt-900 px-4 py-3 flex flex-wrap items-center justify-between gap-4 font-mono text-xs select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain border border-fazt-700 bg-black" />
          <span className="bg-white text-black px-2 py-0.5 font-bold tracking-widest text-sm">
            {t.headerTitle}
          </span>
          <span className="text-fazt-400 text-xs hidden md:inline">
            {t.headerSubtitle}
          </span>
          <span className="text-fazt-700 text-xs hidden lg:inline">│</span>
          <span className="text-fazt-500 text-xs hidden lg:inline">
            {t.madeBy}{' '}
            <a
              href="https://www.instagram.com/nexus.studio.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fazt-accent font-bold hover:text-emerald-300 hover:underline transition-all duration-200"
            >
              NEXUS STUDIO
            </a>
          </span>
        </div>

        <nav className="flex items-center border border-fazt-700 bg-fazt-950">
          <button
            type="button"
            onClick={() => onTabChange('notes')}
            className={`px-3 py-1.5 font-semibold transition-colors ${
              activeTab === 'notes'
                ? 'bg-fazt-200 text-black'
                : 'text-fazt-400 hover:text-white hover:bg-fazt-850'
            }`}
          >
            {t.tabNotes}
          </button>
          <button
            type="button"
            onClick={() => onTabChange('nexo')}
            className={`px-3 py-1.5 font-semibold transition-colors ${
              activeTab === 'nexo'
                ? 'bg-fazt-200 text-black'
                : 'text-fazt-400 hover:text-white hover:bg-fazt-850'
            }`}
          >
            {t.tabNexo}
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <div className="flex items-center border border-fazt-700 bg-fazt-950 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-2 py-1 transition-colors ${
              lang === 'en' ? 'bg-fazt-200 text-black' : 'text-fazt-400 hover:text-white'
            }`}
            title="English (Default)"
          >
            {t.langEn}
          </button>
          <button
            type="button"
            onClick={() => setLang('es')}
            className={`px-2 py-1 transition-colors ${
              lang === 'es' ? 'bg-fazt-200 text-black' : 'text-fazt-400 hover:text-white'
            }`}
            title="Español"
          >
            {t.langEs}
          </button>
        </div>

        {loadingHealth ? (
          <span className="text-fazt-600 animate-pulse">{t.probing}</span>
        ) : (
          <>
            <div className="flex items-center gap-1.5 border border-fazt-800 px-2 py-1 bg-fazt-950">
              <span className="text-fazt-600">{t.db}</span>
              <span className={isDbOk ? 'text-fazt-accent font-bold' : 'text-fazt-alert font-bold'}>
                {isDbOk ? t.dbConnected : t.dbFailed}
              </span>
            </div>

            <div className="flex items-center gap-1.5 border border-fazt-800 px-2 py-1 bg-fazt-950">
              <span className="text-fazt-600">{t.aiEngine}</span>
              <span className={isGeminiOk ? 'text-fazt-accent font-bold' : 'text-fazt-warn font-bold'}>
                {isGeminiOk ? t.aiActive : t.aiUnconfigured}
              </span>
            </div>

            <div className="flex items-center gap-1.5 border border-fazt-800 px-2 py-1 bg-fazt-950">
              <span className="text-fazt-600">{t.notesCount}</span>
              <span className="text-fazt-100 font-bold">
                {health?.total_notes ?? 0}
              </span>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
