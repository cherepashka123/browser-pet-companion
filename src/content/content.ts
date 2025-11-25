// Content script for visual effects: nudges and floating pet

import { initializeFloatingPet, updateFloatingPet, removeFloatingPet } from './floatingPet';
import { showCategoryPrompt, hidePrompt } from './categoryPrompt';
import { TabHealthMetrics, TabInfo, TabCategoryId } from '../types';

interface NudgeMessage {
  type: 'SHOW_NUDGE';
  message: string;
}

interface PetUpdateMessage {
  type: 'UPDATE_FLOATING_PET';
  metrics: TabHealthMetrics;
  petImage: string;
}

interface PetInitMessage {
  type: 'INIT_FLOATING_PET';
  petImage: string;
  emotion: string;
}

interface CategoryPromptMessage {
  type: 'SHOW_CATEGORY_PROMPT';
  tab: TabInfo;
  suggestedCategory: TabCategoryId;
  petName: string;
}

interface ShowFloatingPetMessage {
  type: 'SHOW_FLOATING_PET';
}

interface HideFloatingPetMessage {
  type: 'HIDE_FLOATING_PET';
}

// Create nudge container
let nudgeContainer: HTMLDivElement | null = null;

function createNudgeContainer(): HTMLDivElement {
  if (nudgeContainer) return nudgeContainer;
  
  nudgeContainer = document.createElement('div');
  nudgeContainer.id = 'browser-pet-nudge-container';
  nudgeContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999999;
    pointer-events: none;
  `;
  document.body.appendChild(nudgeContainer);
  return nudgeContainer;
}

function showNudge(message: string): void {
  const container = createNudgeContainer();
  
  const nudge = document.createElement('div');
  nudge.className = 'browser-pet-nudge';
  nudge.style.cssText = `
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    color: #4A5568;
    padding: 12px 16px;
    border-radius: 10px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: 500;
    max-width: 280px;
    border: 1px solid rgba(212, 165, 184, 0.3);
    animation: slideInRight 0.3s ease-out, fadeOut 0.3s ease-in 2.7s forwards;
    pointer-events: auto;
    cursor: pointer;
  `;
  nudge.textContent = message;
  
  // Add animation keyframes if not already added
  if (!document.getElementById('browser-pet-nudge-styles')) {
    const style = document.createElement('style');
    style.id = 'browser-pet-nudge-styles';
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes fadeOut {
        to {
          opacity: 0;
          transform: translateX(400px);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  nudge.addEventListener('click', () => {
    nudge.style.animation = 'fadeOut 0.3s ease-in forwards';
    setTimeout(() => nudge.remove(), 300);
  });
  
  container.appendChild(nudge);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (nudge.parentNode) {
      nudge.style.animation = 'fadeOut 0.3s ease-in forwards';
      setTimeout(() => nudge.remove(), 300);
    }
  }, 3000);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message: NudgeMessage | PetUpdateMessage | PetInitMessage | CategoryPromptMessage | ShowFloatingPetMessage | HideFloatingPetMessage, sender, sendResponse) => {
  if (message.type === 'SHOW_NUDGE') {
    showNudge((message as NudgeMessage).message);
  } else if (message.type === 'INIT_FLOATING_PET') {
    const initMsg = message as PetInitMessage;
    initializeFloatingPet(initMsg.petImage, initMsg.emotion as any);
  } else if (message.type === 'UPDATE_FLOATING_PET') {
    const updateMsg = message as PetUpdateMessage;
    updateFloatingPet(updateMsg.metrics, updateMsg.petImage);
  } else if (message.type === 'SHOW_FLOATING_PET') {
    chrome.runtime.sendMessage({ type: 'GET_PET_DATA' }, (response) => {
      if (response && response.petImage) {
        initializeFloatingPet(response.petImage, response.emotion);
      }
    });
  } else if (message.type === 'HIDE_FLOATING_PET') {
    removeFloatingPet();
  } else if (message.type === 'SHOW_CATEGORY_PROMPT') {
    const promptMsg = message as CategoryPromptMessage;
    showCategoryPrompt({
      tab: promptMsg.tab,
      suggestedCategory: promptMsg.suggestedCategory,
      petName: promptMsg.petName,
      onConfirm: async (categoryId) => {
        await chrome.runtime.sendMessage({
          type: 'CONFIRM_CATEGORY',
          tabId: promptMsg.tab.tabId,
          categoryId
        });
      },
      onDeny: async () => {
        await chrome.runtime.sendMessage({
          type: 'DENY_CATEGORY',
          tabId: promptMsg.tab.tabId,
          suggestedCategory: promptMsg.suggestedCategory
        });
      },
      onMute: async () => {
        await chrome.runtime.sendMessage({
          type: 'MUTE_DOMAIN',
          domain: promptMsg.tab.domain
        });
      }
    });
    sendResponse({ success: true });
    return true;
  }
});

// Initialize floating pet when page loads
async function initPetOnLoad() {
  try {
    console.log('[Browser Pet] Initializing floating pet...');
    
    // Wait a bit for page to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!document.body) {
      console.log('[Browser Pet] Body not ready, waiting...');
      setTimeout(initPetOnLoad, 500);
      return;
    }
    
    console.log('[Browser Pet] Requesting pet data from background...');
    const response = await chrome.runtime.sendMessage({ type: 'GET_PET_DATA' });
    console.log('[Browser Pet] Received response:', response);
    
    if (response && response.petImage && response.emotion) {
      console.log('[Browser Pet] Initializing with pet image');
      initializeFloatingPet(response.petImage, response.emotion);
    } else if (response && response.emotion) {
      console.log('[Browser Pet] Initializing with default image');
      initializeFloatingPet('', response.emotion);
    } else {
      console.log('[Browser Pet] No pet data, creating default pet');
      // Always show a pet, even if none created yet
      initializeFloatingPet('', 'CONTENT');
    }
  } catch (error) {
    console.error('[Browser Pet] Init error:', error);
    // Always create default pet
    setTimeout(() => {
      initializeFloatingPet('', 'CONTENT');
    }, 1000);
  }
}

// Update pet periodically
async function updatePetPeriodically() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_TAB_HEALTH' });
    if (response && response.currentEmotion) {
      const petResponse = await chrome.runtime.sendMessage({ type: 'GET_PET_DATA' });
      if (petResponse && petResponse.petImage) {
        updateFloatingPet(response, petResponse.petImage);
      }
    }
  } catch (error) {
    // Ignore errors
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPetOnLoad);
} else {
  initPetOnLoad();
}

// Update pet every 10 seconds
setInterval(updatePetPeriodically, 10000);
