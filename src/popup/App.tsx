import React, { useEffect, useState } from 'react';
import { PetConfig, TabHealthMetrics, NestArchiveItem, NotificationPreferences } from '../types';
import { getPetConfig, getNestArchive, getPreferences, savePreferences } from '../utils/storage';
import { analyzeTabHealth } from '../utils/tabAnalyzer';
import { PetCreation } from './components/PetCreation';
import { PetDashboard } from './components/PetDashboard';
import { NestArchive } from './components/NestArchive';
import { TabNests } from './components/TabNests';
import { Settings } from './components/Settings';

type View = 'creation' | 'dashboard' | 'nests' | 'archive' | 'settings';

export function App() {
  const [pet, setPet] = useState<PetConfig | null>(null);
  const [view, setView] = useState<View>('creation');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<TabHealthMetrics | null>(null);
  const [nestArchive, setNestArchive] = useState<NestArchiveItem[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    loadData();
    
    // Refresh metrics periodically
    const interval = setInterval(() => {
      refreshMetrics();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [petData, archive, prefs] = await Promise.all([
        getPetConfig(),
        getNestArchive(),
        getPreferences()
      ]);
      
      setPet(petData);
      setNestArchive(archive);
      setPreferences(prefs);
      
      if (petData) {
        setView('dashboard');
        await refreshMetrics();
      } else {
        setView('creation');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshMetrics() {
    try {
      const health = await analyzeTabHealth();
      setMetrics(health);
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    }
  }

  async function handlePetCreated(petConfig: PetConfig) {
    setPet(petConfig);
    setView('dashboard');
    await refreshMetrics();
    // Notify background to update icon
    chrome.runtime.sendMessage({ type: 'UPDATE_ICON' });
  }

  async function handlePreferencesChange(newPrefs: NotificationPreferences) {
    await savePreferences(newPrefs);
    setPreferences(newPrefs);
  }

  async function handleArchiveUpdate() {
    const archive = await getNestArchive();
    setNestArchive(archive);
  }

  if (loading) {
    return (
      <div className="popup-container loading">
        <div className="spinner"></div>
        <p>Loading your pet...</p>
      </div>
    );
  }

  if (view === 'creation') {
    return <PetCreation onPetCreated={handlePetCreated} />;
  }

  if (!pet || !metrics || !preferences) {
    return (
      <div className="popup-container">
        <p>Error loading pet data</p>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <nav className="popup-nav">
        <button
          className={view === 'dashboard' ? 'active' : ''}
          onClick={() => setView('dashboard')}
        >
          Pet
        </button>
        <button
          className={view === 'nests' ? 'active' : ''}
          onClick={() => setView('nests')}
        >
          Nests
        </button>
        <button
          className={view === 'archive' ? 'active' : ''}
          onClick={() => setView('archive')}
        >
          Archive
        </button>
        <button
          className={view === 'settings' ? 'active' : ''}
          onClick={() => setView('settings')}
        >
          Settings
        </button>
      </nav>

      {view === 'dashboard' && (
        <PetDashboard
          pet={pet}
          metrics={metrics}
          onMetricsRefresh={refreshMetrics}
          onArchiveUpdate={handleArchiveUpdate}
        />
      )}

      {view === 'nests' && (
        <TabNests />
      )}

      {view === 'archive' && (
        <NestArchive
          items={nestArchive}
          onArchiveUpdate={handleArchiveUpdate}
        />
      )}

      {view === 'settings' && (
        <Settings
          pet={pet}
          preferences={preferences}
          onPreferencesChange={handlePreferencesChange}
          onPetChange={() => {
            setPet(null);
            setView('creation');
          }}
        />
      )}
    </div>
  );
}

