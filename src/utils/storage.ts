import { AppState, PetConfig, NestArchiveItem, NotificationPreferences } from '../types';

const STORAGE_KEYS = {
  APP_STATE: 'browserPetAppState',
  TAB_TRACKING: 'browserPetTabTracking',
  LAST_EMOTION: 'browserPetLastEmotion'
} as const;

export async function getAppState(): Promise<AppState> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.APP_STATE);
  return result[STORAGE_KEYS.APP_STATE] || {
    preferences: {
      showNudges: true,
      showDailyDigest: true,
      showEmotionalHalo: true
    },
    nestArchive: [],
    cleanupCounts: {}
  };
}

export async function saveAppState(state: AppState): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.APP_STATE]: state
  });
}

export async function getPetConfig(): Promise<PetConfig | null> {
  const state = await getAppState();
  return state.pet || null;
}

export async function savePetConfig(pet: PetConfig): Promise<void> {
  const state = await getAppState();
  state.pet = pet;
  await saveAppState(state);
}

export async function getNestArchive(): Promise<NestArchiveItem[]> {
  const state = await getAppState();
  return state.nestArchive || [];
}

export async function addToNestArchive(items: NestArchiveItem[]): Promise<void> {
  const state = await getAppState();
  state.nestArchive = [...(state.nestArchive || []), ...items];
  await saveAppState(state);
}

export async function removeFromNestArchive(itemId: string): Promise<void> {
  const state = await getAppState();
  state.nestArchive = (state.nestArchive || []).filter(item => item.id !== itemId);
  await saveAppState(state);
}

export async function getPreferences(): Promise<NotificationPreferences> {
  const state = await getAppState();
  return state.preferences || {
    showNudges: true,
    showDailyDigest: true,
    showEmotionalHalo: true
  };
}

export async function savePreferences(prefs: NotificationPreferences): Promise<void> {
  const state = await getAppState();
  state.preferences = prefs;
  await saveAppState(state);
}

export async function recordCleanup(count: number): Promise<void> {
  const state = await getAppState();
  const today = new Date().toISOString().split('T')[0];
  state.cleanupCounts = state.cleanupCounts || {};
  state.cleanupCounts[today] = (state.cleanupCounts[today] || 0) + count;
  await saveAppState(state);
}

