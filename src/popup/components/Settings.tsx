import React, { useState } from 'react';
import { PetConfig, NotificationPreferences } from '../../types';
import { savePreferences, savePetConfig } from '../../utils/storage';
import { generateCustomPet, generateTemplatePet } from '../../utils/aiGeneration';
import { PET_TEMPLATES } from '../../utils/petTemplates';

interface SettingsProps {
  pet: PetConfig;
  preferences: NotificationPreferences;
  onPreferencesChange: (prefs: NotificationPreferences) => Promise<void>;
  onPetChange: () => void;
}

export function Settings({ pet, preferences, onPreferencesChange, onPetChange }: SettingsProps) {
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [floatingPetDismissed, setFloatingPetDismissed] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  
  // Check if floating pet is dismissed
  React.useEffect(() => {
    chrome.storage.local.get(['floatingPetDismissed'], (result) => {
      setFloatingPetDismissed(!!result.floatingPetDismissed);
    });
  }, []);

  async function handlePreferenceChange(key: keyof NotificationPreferences, value: boolean) {
    const newPrefs = { ...localPrefs, [key]: value };
    setLocalPrefs(newPrefs);
    await onPreferencesChange(newPrefs);
  }

  async function handlePersonalityChange(personality: 'calm' | 'normal' | 'chatty') {
    const updatedPet = { ...pet, personality };
    await savePetConfig(updatedPet);
    window.location.reload();
  }

  async function handleRegenerateIcons() {
    if (!confirm('This will regenerate your pet\'s icons using AI. This may take a minute. Continue?')) {
      return;
    }
    
    setRegenerating(true);
    try {
      console.log('Regenerating icons for pet:', pet.name);
      let iconFrames;
      
      if (pet.type === 'custom') {
        // For custom pets, we need to reconstruct the original description
        // Since we don't store the original inputs, we'll use the description
        const description = pet.description || pet.name;
        iconFrames = await generateCustomPet(
          description,
          '', // vibe - not stored, use empty
          pet.colors ? `${pet.colors.primary} ${pet.colors.secondary}` : '', // colors
          pet.name
        );
      } else {
        // For template pets, find the template and regenerate
        const template = PET_TEMPLATES.find(t => t.name === pet.name || t.id === pet.id);
        if (template) {
          iconFrames = await generateTemplatePet(template);
        } else {
          throw new Error('Template not found');
        }
      }
      
      if (!iconFrames || Object.keys(iconFrames).length === 0) {
        throw new Error('Failed to generate icons');
      }
      
      const updatedPet = { ...pet, iconFrames };
      await savePetConfig(updatedPet);
      
      alert('Icons regenerated successfully! The page will reload.');
      window.location.reload();
    } catch (error) {
      console.error('Error regenerating icons:', error);
      alert('Failed to regenerate icons. Please try again.');
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="settings">
      <div className="settings-section">
        <h2>Pet Info</h2>
        <div className="pet-info-card">
          <div className="pet-info-row"><span className="label">Name:</span><span className="value">{pet.name}</span></div>
          <div className="pet-info-row"><span className="label">Type:</span><span className="value">{pet.type === 'custom' ? 'Custom' : 'Template'}</span></div>
          {pet.description && <div className="pet-info-row"><span className="label">Description:</span><span className="value">{pet.description}</span></div>}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
          <button 
            className="change-pet-button" 
            onClick={handleRegenerateIcons}
            disabled={regenerating}
            style={{ marginBottom: '8px' }}
          >
            {regenerating ? 'Regenerating Icons...' : 'Regenerate Icons with AI'}
          </button>
          <button className="change-pet-button" onClick={onPetChange}>Change Pet</button>
        </div>
      </div>
      <div className="settings-section">
        <h2>Personality</h2>
        <div className="personality-selector">
          <button className={`personality-option ${pet.personality === 'calm' ? 'active' : ''}`} onClick={() => handlePersonalityChange('calm')}>
            <div className="personality-icon"></div><h3>Calm</h3><p>Minimal messages</p>
          </button>
          <button className={`personality-option ${pet.personality === 'normal' ? 'active' : ''}`} onClick={() => handlePersonalityChange('normal')}>
            <div className="personality-icon"></div><h3>Normal</h3><p>Balanced communication</p>
          </button>
          <button className={`personality-option ${pet.personality === 'chatty' ? 'active' : ''}`} onClick={() => handlePersonalityChange('chatty')}>
            <div className="personality-icon"></div><h3>Chatty</h3><p>Lots of messages</p>
          </button>
        </div>
      </div>
      <div className="settings-section">
        <h2>Notifications</h2>
        <div className="notification-settings">
          <label className="switch-label">
            <input type="checkbox" checked={localPrefs.showNudges} onChange={(e) => handlePreferenceChange('showNudges', e.target.checked)} />
            <div className="label-content">
              <span>Show cute nudges</span>
              <p className="setting-description">Receive gentle reminders from your pet</p>
            </div>
          </label>
          <label className="switch-label">
            <input type="checkbox" checked={localPrefs.showDailyDigest} onChange={(e) => handlePreferenceChange('showDailyDigest', e.target.checked)} />
            <div className="label-content">
              <span>Show daily tab health digest</span>
              <p className="setting-description">Get a daily summary of your tab cleanup</p>
            </div>
          </label>
          <label className="switch-label">
            <input type="checkbox" checked={localPrefs.showEmotionalHalo} onChange={(e) => handlePreferenceChange('showEmotionalHalo', e.target.checked)} />
            <div className="label-content">
              <span>Show emotional icon halo</span>
              <p className="setting-description">See your pet's mood through the icon badge</p>
            </div>
          </label>
          <label className="switch-label">
            <input 
              type="checkbox" 
              checked={!floatingPetDismissed} 
              onChange={async (e) => {
                const show = e.target.checked;
                setFloatingPetDismissed(!show);
                await chrome.storage.local.set({ floatingPetDismissed: !show });
                // Notify content scripts to show/hide pet
                const tabs = await chrome.tabs.query({});
                tabs.forEach(tab => {
                  if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
                    chrome.tabs.sendMessage(tab.id, {
                      type: show ? 'SHOW_FLOATING_PET' : 'HIDE_FLOATING_PET'
                    }).catch(() => {});
                  }
                });
              }} 
            />
            <div className="label-content">
              <span>Show floating pet on web pages</span>
              <p className="setting-description">Display your pet <span className="cursive">companion</span> in the bottom-right corner</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

