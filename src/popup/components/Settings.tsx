import React, { useState } from 'react';
import { PetConfig, NotificationPreferences } from '../../types';
import { savePreferences, savePetConfig } from '../../utils/storage';

interface SettingsProps {
  pet: PetConfig;
  preferences: NotificationPreferences;
  onPreferencesChange: (prefs: NotificationPreferences) => Promise<void>;
  onPetChange: () => void;
}

export function Settings({ pet, preferences, onPreferencesChange, onPetChange }: SettingsProps) {
  const [localPrefs, setLocalPrefs] = useState(preferences);

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

  return (
    <div className="settings">
      <div className="settings-section">
        <h2>Pet Info</h2>
        <div className="pet-info-card">
          <div className="pet-info-row"><span className="label">Name:</span><span className="value">{pet.name}</span></div>
          <div className="pet-info-row"><span className="label">Type:</span><span className="value">{pet.type === 'custom' ? 'Custom' : 'Template'}</span></div>
          {pet.description && <div className="pet-info-row"><span className="label">Description:</span><span className="value">{pet.description}</span></div>}
        </div>
        <button className="change-pet-button" onClick={onPetChange}>Change Pet</button>
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
            <span>Show cute nudges</span>
            <p className="setting-description">Receive gentle reminders from your pet</p>
          </label>
          <label className="switch-label">
            <input type="checkbox" checked={localPrefs.showDailyDigest} onChange={(e) => handlePreferenceChange('showDailyDigest', e.target.checked)} />
            <span>Show daily tab health digest</span>
            <p className="setting-description">Get a daily summary of your tab cleanup</p>
          </label>
          <label className="switch-label">
            <input type="checkbox" checked={localPrefs.showEmotionalHalo} onChange={(e) => handlePreferenceChange('showEmotionalHalo', e.target.checked)} />
            <span>Show emotional icon halo</span>
            <p className="setting-description">See your pet's mood through the icon badge</p>
          </label>
        </div>
      </div>
    </div>
  );
}

