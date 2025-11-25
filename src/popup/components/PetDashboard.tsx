import React, { useState } from 'react';
import { PetConfig, TabHealthMetrics, TabInfo } from '../../types';

function generateDefaultPetSVG(): string {
  const svg = `
    <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="defaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#D4A5B8;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#C8B8D4;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="48" fill="url(#defaultGrad)"/>
      <circle cx="50" cy="55" r="4" fill="#4A5568"/>
      <circle cx="78" cy="55" r="4" fill="#4A5568"/>
      <path d="M 52 72 Q 64 77 76 72" stroke="#4A5568" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="52" cy="65" rx="6" ry="4" fill="#E8D5C4" opacity="0.4"/>
      <ellipse cx="76" cy="65" rx="6" ry="4" fill="#E8D5C4" opacity="0.4"/>
    </svg>
  `.trim();
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

interface PetDashboardProps {
  pet: PetConfig;
  metrics: TabHealthMetrics;
  onMetricsRefresh: () => Promise<void>;
  onArchiveUpdate: () => Promise<void>;
}

export function PetDashboard({ pet, metrics, onMetricsRefresh, onArchiveUpdate }: PetDashboardProps) {
  const [processing, setProcessing] = useState(false);

  const emotionMessages: Record<string, string> = {
    CALM: "I'm feeling calm and peaceful",
    CONTENT: "Everything looks good! I'm content",
    SLEEPY: "I'm getting sleepy...",
    ALERT: "I notice some tabs that need attention",
    CONFUSED: "I'm a bit confused by all these duplicate tabs",
    OVERWHELMED: "There are so many tabs! I'm overwhelmed",
    CELEBRATING: "We're so clean! I'm celebrating"
  };

  async function handleTuckIntoTab(tabId: number) {
    setProcessing(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CLOSE_TABS', tabIds: [tabId] });
      if (response.success) {
        await onMetricsRefresh();
        await onArchiveUpdate();
      }
    } catch (error) {
      console.error('Error closing tab:', error);
    } finally {
      setProcessing(false);
    }
  }

  async function handleTuckIntoGroup(group: TabInfo[]) {
    setProcessing(true);
    try {
      const tabIdsToClose = group.slice(1).map(t => t.tabId);
      const response = await chrome.runtime.sendMessage({ type: 'CLOSE_TABS', tabIds: tabIdsToClose });
      if (response.success) {
        await onMetricsRefresh();
        await onArchiveUpdate();
      }
    } catch (error) {
      console.error('Error closing tabs:', error);
    } finally {
      setProcessing(false);
    }
  }

  async function handleAutoClean() {
    setProcessing(true);
    try {
      const tabIdsToClose: number[] = [];
      metrics.zombieTabs.forEach(tab => { if (!tab.pinned) tabIdsToClose.push(tab.tabId); });
      metrics.duplicateGroups.forEach(group => {
        group.slice(1).forEach(tab => {
          if (!tab.pinned && !tabIdsToClose.includes(tab.tabId)) tabIdsToClose.push(tab.tabId);
        });
      });
      if (tabIdsToClose.length === 0) {
        alert("Your tabs are already clean! Your pet is happy!");
        return;
      }
      const response = await chrome.runtime.sendMessage({ type: 'CLOSE_TABS', tabIds: tabIdsToClose });
      if (response.success) {
        await onMetricsRefresh();
        await onArchiveUpdate();
        alert(`Tucked ${response.archived} tabs into the nest! Your pet is happy!`);
      }
    } catch (error) {
      console.error('Error auto-cleaning:', error);
      alert('Failed to clean tabs. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  function formatTimeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }

  return (
    <div className="pet-dashboard">
      <div className="pet-display">
        <div className="pet-avatar">
          <img 
            src={pet.iconFrames[metrics.currentEmotion] || pet.iconFrames['CONTENT'] || ''} 
            alt={pet.name} 
            className="pet-icon-large"
            onError={(e) => {
              console.error('Pet image failed to load:', pet.iconFrames[metrics.currentEmotion]);
              // Try to use CONTENT emotion as fallback
              const fallback = pet.iconFrames['CONTENT'] || '';
              if (fallback && (e.target as HTMLImageElement).src !== fallback) {
                (e.target as HTMLImageElement).src = fallback;
              } else {
                // Generate a default SVG on the fly
                (e.target as HTMLImageElement).src = generateDefaultPetSVG();
              }
            }}
          />
          <div className={`emotion-halo emotion-${metrics.currentEmotion.toLowerCase()}`}></div>
        </div>
        <div className="pet-info">
          <h2>{pet.name}</h2>
          <p className="emotion-message">{emotionMessages[metrics.currentEmotion]}</p>
          <button 
            className="test-floating-pet-button"
            onClick={async () => {
              await chrome.runtime.sendMessage({ type: 'FORCE_SHOW_PET' });
              alert('Pet should appear in browser corner! Check any open web page.');
            }}
            style={{ marginTop: '8px', padding: '6px 12px', fontSize: '12px' }}
          >
            Show Pet in Browser
          </button>
        </div>
      </div>
      <div className="tab-health-summary">
        <div className="health-stat"><span className="stat-value">{metrics.totalTabs}</span><span className="stat-label">Total Tabs</span></div>
        <div className="health-stat"><span className="stat-value">{metrics.zombieTabs.length}</span><span className="stat-label">Zombie Tabs</span></div>
        <div className="health-stat"><span className="stat-value">{metrics.duplicateGroups.length}</span><span className="stat-label">Duplicate Groups</span></div>
        <div className="health-stat"><span className="stat-value">{metrics.clutterLevel}</span><span className="stat-label">Clutter Level</span></div>
      </div>
      {metrics.zombieTabs.length > 0 && (
        <div className="zombie-tabs-section">
          <h3>Zombie Tabs (inactive for 30+ min)</h3>
          <div className="tab-list">
            {metrics.zombieTabs.slice(0, 5).map((tab) => (
              <div key={tab.tabId} className="tab-item">
                <img src={tab.favicon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>'} alt="" className="tab-favicon" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="tab-details">
                  <div className="tab-title">{tab.title || 'Untitled'}</div>
                  <div className="tab-meta">{tab.domain} • {formatTimeAgo(tab.lastActiveAt)}</div>
                </div>
                <button className="tuck-button" onClick={() => handleTuckIntoTab(tab.tabId)} disabled={processing} title="Tuck into Nest">Tuck</button>
              </div>
            ))}
            {metrics.zombieTabs.length > 5 && <div className="tab-item-more">+{metrics.zombieTabs.length - 5} more zombie tabs</div>}
          </div>
        </div>
      )}
      {metrics.duplicateGroups.length > 0 && (
        <div className="duplicate-tabs-section">
          <h3>Duplicate Tabs</h3>
          {metrics.duplicateGroups.slice(0, 3).map((group, idx) => (
            <div key={idx} className="duplicate-group">
              <div className="group-header">
                <span>{group.length} tabs of the same page</span>
                <button className="merge-button" onClick={() => handleTuckIntoGroup(group)} disabled={processing}>Merge & Tuck</button>
              </div>
              <div className="group-tabs">
                {group.slice(0, 3).map((tab) => (
                  <div key={tab.tabId} className="tab-item-small">
                    <img src={tab.favicon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>'} alt="" className="tab-favicon-small" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <span className="tab-title-small">{tab.title || 'Untitled'}</span>
                  </div>
                ))}
                {group.length > 3 && <span className="more-indicator">+{group.length - 3}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="action-section">
        <button className="auto-clean-button" onClick={handleAutoClean} disabled={processing || (metrics.zombieTabs.length === 0 && metrics.duplicateGroups.length === 0)}>
          {processing ? 'Cleaning...' : 'Let my pet clean safely'}
        </button>
        
      </div>
    </div>
  );
}

