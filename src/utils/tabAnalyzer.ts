import { TabInfo, TabHealthMetrics, PetEmotion } from '../types';
import { detectTabCategory } from './tabNests';
import { getCategorizationState } from './categorizationStorage';

const ZOMBIE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
const CLUTTER_THRESHOLDS = {
  low: 5,
  medium: 15,
  high: 30,
  extreme: 50
};

export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove query params, hash, and trailing slashes for comparison
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`.replace(/\/$/, '');
  } catch {
    return url;
  }
}

export function detectZombieTabs(tabs: TabInfo[]): TabInfo[] {
  const now = Date.now();
  return tabs.filter(tab => {
    if (tab.pinned) return false;
    const inactiveTime = now - tab.lastActiveAt;
    return inactiveTime > ZOMBIE_THRESHOLD_MS;
  });
}

export function detectDuplicateTabs(tabs: TabInfo[]): TabInfo[][] {
  const groups = new Map<string, TabInfo[]>();
  
  tabs.forEach(tab => {
    const normalized = normalizeUrl(tab.url);
    if (!groups.has(normalized)) {
      groups.set(normalized, []);
    }
    groups.get(normalized)!.push(tab);
  });
  
  // Return only groups with duplicates
  return Array.from(groups.values()).filter(group => group.length > 1);
}

export function calculateClutterLevel(totalTabs: number): 'low' | 'medium' | 'high' | 'extreme' {
  if (totalTabs <= CLUTTER_THRESHOLDS.low) return 'low';
  if (totalTabs <= CLUTTER_THRESHOLDS.medium) return 'medium';
  if (totalTabs <= CLUTTER_THRESHOLDS.high) return 'high';
  return 'extreme';
}

export function determineEmotion(metrics: Omit<TabHealthMetrics, 'currentEmotion'>): PetEmotion {
  const { totalTabs, zombieTabs, duplicateGroups, clutterLevel } = metrics;
  
  // Celebrating: recent cleanup or very clean state
  if (totalTabs <= 3 && zombieTabs.length === 0) {
    return 'CELEBRATING';
  }
  
  // Overwhelmed: extreme clutter
  if (clutterLevel === 'extreme' || totalTabs > 50) {
    return 'OVERWHELMED';
  }
  
  // Confused: many duplicates
  if (duplicateGroups.length > 3) {
    return 'CONFUSED';
  }
  
  // Alert: many zombies
  if (zombieTabs.length > 5) {
    return 'ALERT';
  }
  
  // Sleepy: low activity, few tabs
  if (totalTabs <= 5 && zombieTabs.length === 0) {
    return 'SLEEPY';
  }
  
  // Content: moderate, healthy state
  if (clutterLevel === 'low' || clutterLevel === 'medium') {
    return 'CONTENT';
  }
  
  // Default: calm
  return 'CALM';
}

export async function analyzeTabHealth(): Promise<TabHealthMetrics> {
  const tabs = await chrome.tabs.query({});
  const catState = await getCategorizationState();
  
  const tabInfos: TabInfo[] = await Promise.all(
    tabs.map(async (tab) => {
      const stored = await getStoredTabInfo(tab.id!);
      const now = Date.now();
      
      const tabInfo: TabInfo = {
        tabId: tab.id!,
        windowId: tab.windowId!,
        url: tab.url || '',
        title: tab.title || '',
        domain: new URL(tab.url || 'about:blank').hostname,
        favicon: tab.favIconUrl,
        openedAt: stored?.openedAt || now,
        lastActiveAt: stored?.lastActiveAt || now,
        activeTimeMs: stored?.activeTimeMs || 0,
        pinned: tab.pinned || false,
        audible: tab.audible || false,
        categoryId: stored?.categoryId,
        categoryConfidence: stored?.categoryConfidence
      };
      
      // Auto-categorize if not already categorized and we have domain rules
      if (!tabInfo.categoryId && catState.domainRules.length > 0) {
        const detection = detectTabCategory(tabInfo, catState.domainRules);
        if (detection.confidence > 0.7 && detection.categoryId !== 'unsorted') {
          tabInfo.categoryId = detection.categoryId;
          tabInfo.categoryConfidence = detection.confidence;
          // Save the categorization
          await updateTabInfo(tab.id!, {
            categoryId: detection.categoryId,
            categoryConfidence: detection.confidence
          });
        }
      }
      
      return tabInfo;
    })
  );
  
  const zombieTabs = detectZombieTabs(tabInfos);
  const duplicateGroups = detectDuplicateTabs(tabInfos);
  const totalTabs = tabInfos.length;
  const clutterLevel = calculateClutterLevel(totalTabs);
  
  const metrics: Omit<TabHealthMetrics, 'currentEmotion'> = {
    totalTabs,
    zombieTabs,
    duplicateGroups,
    clutterLevel
  };
  
  const currentEmotion = determineEmotion(metrics);
  
  return {
    ...metrics,
    currentEmotion
  };
}

async function getStoredTabInfo(tabId: number): Promise<Partial<TabInfo> | null> {
  const result = await chrome.storage.local.get(`tab_${tabId}`);
  return result[`tab_${tabId}`] || null;
}

export async function updateTabInfo(tabId: number, updates: Partial<TabInfo>): Promise<void> {
  const existing = await getStoredTabInfo(tabId);
  const updated = {
    ...existing,
    ...updates,
    tabId
  };
  await chrome.storage.local.set({ [`tab_${tabId}`]: updated });
}

