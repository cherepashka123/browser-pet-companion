import { TabCategoryId, TabNest, TabInfo, DomainRule, CategorizationSettings, CategorizationState } from '../types';

// Define all available Tab Nests
export const TAB_NESTS: TabNest[] = [
  {
    id: 'school',
    name: 'School / Study',
    icon: 'school',
    color: '#8B5CF6',
    description: 'Academic work and learning'
  },
  {
    id: 'work',
    name: 'Work / Projects',
    icon: 'work',
    color: '#3B82F6',
    description: 'Professional tasks and projects'
  },
  {
    id: 'personal',
    name: 'Personal / Life',
    icon: 'personal',
    color: '#10B981',
    description: 'Personal matters and daily life'
  },
  {
    id: 'creative',
    name: 'Creative / Design',
    icon: 'creative',
    color: '#F59E0B',
    description: 'Creative projects and inspiration'
  },
  {
    id: 'shopping',
    name: 'Shopping / Money',
    icon: 'shopping',
    color: '#EC4899',
    description: 'Shopping and financial matters'
  },
  {
    id: 'research',
    name: 'Research / Deep Dive',
    icon: 'research',
    color: '#6366F1',
    description: 'Research and exploration'
  },
  {
    id: 'random',
    name: 'Random / Rabbit Hole',
    icon: 'random',
    color: '#14B8A6',
    description: 'Random browsing and discoveries'
  },
  {
    id: 'unsorted',
    name: 'Unsorted',
    icon: 'unsorted',
    color: '#6B7280',
    description: 'Tabs without a category yet'
  }
];

export function getNestById(id: TabCategoryId): TabNest | undefined {
  return TAB_NESTS.find(nest => nest.id === id);
}

export function getNestForTab(tab: TabInfo): TabNest {
  if (tab.categoryId) {
    return getNestById(tab.categoryId) || TAB_NESTS[TAB_NESTS.length - 1];
  }
  return TAB_NESTS[TAB_NESTS.length - 1]; // unsorted
}

// Domain patterns for automatic detection
const DOMAIN_PATTERNS: Record<TabCategoryId, string[]> = {
  school: [
    'edu', 'canvas', 'blackboard', 'moodle', 'coursera', 'edx', 'khan',
    'university', 'college', 'school', 'academic', 'scholar', 'researchgate'
  ],
  work: [
    'slack', 'teams', 'jira', 'confluence', 'asana', 'trello', 'notion',
    'github', 'gitlab', 'bitbucket', 'linkedin', 'indeed', 'glassdoor',
    'office', 'outlook', 'gmail', 'calendar', 'drive.google'
  ],
  personal: [
    'facebook', 'instagram', 'twitter', 'reddit', 'discord', 'whatsapp',
    'messenger', 'youtube', 'netflix', 'spotify', 'pinterest'
  ],
  creative: [
    'behance', 'dribbble', 'figma', 'adobe', 'canva', 'pinterest',
    'artstation', 'deviantart', 'unsplash', 'pexels', 'flickr'
  ],
  shopping: [
    'amazon', 'ebay', 'etsy', 'shopify', 'paypal', 'stripe', 'venmo',
    'bank', 'credit', 'cart', 'checkout', 'store', 'shop'
  ],
  research: [
    'wikipedia', 'arxiv', 'pubmed', 'scholar.google', 'researchgate',
    'jstor', 'ieee', 'acm', 'nature', 'science', 'pubmed'
  ],
  random: [],
  unsorted: []
};

// Title keywords for detection
const TITLE_KEYWORDS: Record<TabCategoryId, string[]> = {
  school: ['homework', 'assignment', 'exam', 'quiz', 'lecture', 'course', 'study', 'notes'],
  work: ['meeting', 'project', 'task', 'deadline', 'report', 'presentation', 'client'],
  personal: ['recipe', 'travel', 'weather', 'news', 'blog', 'diary', 'journal'],
  creative: ['design', 'art', 'illustration', 'photo', 'video', 'music', 'drawing'],
  shopping: ['buy', 'price', 'deal', 'sale', 'cart', 'checkout', 'payment', 'order'],
  research: ['research', 'study', 'paper', 'article', 'journal', 'analysis', 'data'],
  random: [],
  unsorted: []
};

/**
 * Detect the most likely category for a tab based on domain and title
 */
