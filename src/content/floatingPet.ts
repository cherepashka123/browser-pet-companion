// Floating pet widget that appears in the browser
import { PetEmotion, TabHealthMetrics } from '../types';

let floatingPetContainer: HTMLDivElement | null = null;
let currentEmotion: PetEmotion = 'CONTENT';
let petImageUrl: string = '';

export function initializeFloatingPet(petImage: string, emotion: PetEmotion) {
  // Check if user dismissed the pet
  chrome.storage.local.get(['floatingPetDismissed'], (result) => {
    if (result.floatingPetDismissed) {
      console.log('[Floating Pet] User dismissed pet, not showing');
      return;
    }
    
    console.log('[Floating Pet] Initializing with emotion:', emotion, 'has image:', !!petImage);
    petImageUrl = petImage || generateDefaultPetSVG();
    currentEmotion = emotion;
    
    // Ensure body exists before creating
    if (document.body) {
      console.log('[Floating Pet] Body exists, creating pet now');
      createFloatingPet();
      updatePetEmotion(emotion);
    } else {
    console.log('[Floating Pet] Waiting for body...');
    // Wait for body
    const checkBody = setInterval(() => {
      if (document.body) {
        console.log('[Floating Pet] Body found, creating pet');
        clearInterval(checkBody);
        createFloatingPet();
        updatePetEmotion(emotion);
      }
    }, 100);
    
    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkBody);
      if (document.body) {
        console.log('[Floating Pet] Timeout reached, creating anyway');
        createFloatingPet();
        updatePetEmotion(emotion);
      }
    }, 5000);
    }
  });
}

export function updateFloatingPet(metrics: TabHealthMetrics, petImage: string) {
  // Check if user dismissed the pet
  chrome.storage.local.get(['floatingPetDismissed'], (result) => {
    if (result.floatingPetDismissed) {
      // User dismissed it, don't show or update
      if (floatingPetContainer) {
        removeFloatingPet();
      }
      return;
    }
    
    currentEmotion = metrics.currentEmotion;
    petImageUrl = petImage;
    
    if (!floatingPetContainer) {
      createFloatingPet();
    }
    
    updatePetEmotion(metrics.currentEmotion);
    updatePetPosition(metrics);
    showStatusIndicator(metrics);
  });
}

