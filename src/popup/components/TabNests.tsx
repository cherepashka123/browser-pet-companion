import React, { useState, useEffect } from 'react';
import { TabInfo, TabCategoryId } from '../../types';
import { TAB_NESTS, groupTabsByCategory, getNestForTab } from '../../utils/tabNests';
import { analyzeTabHealth } from '../../utils/tabAnalyzer';

interface TabNestsProps {
  onTabSelect?: (tabId: number) => void;
}

export function TabNests({ onTabSelect }: TabNestsProps) {
  const [tabs, setTabs] = useState<TabInfo[]>([]);
  const [expandedNests, setExpandedNests] = useState<Set<TabCategoryId>>(new Set(['unsorted']));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTabs();
    const interval = setInterval(loadTabs, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadTabs() {
    try {
      const chromeTabs = await chrome.tabs.query({});
      const allTabs: TabInfo[] = [];
      
      for (const tab of chromeTabs) {
        if (!tab.id || !tab.url) continue;
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) continue;
        
        const stored = await chrome.storage.local.get(`tab_${tab.id}`);
        const existing = stored[`tab_${tab.id}`] as Partial<TabInfo> | undefined;
        const now = Date.now();
        
        const tabInfo: TabInfo = {
          tabId: tab.id,
          windowId: tab.windowId!,
          url: tab.url,
          title: tab.title || '',
          domain: new URL(tab.url).hostname,
          favicon: tab.favIconUrl,
          openedAt: existing?.openedAt || now,
          lastActiveAt: existing?.lastActiveAt || now,
          activeTimeMs: existing?.activeTimeMs || 0,
          pinned: tab.pinned || false,
          audible: tab.audible || false,
          categoryId: existing?.categoryId,
          categoryConfidence: existing?.categoryConfidence
        };
        
        allTabs.push(tabInfo);
      }
      
      setTabs(allTabs);
    } catch (error) {
      console.error('Error loading tabs:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleNest(nestId: TabCategoryId) {
    const newExpanded = new Set(expandedNests);
    if (newExpanded.has(nestId)) {
      newExpanded.delete(nestId);
    } else {
      newExpanded.add(nestId);
    }
    setExpandedNests(newExpanded);
  }

  async function handleChangeCategory(tabId: number, newCategory: TabCategoryId) {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_TAB_CATEGORY',
      tabId,
      categoryId: newCategory
    });
    await loadTabs();
  }

  const groupedTabs = groupTabsByCategory(tabs);
  const sortedNests = TAB_NESTS.filter(nest => {
    const nestTabs = groupedTabs.get(nest.id) || [];
    return nestTabs.length > 0 || nest.id === 'unsorted';
  });

  if (loading) {
    return (
      <div className="tab-nests loading">
        <div className="spinner"></div>
        <p>Loading your nests...</p>
      </div>
    );
  }

  return (
    <div className="tab-nests">
      <div className="nests-header">
        <h2>Tab Nests</h2>
        <p className="nests-subtitle">Your tabs organized by category</p>
      </div>

      <div className="nests-list">
        {sortedNests.map(nest => {
          const nestTabs = groupedTabs.get(nest.id) || [];
          const isExpanded = expandedNests.has(nest.id);
          
          return (
            <div key={nest.id} className="nest-card">
              <div 
                className="nest-header"
                onClick={() => toggleNest(nest.id)}
                style={{ borderLeftColor: nest.color }}
              >
                <div className="nest-header-left">
                  <div 
                    className="nest-icon"
                    style={{ backgroundColor: `${nest.color}20`, color: nest.color }}
                  >
                    {nest.icon.charAt(0).toUpperCase()}
                  </div>
                  <div className="nest-info">
                    <h3>{nest.name}</h3>
                    <span className="nest-count">{nestTabs.length} {nestTabs.length === 1 ? 'tab' : 'tabs'}</span>
                  </div>
                </div>
                <button className="nest-toggle">
                  {isExpanded ? '−' : '+'}
                </button>
              </div>
              
              {isExpanded && nestTabs.length > 0 && (
                <div className="nest-tabs">
                  {nestTabs.map(tab => (
                    <div key={tab.tabId} className="nest-tab-item">
                      <div className="tab-left-content">
                        <img 
                          src={tab.favicon || ''} 
                          alt="" 
                          className="tab-favicon"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="tab-info">
                          <div className="tab-title">{tab.title || 'Untitled'}</div>
                          <div className="tab-domain">{tab.domain}</div>
                        </div>
                      </div>
                      <div className="tab-right-content">
                        <select
                          className="category-select"
                          value={tab.categoryId || 'unsorted'}
                          onChange={(e) => handleChangeCategory(tab.tabId, e.target.value as TabCategoryId)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {TAB_NESTS.map(n => (
                            <option key={n.id} value={n.id}>{n.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {isExpanded && nestTabs.length === 0 && (
                <div className="nest-empty">
                  <p>No tabs in this nest yet</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

