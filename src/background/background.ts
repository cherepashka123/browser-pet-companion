import { analyzeTabHealth, updateTabInfo } from "../utils/tabAnalyzer";
import { getPetConfig, getPreferences, recordCleanup } from "../utils/storage";
import { TabInfo, NestArchiveItem, TabCategoryId } from "../types";
import { detectTabCategory, shouldPromptForCategory } from "../utils/tabNests";
import {
  getCategorizationState,
  getCategorizationSettings,
  updateDomainRuleConfidence,
  incrementPromptCount,
  muteDomain,
  addDomainRule,
} from "../utils/categorizationStorage";

// Track active tab
let activeTabId: number | null = null;

// Initialize
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Browser Pet Companion installed");
  await updateAllTabs();
  await updatePetIcon();
});

// Tab events
chrome.tabs.onCreated.addListener(async (tab) => {
  if (tab.id) {
    await updateTabInfo(tab.id, {
      openedAt: Date.now(),
      lastActiveAt: Date.now(),
      activeTimeMs: 0,
    });
  }
  await updatePetIcon();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const domain = new URL(tab.url).hostname;
    const stored = await chrome.storage.local.get(`tab_${tabId}`);
    const existing = stored[`tab_${tabId}`] as Partial<TabInfo> | undefined;

    const tabInfo: Partial<TabInfo> = {
      url: tab.url,
      title: tab.title || "",
      domain,
      favicon: tab.favIconUrl,
      lastActiveAt: Date.now(),
      categoryId: existing?.categoryId,
      categoryConfidence: existing?.categoryConfidence,
    };

    // Check for categorization if not already categorized
    if (
      !tabInfo.categoryId &&
      !tab.url.startsWith("chrome://") &&
      !tab.url.startsWith("chrome-extension://")
    ) {
      const catState = await getCategorizationState();
      const catSettings = await getCategorizationSettings();

      const fullTabInfo: TabInfo = {
        tabId,
        windowId: tab.windowId!,
        url: tab.url,
        title: tab.title || "",
        domain,
        favicon: tab.favIconUrl,
        openedAt: existing?.openedAt || Date.now(),
        lastActiveAt: Date.now(),
        activeTimeMs: existing?.activeTimeMs || 0,
        pinned: tab.pinned || false,
        audible: tab.audible || false,
        categoryId: existing?.categoryId,
        categoryConfidence: existing?.categoryConfidence,
      };

      const detection = detectTabCategory(fullTabInfo, catState.domainRules);

      if (detection.confidence > 0.5 && detection.categoryId !== "unsorted") {
        tabInfo.categoryId = detection.categoryId;
        tabInfo.categoryConfidence = detection.confidence;

        // Check if we should prompt
        fullTabInfo.categoryId = detection.categoryId;
        fullTabInfo.categoryConfidence = detection.confidence;

        if (shouldPromptForCategory(fullTabInfo, catSettings, catState)) {
          await showCategoryPrompt(tabId, fullTabInfo, detection.categoryId);
        } else if (detection.confidence > 0.8) {
          // Auto-apply high confidence
          tabInfo.categoryId = detection.categoryId;
        }
      }
    }

    await updateTabInfo(tabId, tabInfo);
    await updatePetIcon();
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const now = Date.now();
  activeTabId = activeInfo.tabId;

  // Update active time for previously active tab
  if (activeTabId) {
    const tab = await chrome.tabs.get(activeTabId);
    if (tab.id) {
      const stored = await chrome.storage.local.get(`tab_${tab.id}`);
      const existing = stored[`tab_${tab.id}`] as Partial<TabInfo> | undefined;
      if (existing) {
        const activeTime = now - (existing.lastActiveAt || now);
        await updateTabInfo(tab.id, {
          lastActiveAt: now,
          activeTimeMs: (existing.activeTimeMs || 0) + activeTime,
        });
      }
    }
  }

  await updatePetIcon();
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await chrome.storage.local.remove(`tab_${tabId}`);
  await updatePetIcon();
});

// Update pet icon based on current emotion
async function updatePetIcon(): Promise<void> {
  try {
    const metrics = await analyzeTabHealth();
    const pet = await getPetConfig();
    const prefs = await getPreferences();

    if (!pet) {
      // Default icon if no pet configured
      return;
    }

    const emotion = metrics.currentEmotion;
    const iconUrl = pet.iconFrames[emotion];

    // Update badge with emotion indicator
    const emotionColors: Record<string, string> = {
      CALM: "#90EE90",
      CONTENT: "#87CEEB",
      SLEEPY: "#DDA0DD",
      ALERT: "#FFD700",
      CONFUSED: "#9370DB",
      OVERWHELMED: "#FF6347",
      CELEBRATING: "#FFD700",
    };

    if (prefs.showEmotionalHalo) {
      chrome.action.setBadgeBackgroundColor({
        color: emotionColors[emotion] || "#87CEEB",
      });
      chrome.action.setBadgeText({ text: "●" });
    } else {
      chrome.action.setBadgeText({ text: "" });
    }

    // Store current emotion for popup
    await chrome.storage.local.set({ currentEmotion: emotion });

    // Notify content scripts to update floating pet
    await notifyTabsOfPetUpdate();

    // Send nudges if enabled
    if (prefs.showNudges) {
      await checkAndSendNudge(metrics);
    }
  } catch (error) {
    console.error("Error updating pet icon:", error);
  }
}