export function detectTabCategory(
  tab: TabInfo,
  domainRules: DomainRule[]
): { categoryId: TabCategoryId; confidence: number } {
  // Check domain rules first (highest confidence)
  const domainRule = domainRules.find(rule => 
    tab.domain.includes(rule.domain) || rule.domain === tab.domain
  );
  
  if (domainRule && domainRule.autoApply) {
    return {
      categoryId: domainRule.categoryId,
      confidence: Math.min(0.95, 0.7 + domainRule.confidence * 0.25)
    };
  }
  
  // Check domain patterns
  const domainLower = tab.domain.toLowerCase();
  const titleLower = (tab.title || '').toLowerCase();
  
  let bestMatch: { categoryId: TabCategoryId; confidence: number } | null = null;
  
  for (const [categoryId, patterns] of Object.entries(DOMAIN_PATTERNS)) {
    if (categoryId === 'random' || categoryId === 'unsorted') continue;
    
    // Check domain patterns
    const domainMatch = patterns.some(pattern => domainLower.includes(pattern));
    if (domainMatch) {
      const confidence = 0.75;
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { categoryId: categoryId as TabCategoryId, confidence };
      }
    }
    
    // Check title keywords
    const keywords = TITLE_KEYWORDS[categoryId as TabCategoryId];
    const titleMatch = keywords.some(keyword => titleLower.includes(keyword));
    if (titleMatch) {
      const confidence = 0.65;
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { categoryId: categoryId as TabCategoryId, confidence };
      }
    }
  }
  
  // If we have a domain rule but not auto-apply, use it with lower confidence
  if (domainRule && !domainRule.autoApply) {
    const ruleConfidence = 0.6;
    if (!bestMatch || ruleConfidence > bestMatch.confidence) {
      bestMatch = { categoryId: domainRule.categoryId, confidence: ruleConfidence };
    }
  }
  
  return bestMatch || { categoryId: 'unsorted', confidence: 0 };
}

/**
 * Group tabs by their category
 */
export function groupTabsByCategory(tabs: TabInfo[]): Map<TabCategoryId, TabInfo[]> {
  const groups = new Map<TabCategoryId, TabInfo[]>();
  
  // Initialize all nests
  TAB_NESTS.forEach(nest => {
    groups.set(nest.id, []);
  });
  
  // Group tabs
  tabs.forEach(tab => {
    const categoryId = tab.categoryId || 'unsorted';
    const group = groups.get(categoryId) || [];
    group.push(tab);
    groups.set(categoryId, group);
  });
  
  return groups;
}

/**
 * Check if we should prompt the user about a tab
 */
export function shouldPromptForCategory(
  tab: TabInfo,
  settings: CategorizationSettings,
  state: CategorizationState
): boolean {
  if (!settings.enabled) return false;
  
  // Check if domain is muted
  if (settings.mutedDomains.includes(tab.domain)) return false;
  
  // IMPORTANT: Only ask once per domain - check if we've already prompted for this domain
  const promptedDomains = state.promptedDomains || [];
  if (promptedDomains.includes(tab.domain)) {
    return false; // Already asked about this domain, don't ask again
  }
  
  // Check if we've hit the daily limit
  if (state.promptsShownToday >= state.dailyLimit) return false;
  
  // Check hourly limit
  const now = Date.now();
  if (state.lastPromptAt) {
    const hoursSinceLastPrompt = (now - state.lastPromptAt) / (1000 * 60 * 60);
    if (hoursSinceLastPrompt < 1 && state.promptsShownToday >= settings.maxPromptsPerHour) {
      return false;
    }
    // Reset daily count if it's been more than an hour
    if (hoursSinceLastPrompt >= 1) {
      state.promptsShownToday = 0;
    }
  }
  
  // Check if domain already has a rule (auto-apply means we don't need to ask)
  const hasAutoRule = state.domainRules.some((rule: DomainRule) => 
    (tab.domain.includes(rule.domain) || rule.domain === tab.domain) && rule.autoApply
  );
  
  if (hasAutoRule) {
    return false; // Already has auto-apply rule, no need to ask
  }
  
  // Only prompt if confidence is reasonable but not certain
  if (tab.categoryConfidence && tab.categoryConfidence > 0.5 && tab.categoryConfidence < 0.9) {
    return true;
  }
  
  return false;
}

/**
 * Generate a cute prompt message from the pet
 */
export function generateCategoryPrompt(
  tab: TabInfo,
  categoryId: TabCategoryId,
  petName: string
): string {
  const nest = getNestById(categoryId);
  const categoryName = nest?.name || categoryId;
  
  const prompts = [
    `This looks like a ${categoryName.toLowerCase()} tab. Should I file it in your ${categoryName} Nest?`,
    `I think this belongs in ${categoryName}. Want me to organize it?`,
    `This seems like ${categoryName.toLowerCase()} to me. Should I add it there?`,
    `Is this a ${categoryName.toLowerCase()} tab? I can organize it for you!`
  ];
  
  return prompts[Math.floor(Math.random() * prompts.length)];
}

