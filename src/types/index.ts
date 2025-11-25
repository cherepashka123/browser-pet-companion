export type PetEmotion = 
  | 'CALM' 
  | 'CONTENT' 
  | 'SLEEPY' 
  | 'ALERT' 
  | 'CONFUSED' 
  | 'OVERWHELMED' 
  | 'CELEBRATING';

export type PetPersonality = 'calm' | 'normal' | 'chatty';

export interface PetConfig {
  id: string;
  name: string;
  type: 'custom' | 'template';
  description?: string;
  iconFrames: {
    [K in PetEmotion]: string; // base64 or URL
  };
  personality: PetPersonality;
  colors?: {
    primary: string;
    secondary: string;
  };
  createdAt: number;
}

export type TabCategoryId =
  | 'school'
  | 'work'
  | 'personal'
  | 'creative'
  | 'shopping'
  | 'research'
  | 'random'
  | 'unsorted';

export interface TabNest {
  id: TabCategoryId;
  name: string;          // e.g. "School / Study"
  icon: string;          // Icon identifier (no emoji)
  color: string;         // e.g. "#8B5CF6"
  description?: string;  // short explanation for UI
}

export interface TabInfo {
  tabId: number;
  windowId: number;
  url: string;
  title: string;
  domain: string;
  favicon?: string;
  openedAt: number;
  lastActiveAt: number;
  activeTimeMs: number;
  pinned: boolean;
  audible: boolean;
  // NEW: Categorization
  categoryId?: TabCategoryId;
  categoryConfidence?: number; // 0 - 1
}

export interface NestArchiveItem {
  id: string;
  tabId: number;
  url: string;
  title: string;
  domain: string;
  favicon?: string;
  closedAt: number;
  itemType: 'book' | 'plushie' | 'crystal' | 'acorn' | 'default';
  categoryId?: TabCategoryId; // NEW: Category for archived tabs
}

export interface TabHealthMetrics {
  totalTabs: number;
  zombieTabs: TabInfo[];
  duplicateGroups: TabInfo[][];
  clutterLevel: 'low' | 'medium' | 'high' | 'extreme';
  currentEmotion: PetEmotion;
}

export interface NotificationPreferences {
  showNudges: boolean;
  showDailyDigest: boolean;
  showEmotionalHalo: boolean;
}

export interface DomainRule {
  domain: string;              // e.g. "canvas.edu"
  categoryId: TabCategoryId;   // 'school'
  createdAt: number;
  autoApply: boolean;          // if true, no need to prompt
  confidence: number;          // 0 - 1, based on user confirmations
}

export interface CategorizationSettings {
  enabled: boolean;
  maxPromptsPerHour: number;
  askForNewDomainsOnly: boolean;
  mutedDomains: string[];       // domains we never ask about
}

export interface CategorizationState {
  domainRules: DomainRule[];
  lastPromptAt?: number;
  promptsShownToday: number;
  dailyLimit: number;
  promptedDomains: string[]; // Domains we've already asked about (to avoid asking twice)
}

export interface AppState {
  pet?: PetConfig;
  preferences: NotificationPreferences;
  nestArchive: NestArchiveItem[];
  lastDigestDate?: string;
  cleanupCounts: {
    [date: string]: number;
  };
  // NEW: Categorization
  categorization?: CategorizationState;
  categorizationSettings?: CategorizationSettings;
}

export interface PetTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  colors: {
    primary: string;
    secondary: string;
  };
}