async function checkAndSendNudge(metrics: any): Promise<void> {
  const { totalTabs, zombieTabs, duplicateGroups, currentEmotion } = metrics;

  // Only send nudges for significant states
  if (currentEmotion === "OVERWHELMED" && totalTabs > 30) {
    await sendNudge("I'm overwhelmed... too many tabs...");
  } else if (zombieTabs.length >= 3) {
    await sendNudge(`I think ${zombieTabs.length} tabs need a nap...`);
  } else if (duplicateGroups.length > 2) {
    await sendNudge("I see some duplicate tabs... should we clean up?");
  } else if (currentEmotion === "CELEBRATING") {
    await sendNudge("We're so clean!! I'm proud!");
  }
}

async function sendNudge(message: string): Promise<void> {
  // Store nudge to be displayed by content script
  await chrome.storage.local.set({
    lastNudge: {
      message,
      timestamp: Date.now(),
    },
  });

  // Notify all tabs
  const tabs = await chrome.tabs.query({});
  tabs.forEach((tab) => {
    if (tab.id) {
      chrome.tabs
        .sendMessage(tab.id, {
          type: "SHOW_NUDGE",
          message,
        })
        .catch(() => {
          // Ignore errors for tabs that don't have content script
        });
    }
  });
}

async function updateAllTabs(): Promise<void> {
  const tabs = await chrome.tabs.query({});
  const now = Date.now();

  for (const tab of tabs) {
    if (tab.id && tab.url) {
      await updateTabInfo(tab.id, {
        url: tab.url,
        title: tab.title || "",
        domain: new URL(tab.url).hostname,
        favicon: tab.favIconUrl,
        openedAt: now,
        lastActiveAt: now,
        activeTimeMs: 0,
        pinned: tab.pinned || false,
        audible: tab.audible || false,
      });
    }
  }
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_TAB_HEALTH") {
    analyzeTabHealth().then(sendResponse);
    return true; // Async response
  }

  if (message.type === "GET_PET_DATA") {
    handleGetPetData().then(sendResponse);
    return true;
  }

  if (message.type === "CLOSE_TABS") {
    handleCloseTabs(message.tabIds).then(sendResponse);
    return true;
  }

  if (message.type === "UPDATE_ICON") {
    updatePetIcon().then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.type === "UPDATE_TAB_CATEGORY") {
    handleUpdateTabCategory(message.tabId, message.categoryId).then(
      sendResponse
    );
    return true;
  }

  if (message.type === "CONFIRM_CATEGORY") {
    handleConfirmCategory(message.tabId, message.categoryId).then(sendResponse);
    return true;
  }

  if (message.type === "DENY_CATEGORY") {
    handleDenyCategory(message.tabId, message.suggestedCategory).then(
      sendResponse
    );
    return true;
  }

  if (message.type === "MUTE_DOMAIN") {
    muteDomain(message.domain).then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.type === "FORCE_SHOW_PET") {
    forceShowPetInAllTabs().then(() => sendResponse({ success: true }));
    return true;
  }
});

async function forceShowPetInAllTabs(): Promise<void> {
  const pet = await getPetConfig();
  if (!pet) {
    console.log("[Background] No pet to show");
    return;
  }

  const metrics = await analyzeTabHealth();
  const emotion = metrics.currentEmotion;
  const petImage = pet.iconFrames[emotion] || pet.iconFrames["CONTENT"] || "";

  const tabs = await chrome.tabs.query({});
  tabs.forEach((tab) => {
    if (
      tab.id &&
      tab.url &&
      !tab.url.startsWith("chrome://") &&
      !tab.url.startsWith("chrome-extension://")
    ) {
      chrome.tabs
        .sendMessage(tab.id, {
          type: "INIT_FLOATING_PET",
          petImage,
          emotion,
        })
        .catch(() => {
          // Ignore errors
        });
    }
  });
}

async function showCategoryPrompt(
  tabId: number,
  tab: TabInfo,
  categoryId: TabCategoryId
): Promise<void> {
  const pet = await getPetConfig();
  if (!pet) return;

  const tabObj = await chrome.tabs.get(tabId);
  if (!tabObj.id) return;

  // Track that we're prompting for this domain (so we don't ask again)
  await incrementPromptCount(tab.domain);

  chrome.tabs
    .sendMessage(tabObj.id, {
      type: "SHOW_CATEGORY_PROMPT",
      tab,
      suggestedCategory: categoryId,
      petName: pet.name,
    })
    .catch(() => {
      // Ignore errors
    });
}

async function handleUpdateTabCategory(
  tabId: number,
  categoryId: TabCategoryId
): Promise<{ success: boolean }> {
  try {
    await updateTabInfo(tabId, { categoryId });
    return { success: true };
  } catch (error) {
    console.error("Error updating tab category:", error);
    return { success: false };
  }
}

