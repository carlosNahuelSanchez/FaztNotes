import { useState, useEffect, useCallback } from 'react';
import { HealthStatus } from './types';
import { checkHealth } from './api';
import { Header } from './components/Header';
import { NotesManager } from './components/NotesManager';
import { NexoConsole } from './components/NexoConsole';
import { useI18n } from './i18n';

export function App() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'notes' | 'nexo'>('notes');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);

  const refreshHealth = useCallback(async () => {
    try {
      const data = await checkHealth();
      setHealth(data);
    } catch {
      setHealth({
        status: 'error',
        database: 'disconnected',
        gemini_configured: false,
        total_notes: 0
      });
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 15000);
    return () => clearInterval(interval);
  }, [refreshHealth]);

  // Keyboard navigation shortcuts (F1 / F2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('notes');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('nexo');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-nexo-950 text-nexo-200">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        health={health}
        loadingHealth={loadingHealth}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'notes' ? (
          <NotesManager onDataChanged={refreshHealth} />
        ) : (
          <NexoConsole />
        )}
      </main>

      <footer className="border-t border-nexo-850 bg-nexo-900 px-4 py-1.5 flex items-center justify-between font-mono text-[11px] text-nexo-500 select-none shrink-0">
        <div className="flex items-center gap-2">
          <span>NEXONOTES v1.0</span>
          <span className="text-nexo-700">│</span>
          <span>{t.madeBy}</span>
          <a
            href="https://www.instagram.com/nexus.studio.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-nexo-accent font-bold hover:text-emerald-300 hover:underline transition-all duration-200 tracking-wider"
          >
            NEXUS STUDIO
          </a>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-nexo-600 text-[10px]">
          <span>SHORTCUTS: [F1] NOTAS │ [F2] NEXO │ [ALT+N] +NOTA │ [ALT+F] +CARPETA │ [ALT+I] IMPORTAR │ [ALT+E] EXPORTAR │ [SUPR] BORRAR │ [CTRL+C/V] COPIAR/PEGAR</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
