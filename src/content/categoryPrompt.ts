// Pet-powered category prompt that appears in the browser
import { TabCategoryId, TabInfo } from '../types';
import { getNestById, generateCategoryPrompt } from '../utils/tabNests';

let promptContainer: HTMLDivElement | null = null;

interface CategoryPromptProps {
  tab: TabInfo;
  suggestedCategory: TabCategoryId;
  petName: string;
  onConfirm: (categoryId: TabCategoryId) => void;
  onDeny: () => void;
  onMute: () => void;
}

export function showCategoryPrompt(props: CategoryPromptProps): void {
  if (promptContainer) {
    promptContainer.remove();
  }
  
  if (!document.body) {
    setTimeout(() => showCategoryPrompt(props), 100);
    return;
  }
  
  const nest = getNestById(props.suggestedCategory);
  const message = generateCategoryPrompt(props.tab, props.suggestedCategory, props.petName);
  
  promptContainer = document.createElement('div');
  promptContainer.id = 'browser-pet-category-prompt';
  promptContainer.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 20px;
    z-index: 999998;
    max-width: 320px;
    pointer-events: auto;
    animation: slideUp 0.3s ease-out;
  `;
  
  const promptCard = document.createElement('div');
  promptCard.style.cssText = `
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border: 2px solid ${nest?.color || '#D4A5B8'}40;
  `;
  
  // Pet avatar (small)
  const petAvatar = document.createElement('div');
  petAvatar.style.cssText = `
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #D4A5B8 0%, #C8B8D4 100%);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  `;
  
  // Message
  const messageEl = document.createElement('div');
  messageEl.style.cssText = `
    font-size: 14px;
    color: #4A5568;
    margin-bottom: 16px;
    line-height: 1.5;
  `;
  messageEl.textContent = message;
  
  // Tab preview
  const tabPreview = document.createElement('div');
  tabPreview.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: rgba(212, 165, 184, 0.1);
    border-radius: 8px;
    margin-bottom: 16px;
  `;
  
  const favicon = document.createElement('img');
  favicon.src = props.tab.favicon || '';
  favicon.style.cssText = 'width: 16px; height: 16px; border-radius: 3px;';
  favicon.onerror = () => { favicon.style.display = 'none'; };
  
  const tabTitle = document.createElement('div');
  tabTitle.style.cssText = `
    font-size: 12px;
    color: #6B7280;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  `;
  tabTitle.textContent = props.tab.title || props.tab.domain;
  
  tabPreview.appendChild(favicon);
  tabPreview.appendChild(tabTitle);
  
  // Category badge
  const categoryBadge = document.createElement('div');
  categoryBadge.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: ${nest?.color || '#D4A5B8'}20;
    color: ${nest?.color || '#D4A5B8'};
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 16px;
  `;
  categoryBadge.textContent = nest?.name || props.suggestedCategory;
  
  // Buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  `;
  
  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Yes';
  confirmBtn.style.cssText = `
    flex: 1;
    padding: 10px 16px;
    background: linear-gradient(135deg, ${nest?.color || '#D4A5B8'} 0%, ${nest?.color || '#C8B8D4'} 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  `;
  confirmBtn.onmouseenter = () => { confirmBtn.style.transform = 'translateY(-1px)'; };
  confirmBtn.onmouseleave = () => { confirmBtn.style.transform = 'translateY(0)'; };
  confirmBtn.onclick = () => {
    props.onConfirm(props.suggestedCategory);
    hidePrompt();
  };
  
  const denyBtn = document.createElement('button');
  denyBtn.textContent = 'No';
  denyBtn.style.cssText = `
    flex: 1;
    padding: 10px 16px;
    background: rgba(107, 114, 128, 0.1);
    color: #6B7280;
    border: 1px solid rgba(107, 114, 128, 0.2);
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  `;
  denyBtn.onmouseenter = () => { denyBtn.style.background = 'rgba(107, 114, 128, 0.2)'; };
  denyBtn.onmouseleave = () => { denyBtn.style.background = 'rgba(107, 114, 128, 0.1)'; };
  denyBtn.onclick = () => {
    props.onDeny();
    hidePrompt();
  };
  
  const muteBtn = document.createElement('button');
  muteBtn.textContent = 'Don\'t ask';
  muteBtn.style.cssText = `
    width: 100%;
    padding: 8px;
    background: transparent;
    color: #9CA3AF;
    border: none;
    border-radius: 6px;
    font-size: 11px;
    cursor: pointer;
    margin-top: 4px;
    transition: color 0.2s;
  `;
  muteBtn.onmouseenter = () => { muteBtn.style.color = '#6B7280'; };
  muteBtn.onmouseleave = () => { muteBtn.style.color = '#9CA3AF'; };
  muteBtn.onclick = () => {
    props.onMute();
    hidePrompt();
  };
  
  buttonContainer.appendChild(confirmBtn);
  buttonContainer.appendChild(denyBtn);
  
  promptCard.appendChild(petAvatar);
  promptCard.appendChild(messageEl);
  promptCard.appendChild(tabPreview);
  promptCard.appendChild(categoryBadge);
  promptCard.appendChild(buttonContainer);
  promptCard.appendChild(muteBtn);
  promptContainer.appendChild(promptCard);
  
  document.body.appendChild(promptContainer);
  
  // Add animation
  if (!document.getElementById('category-prompt-styles')) {
    const style = document.createElement('style');
    style.id = 'category-prompt-styles';
    style.textContent = `
      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Auto-hide after 30 seconds
  setTimeout(() => {
    if (promptContainer) {
      hidePrompt();
    }
  }, 30000);
}

export function hidePrompt(): void {
  if (promptContainer) {
    promptContainer.style.animation = 'slideUp 0.3s ease-out reverse';
    setTimeout(() => {
      if (promptContainer) {
        promptContainer.remove();
        promptContainer = null;
      }
    }, 300);
  }
}