async function handleConfirmCategory(
  tabId: number,
  categoryId: TabCategoryId
): Promise<{ success: boolean }> {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url) return { success: false };

    const domain = new URL(tab.url).hostname;
    await updateTabInfo(tabId, { categoryId, categoryConfidence: 0.9 });
    await updateDomainRuleConfidence(domain, categoryId, true);

    return { success: true };
  } catch (error) {
    console.error("Error confirming category:", error);
    return { success: false };
  }
}

async function handleDenyCategory(
  tabId: number,
  suggestedCategory: TabCategoryId
): Promise<{ success: boolean }> {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url) return { success: false };

    const domain = new URL(tab.url).hostname;
    await updateDomainRuleConfidence(domain, suggestedCategory, false);

    return { success: true };
  } catch (error) {
    console.error("Error denying category:", error);
    return { success: false };
  }
}

async function handleGetPetData(): Promise<{
  petImage: string;
  emotion: string;
} | null> {
  const pet = await getPetConfig();
  console.log("[Background] Getting pet data, pet exists:", !!pet);

  if (!pet) {
    console.log("[Background] No pet configured, returning null");
    return null;
  }

  try {
    const metrics = await analyzeTabHealth();
    const emotion = metrics.currentEmotion;
    const petImage = pet.iconFrames[emotion] || pet.iconFrames["CONTENT"] || "";

    console.log("[Background] Pet data:", {
      emotion,
      hasImage: !!petImage,
      imageLength: petImage.length,
    });

    return { petImage, emotion };
  } catch (error) {
    console.error("[Background] Error getting pet data:", error);
    // Return default
    const defaultImage = pet.iconFrames["CONTENT"] || "";
    return { petImage: defaultImage, emotion: "CONTENT" };
  }
}

// Notify all tabs when pet updates
async function notifyTabsOfPetUpdate() {
  const pet = await getPetConfig();
  if (!pet) return;

  try {
    const metrics = await analyzeTabHealth();
    const emotion = metrics.currentEmotion;
    const petImage = pet.iconFrames[emotion] || pet.iconFrames["CONTENT"] || "";

    const tabs = await chrome.tabs.query({});
    tabs.forEach((tab) => {
      if (
        tab.id &&
        tab.url &&
        !tab.url.startsWith("chrome://") &&
        !tab.url.startsWith("chrome-extension://")
      ) {
        chrome.tabs
          .sendMessage(tab.id, {
            type: "UPDATE_FLOATING_PET",
            metrics,
            petImage,
          })
          .catch(() => {
            // Ignore errors for tabs without content script
          });
      }
    });
  } catch (error) {
    console.error("Error notifying tabs:", error);
  }
}

async function handleCloseTabs(
  tabIds: number[]
): Promise<{ success: boolean; archived: number }> {
  try {
    const archiveItems: NestArchiveItem[] = [];
    const now = Date.now();

    for (const tabId of tabIds) {
      const tab = await chrome.tabs.get(tabId);
      if (
        tab.url &&
        !tab.url.startsWith("chrome://") &&
        !tab.url.startsWith("chrome-extension://")
      ) {
        const stored = await chrome.storage.local.get(`tab_${tabId}`);
        const tabInfo = stored[`tab_${tabId}`] as Partial<TabInfo> | undefined;

        archiveItems.push({
          id: `nest_${tabId}_${now}`,
          tabId,
          url: tab.url,
          title: tab.title || "Untitled",
          domain: new URL(tab.url).hostname,
          favicon: tab.favIconUrl,
          closedAt: now,
          itemType: "default", // Could be customized based on pet type
          categoryId: tabInfo?.categoryId, // Preserve category when archiving
        });
      }
    }

    // Add to nest archive
    const { addToNestArchive } = await import("../utils/storage");
    await addToNestArchive(archiveItems);

    // Record cleanup
    await recordCleanup(archiveItems.length);

    // Close tabs
    await chrome.tabs.remove(tabIds);

    // Update icon
    await updatePetIcon();

    return { success: true, archived: archiveItems.length };
  } catch (error) {
    console.error("Error closing tabs:", error);
    return { success: false, archived: 0 };
  }
}

// Periodic updates
setInterval(async () => {
  await updatePetIcon();
}, 60000); // Every minute

// Daily digest check
setInterval(async () => {
  const state = await chrome.storage.local.get("browserPetAppState");
  const appState = state.browserPetAppState;
  const today = new Date().toISOString().split("T")[0];

  if (
    appState?.lastDigestDate !== today &&
    appState?.preferences?.showDailyDigest
  ) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const cleanupCount = appState?.cleanupCounts?.[yesterdayStr] || 0;

    if (cleanupCount > 0) {
      await sendNudge(
        `Your pet is proud! You cleaned ${cleanupCount} tabs yesterday.`
      );
      appState.lastDigestDate = today;
      await chrome.storage.local.set({ browserPetAppState: appState });
    }
  }
}, 3600000); // Check every hour
