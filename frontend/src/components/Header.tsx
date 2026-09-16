import React from 'react';
import { HealthStatus } from '../types';

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
  const isDbOk = health?.database === 'connected';
  const isGeminiOk = health?.gemini_configured === true;

  return (
    <header className="border-b border-fazt-800 bg-fazt-900 px-4 py-3 flex flex-wrap items-center justify-between gap-4 font-mono text-xs select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="bg-white text-black px-2 py-0.5 font-bold tracking-widest text-sm">
            FAZTNOTES
          </span>
          <span className="text-fazt-400 text-xs hidden sm:inline">
            // ARQUITECTURA RAG + PGVECTOR
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
            [1] NOTAS
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
            [2] CONSOLA NEXO
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {loadingHealth ? (
          <span className="text-fazt-600 animate-pulse">[SONDEANDO SISTEMA...]</span>
        ) : (
          <>
            <div className="flex items-center gap-1.5 border border-fazt-800 px-2 py-1 bg-fazt-950">
              <span className="text-fazt-600">DB:</span>
              <span className={isDbOk ? 'text-fazt-accent font-bold' : 'text-fazt-alert font-bold'}>
                {isDbOk ? 'CONECTADO' : 'FALLO'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 border border-fazt-800 px-2 py-1 bg-fazt-950">
              <span className="text-fazt-600">GEMINI:</span>
              <span className={isGeminiOk ? 'text-fazt-accent font-bold' : 'text-fazt-warn font-bold'}>
                {isGeminiOk ? 'ACTIVO' : 'SIN LLAVE'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 border border-fazt-800 px-2 py-1 bg-fazt-950">
              <span className="text-fazt-600">NOTAS:</span>
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