function createFloatingPet() {
  if (floatingPetContainer) {
    console.log('[Floating Pet] Already exists, skipping');
    return;
  }
  
  // Wait for body to exist
  if (!document.body) {
    console.log('[Floating Pet] No body, retrying...');
    setTimeout(createFloatingPet, 100);
    return;
  }
  
  console.log('[Floating Pet] Creating floating pet element');
  
  floatingPetContainer = document.createElement('div');
  floatingPetContainer.id = 'browser-pet-floating';
  floatingPetContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 80px;
    height: 80px;
    z-index: 999997;
    pointer-events: auto;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  
  const petWrapper = document.createElement('div');
  petWrapper.style.cssText = `
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  const petImage = document.createElement('img');
  petImage.src = petImageUrl || generateDefaultPetSVG();
  petImage.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
    transition: transform 0.3s ease;
    border-radius: 50%;
  `;
  petImage.alt = 'Pet Companion';
  
  // Handle image load errors
  petImage.onerror = () => {
    petImage.src = generateDefaultPetSVG();
  };
  
  const statusBubble = document.createElement('div');
  statusBubble.id = 'pet-status-bubble';
  statusBubble.style.cssText = `
    position: absolute;
    top: -8px;
    right: -8px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid white;
    background: #A8D5BA;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: white;
    font-weight: bold;
  `;
  
  const doodleContainer = document.createElement('div');
  doodleContainer.id = 'pet-doodles';
  doodleContainer.style.cssText = `
    position: absolute;
    width: 120px;
    height: 120px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    opacity: 0.6;
  `;
  
  petWrapper.appendChild(petImage);
  petWrapper.appendChild(statusBubble);
  petWrapper.appendChild(doodleContainer);
  floatingPetContainer.appendChild(petWrapper);
  
  // Add hover effect
  floatingPetContainer.addEventListener('mouseenter', () => {
    petImage.style.transform = 'scale(1.1)';
    showPetTooltip();
  });
  
  floatingPetContainer.addEventListener('mouseleave', () => {
    petImage.style.transform = 'scale(1)';
    hidePetTooltip();
  });
  
  // Add close button
  const closeButton = document.createElement('div');
  closeButton.innerHTML = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: -8px;
    right: -8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    border: 2px solid rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: bold;
    color: #666;
    cursor: pointer;
    z-index: 999998;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  `;
  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.background = 'rgba(255, 100, 100, 0.9)';
    closeButton.style.color = 'white';
    closeButton.style.transform = 'scale(1.1)';
  });
  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.background = 'rgba(255, 255, 255, 0.9)';
    closeButton.style.color = '#666';
    closeButton.style.transform = 'scale(1)';
  });
  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    removeFloatingPet();
    // Store dismissal preference
    chrome.storage.local.set({ floatingPetDismissed: true });
  });
  
  floatingPetContainer.appendChild(closeButton);
  
  // Click to open extension popup (only if not clicking close button)
  floatingPetContainer.addEventListener('click', (e) => {
    if (e.target !== closeButton && !closeButton.contains(e.target as Node)) {
      chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
    }
  });
  
  try {
    document.body.appendChild(floatingPetContainer);
    console.log('[Floating Pet] Pet element added to DOM');
    addDoodleElements(doodleContainer);
  } catch (error) {
    console.error('[Floating Pet] Error appending to DOM:', error);
    // Try again after a delay
    setTimeout(() => {
      if (floatingPetContainer && document.body) {
        document.body.appendChild(floatingPetContainer);
        addDoodleElements(doodleContainer);
      }
    }, 500);
  }
}

function updatePetEmotion(emotion: PetEmotion) {
  if (!floatingPetContainer) return;
  
  const petImage = floatingPetContainer.querySelector('img') as HTMLImageElement;
  if (petImage) {
    if (petImageUrl) {
      petImage.src = petImageUrl;
    } else {
      petImage.src = generateDefaultPetSVG();
    }
  }
  
  // Animate based on emotion
  const animations: Record<PetEmotion, string> = {
    CALM: 'bounce 2s ease-in-out infinite',
    CONTENT: 'bounce 1.5s ease-in-out infinite',
    SLEEPY: 'none',
    ALERT: 'pulse 1s ease-in-out infinite',
    CONFUSED: 'wiggle 0.5s ease-in-out infinite',
    OVERWHELMED: 'shake 0.3s ease-in-out infinite',
    CELEBRATING: 'bounce 0.8s ease-in-out infinite'
  };
  
  if (petImage) {
    petImage.style.animation = animations[emotion] || 'none';
  }
}

function updatePetPosition(metrics: TabHealthMetrics) {
  if (!floatingPetContainer) return;
  
  // Subtle position changes based on clutter
  const positions: Record<string, { bottom: string; right: string }> = {
    low: { bottom: '20px', right: '20px' },
    medium: { bottom: '25px', right: '25px' },
    high: { bottom: '30px', right: '30px' },
    extreme: { bottom: '35px', right: '35px' }
  };
  
  const pos = positions[metrics.clutterLevel] || positions.medium;
  floatingPetContainer.style.bottom = pos.bottom;
  floatingPetContainer.style.right = pos.right;
}

function showStatusIndicator(metrics: TabHealthMetrics) {
  const statusBubble = document.getElementById('pet-status-bubble');
  if (!statusBubble) return;
  
  const colors: Record<PetEmotion, string> = {
    CALM: '#A8D5BA',
    CONTENT: '#B8D4E8',
    SLEEPY: '#D4B8E8',
    ALERT: '#F4D03F',
    CONFUSED: '#C8A8D4',
    OVERWHELMED: '#E8A8A8',
    CELEBRATING: '#F4D03F'
  };
  
  statusBubble.style.background = colors[currentEmotion] || '#B8D4E8';
  
  // Show tab count in bubble if overwhelmed
  if (metrics.clutterLevel === 'high' || metrics.clutterLevel === 'extreme') {
    statusBubble.textContent = metrics.totalTabs > 99 ? '99+' : metrics.totalTabs.toString();
    statusBubble.style.width = 'auto';
    statusBubble.style.padding = '0 6px';
    statusBubble.style.minWidth = '20px';
  } else {
    statusBubble.textContent = '';
    statusBubble.style.width = '20px';
    statusBubble.style.padding = '0';
  }
}

function addDoodleElements(container: HTMLDivElement) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '120');
  svg.setAttribute('height', '120');
  svg.style.cssText = 'position: absolute; top: 0; left: 0;';
  
  // Add cute doodle elements
  const doodles = [
    { type: 'circle', cx: 10, cy: 15, r: 2, fill: '#E8D5C4', opacity: 0.6 },
    { type: 'circle', cx: 110, cy: 20, r: 1.5, fill: '#D4A5B8', opacity: 0.5 },
    { type: 'path', d: 'M 15 100 Q 20 95 25 100', stroke: '#C8B8D4', 'stroke-width': 1.5, fill: 'none', opacity: 0.4 },
    { type: 'path', d: 'M 95 105 Q 100 100 105 105', stroke: '#E8D5C4', 'stroke-width': 1, fill: 'none', opacity: 0.3 }
  ];
  
  doodles.forEach(doodle => {
    const element = document.createElementNS('http://www.w3.org/2000/svg', doodle.type);
    Object.entries(doodle).forEach(([key, value]) => {
      if (key !== 'type') {
        element.setAttribute(key, value.toString());
      }
    });
    svg.appendChild(element);
  });
  
  container.appendChild(svg);
}

function showPetTooltip() {
  const tooltip = document.createElement('div');
  tooltip.id = 'pet-tooltip';
  tooltip.style.cssText = `
    position: absolute;
    bottom: 90px;
    right: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    color: #4A5568;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
  `;
  tooltip.textContent = getEmotionMessage(currentEmotion);
  
  if (floatingPetContainer) {
    floatingPetContainer.appendChild(tooltip);
    setTimeout(() => {
      tooltip.style.opacity = '1';
    }, 10);
  }
}

function hidePetTooltip() {
  const tooltip = document.getElementById('pet-tooltip');
  if (tooltip) {
    tooltip.remove();
  }
}

function getEmotionMessage(emotion: PetEmotion): string {
  const messages: Record<PetEmotion, string> = {
    CALM: 'All calm here',
    CONTENT: 'Looking good',
    SLEEPY: 'Feeling sleepy',
    ALERT: 'Needs attention',
    CONFUSED: 'A bit confused',
    OVERWHELMED: 'Too many tabs!',
    CELEBRATING: 'So clean!'
  };
  return messages[emotion] || 'Hello';
}

// Add CSS animations
if (!document.getElementById('pet-animations')) {
  const style = document.createElement('style');
  style.id = 'pet-animations';
  style.textContent = `
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    @keyframes wiggle {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-3deg); }
      75% { transform: rotate(3deg); }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-2px); }
      75% { transform: translateX(2px); }
    }
  `;
  document.head.appendChild(style);
}

export function removeFloatingPet() {
  if (floatingPetContainer) {
    floatingPetContainer.remove();
    floatingPetContainer = null;
  }
}

function generateDefaultPetSVG(): string {
  const svg = `
    <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="defaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#D4A5B8;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#C8B8D4;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="35" fill="url(#defaultGrad)"/>
      <circle cx="30" cy="35" r="4" fill="#4A5568"/>
      <circle cx="50" cy="35" r="4" fill="#4A5568"/>
      <path d="M 28 48 Q 40 53 52 48" stroke="#4A5568" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="30" cy="42" rx="4" ry="3" fill="#E8D5C4" opacity="0.4"/>
      <ellipse cx="50" cy="42" rx="4" ry="3" fill="#E8D5C4" opacity="0.4"/>
    </svg>
  `.trim();
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

