import { useState, useEffect, useCallback } from 'react';
import { HealthStatus } from './types';
import { checkHealth } from './api';
import { Header } from './components/Header';
import { NotesManager } from './components/NotesManager';
import { NexoConsole } from './components/NexoConsole';

export function App() {
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-fazt-950 text-fazt-200">
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
    </div>
  );
}

export default App;
