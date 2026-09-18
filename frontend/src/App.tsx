import { useState, useEffect, useCallback } from 'react';
import { HealthStatus } from './types';
import { checkHealth } from './api';
import { Header } from './components/Header';
import { NotesManager } from './components/NotesManager';
import { NexoConsole } from './components/NexoConsole';
import { SystemStats } from './components/SystemStats';
import { GithubIcon } from './components/CyberIcons';
import { useI18n } from './i18n';

import { McpModal } from './components/McpModal';

export function App() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'notes' | 'nexo' | 'stats'>('notes');
  const [mcpModalOpen, setMcpModalOpen] = useState(false);
  const [targetNoteId, setTargetNoteId] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);

  const handleNavigateToNote = useCallback((noteId: string) => {
    setTargetNoteId(noteId);
    setActiveTab('notes');
  }, []);

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

  // Keyboard navigation shortcuts (F1 / F2 / F3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('notes');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('nexo');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('stats');
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
        onOpenMcp={() => setMcpModalOpen(true)}
        health={health}
        loadingHealth={loadingHealth}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'notes' ? '' : 'hidden'}`}>
          <NotesManager
            onDataChanged={refreshHealth}
            targetNoteId={targetNoteId}
            onClearTargetNote={() => setTargetNoteId(null)}
          />
        </div>
        <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'nexo' ? '' : 'hidden'}`}>
          <NexoConsole />
        </div>
        <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'stats' ? '' : 'hidden'}`}>
          <SystemStats onNavigateToNote={handleNavigateToNote} />
        </div>
      </main>

      <McpModal isOpen={mcpModalOpen} onClose={() => setMcpModalOpen(false)} />

      <footer className="border-t border-nexo-850 bg-nexo-900 px-4 py-1.5 flex items-center justify-between font-mono text-[11px] text-nexo-500 select-none shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
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
          <span className="text-nexo-700">│</span>
          <a
            href="https://github.com/carlosNahuelSanchez/NexoNotes"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-nexo-950 border border-nexo-700 hover:border-emerald-400 text-nexo-300 hover:text-emerald-300 px-2 py-0.5 text-[10px] font-bold transition-all duration-200"
            title={t.sourceCode}
          >
            <GithubIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{t.sourceCode}</span>
          </a>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-nexo-600 text-[10px]">
          <span>SHORTCUTS: [F1] NOTAS │ [F2] NEXO │ [F3] STATS │ [ALT+N] +NOTA │ [ALT+F] +CARPETA │ [ALT+R] RENOMBRAR │ [SUPR] BORRAR │ [CTRL+C/V] COPIAR/PEGAR</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
