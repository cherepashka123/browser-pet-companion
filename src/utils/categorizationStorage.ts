import { CategorizationState, CategorizationSettings, DomainRule, TabCategoryId } from '../types';
import { getAppState, saveAppState } from './storage';

const DEFAULT_SETTINGS: CategorizationSettings = {
  enabled: true,
  maxPromptsPerHour: 5,
  askForNewDomainsOnly: false,
  mutedDomains: []
};

const DEFAULT_STATE: CategorizationState = {
  domainRules: [],
  promptsShownToday: 0,
  dailyLimit: 20,
  promptedDomains: [] // Track domains we've already asked about
};

export async function getCategorizationSettings(): Promise<CategorizationSettings> {
  const state = await getAppState();
  return state.categorizationSettings || DEFAULT_SETTINGS;
}

export async function saveCategorizationSettings(settings: CategorizationSettings): Promise<void> {
  const state = await getAppState();
  state.categorizationSettings = settings;
  await saveAppState(state);
}

export async function getCategorizationState(): Promise<CategorizationState> {
  const state = await getAppState();
  return state.categorization || DEFAULT_STATE;
}

export async function saveCategorizationState(catState: CategorizationState): Promise<void> {
  const state = await getAppState();
  state.categorization = catState;
  await saveAppState(state);
}

export async function addDomainRule(rule: DomainRule): Promise<void> {
  const catState = await getCategorizationState();
  // Remove existing rule for this domain if any
  catState.domainRules = catState.domainRules.filter(r => r.domain !== rule.domain);
  catState.domainRules.push(rule);
  await saveCategorizationState(catState);
}

export async function updateDomainRuleConfidence(
  domain: string,
  categoryId: TabCategoryId,
  confirmed: boolean
): Promise<void> {
  const catState = await getCategorizationState();
  const rule = catState.domainRules.find(r => r.domain === domain);
  
  if (rule && rule.categoryId === categoryId) {
    // Increase confidence if confirmed, decrease if denied
    rule.confidence = confirmed
      ? Math.min(1.0, rule.confidence + 0.2)
      : Math.max(0, rule.confidence - 0.3);
    
    // Auto-apply if confidence is high enough
    if (rule.confidence >= 0.8) {
      rule.autoApply = true;
    }
  } else if (confirmed) {
    // Create new rule
    await addDomainRule({
      domain,
      categoryId,
      createdAt: Date.now(),
      autoApply: false,
      confidence: 0.7
    });
  }
  
  await saveCategorizationState(catState);
}

export async function incrementPromptCount(domain?: string): Promise<void> {
  const catState = await getCategorizationState();
  catState.promptsShownToday += 1;
  catState.lastPromptAt = Date.now();
  
  // Track that we've prompted for this domain (so we don't ask again)
  if (domain) {
    if (!catState.promptedDomains) {
      catState.promptedDomains = [];
    }
    if (!catState.promptedDomains.includes(domain)) {
      catState.promptedDomains.push(domain);
    }
  }
  
  await saveCategorizationState(catState);
}

export async function muteDomain(domain: string): Promise<void> {
  const settings = await getCategorizationSettings();
  if (!settings.mutedDomains.includes(domain)) {
    settings.mutedDomains.push(domain);
    await saveCategorizationSettings(settings);
  }
}

export async function getDomainRule(domain: string): Promise<DomainRule | null> {
  const catState = await getCategorizationState();
  return catState.domainRules.find(r => 
    domain.includes(r.domain) || r.domain === domain
  ) || null;
}

