import React, { useState } from 'react';
import { PetConfig, PetTemplate } from '../../types';
import { PET_TEMPLATES } from '../../utils/petTemplates';
import { generateCustomPet, generateTemplatePet } from '../../utils/aiGeneration';
import { savePetConfig, savePreferences } from '../../utils/storage';

interface PetCreationProps {
  onPetCreated: (pet: PetConfig) => void;
}

type CreationMode = 'choice' | 'custom' | 'template';

export function PetCreation({ onPetCreated }: PetCreationProps) {
  const [mode, setMode] = useState<CreationMode>('choice');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'describe' | 'personality' | 'notifications'>('describe');
  const [customPet, setCustomPet] = useState({ type: '', description: '', vibe: '', colors: '', name: '' });
  const [selectedTemplate, setSelectedTemplate] = useState<PetTemplate | null>(null);
  const [personality, setPersonality] = useState<'calm' | 'normal' | 'chatty'>('normal');
  const [notifications, setNotifications] = useState({ showNudges: true, showDailyDigest: true, showEmotionalHalo: true });

  async function handleCreateCustomPet() {
    if (!customPet.name || !customPet.type || !customPet.description) {
      alert('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      // Show progress message
      console.log('Generating AI avatar for your pet...');
      
      // Generate icons - tries AI first, falls back to personalized SVG
      const iconFrames = await generateCustomPet(customPet.description, customPet.vibe, customPet.colors, customPet.name);
      
      // Verify icons were generated
      if (!iconFrames || Object.keys(iconFrames).length === 0) {
        throw new Error('Failed to generate pet icons');
      }
      
      console.log('Pet icons generated successfully!');
      
      const pet: PetConfig = {
        id: `pet_${Date.now()}`,
        name: customPet.name,
        type: 'custom',
        description: customPet.description,
        iconFrames,
        personality,
        colors: parseColors(customPet.colors),
        createdAt: Date.now()
      };
      await savePetConfig(pet);
      await savePreferences(notifications);
      
      // Notify background to update and show pet
      chrome.runtime.sendMessage({ type: 'UPDATE_ICON' });
      
      onPetCreated(pet);
    } catch (error) {
      console.error('Error creating pet:', error);
      alert('Failed to create pet. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTemplatePet(template: PetTemplate) {
    setLoading(true);
    try {
      console.log('Generating AI avatar for template pet...');
      
      // Generate icons - tries AI first, falls back to personalized SVG
      const iconFrames = await generateTemplatePet(template);
      
      // Verify icons were generated
      if (!iconFrames || Object.keys(iconFrames).length === 0) {
        throw new Error('Failed to generate pet icons');
      }
      
      console.log('Template pet icons generated successfully!');
      
      const pet: PetConfig = {
        id: `pet_${Date.now()}`,
        name: template.name,
        type: 'template',
        description: template.description,
        iconFrames,
        personality,
        colors: template.colors,
        createdAt: Date.now()
      };
      await savePetConfig(pet);
      await savePreferences(notifications);
      
      // Notify background to update and show pet
      chrome.runtime.sendMessage({ type: 'UPDATE_ICON' });
      
      onPetCreated(pet);
    } catch (error) {
      console.error('Error creating pet:', error);
      alert('Failed to create pet. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function parseColors(colorString: string): { primary: string; secondary: string } | undefined {
    const colors = colorString.match(/#[0-9A-Fa-f]{6}/g);
    if (colors && colors.length >= 2) {
      return { primary: colors[0], secondary: colors[1] };
    }
    return undefined;
  }

  if (mode === 'choice') {
    return (
      <div className="pet-creation">
        <div className="creation-header">
          <h1>Create Your Pet Companion</h1>
          <p>Choose how you'd like to create your pet</p>
        </div>
        <div className="creation-options">
          <button className="creation-option" onClick={() => setMode('custom')}>
            <div className="creation-option-icon"></div>
            <h3>Describe Your Own</h3>
            <p>Create a custom pet with AI</p>
          </button>
          <button className="creation-option" onClick={() => setMode('template')}>
            <div className="creation-option-icon"></div>
            <h3>Choose a Template</h3>
            <p>Pick from adorable templates</p>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'custom' && step === 'describe') {
    return (
      <div className="pet-creation">
        <div className="creation-header">
          <button className="back-button" onClick={() => setMode('choice')}>← Back</button>
          <h2>Describe Your Pet</h2>
        </div>
        <div className="creation-form">
          <label>What is your pet? *<input type="text" placeholder="e.g., a fluffy cat" value={customPet.type} onChange={(e) => setCustomPet({ ...customPet, type: e.target.value })} /></label>
          <label>Describe its vibe, personality, and accessories<textarea placeholder="e.g., loves coffee" value={customPet.description} onChange={(e) => setCustomPet({ ...customPet, description: e.target.value })} rows={3} /></label>
          <label>Favorite colors or aesthetic<input type="text" placeholder="e.g., pastel pink and gold" value={customPet.colors} onChange={(e) => setCustomPet({ ...customPet, colors: e.target.value })} /></label>
          <label>Name your pet *<input type="text" placeholder="e.g., Fluffy" value={customPet.name} onChange={(e) => setCustomPet({ ...customPet, name: e.target.value })} /></label>
          <button className="primary-button" onClick={() => setStep('personality')} disabled={!customPet.name || !customPet.type}>Next: Personality →</button>
        </div>
      </div>
    );
  }

  if (step === 'personality') {
    return (
      <div className="pet-creation">
        <div className="creation-header">
          <button className="back-button" onClick={() => mode === 'custom' ? setStep('describe') : setStep('describe')}>← Back</button>
          <h2>Personality</h2>
        </div>
        <div className="personality-selector">
          <p>How talkative should your pet be?</p>
          <div className="personality-options">
            <button className={`personality-option ${personality === 'calm' ? 'active' : ''}`} onClick={() => setPersonality('calm')}>
              <div className="personality-icon"></div><h3>Calm</h3><p>Minimal messages</p>
            </button>
            <button className={`personality-option ${personality === 'normal' ? 'active' : ''}`} onClick={() => setPersonality('normal')}>
              <div className="personality-icon"></div><h3>Normal</h3><p>Balanced communication</p>
            </button>
            <button className={`personality-option ${personality === 'chatty' ? 'active' : ''}`} onClick={() => setPersonality('chatty')}>
              <div className="personality-icon"></div><h3>Chatty</h3><p>Lots of messages</p>
            </button>
          </div>
          <button className="primary-button" onClick={() => setStep('notifications')}>Next: Notifications →</button>
        </div>
      </div>
    );
  }

  if (step === 'notifications') {
    return (
      <div className="pet-creation">
        <div className="creation-header">
          <button className="back-button" onClick={() => setStep('personality')}>← Back</button>
          <h2>Notification Preferences</h2>
        </div>
        <div className="notification-preferences">
          <label className="switch-label"><input type="checkbox" checked={notifications.showNudges} onChange={(e) => setNotifications({ ...notifications, showNudges: e.target.checked })} /><span>Show cute nudges</span></label>
          <label className="switch-label"><input type="checkbox" checked={notifications.showDailyDigest} onChange={(e) => setNotifications({ ...notifications, showDailyDigest: e.target.checked })} /><span>Show daily tab health digest</span></label>
          <label className="switch-label"><input type="checkbox" checked={notifications.showEmotionalHalo} onChange={(e) => setNotifications({ ...notifications, showEmotionalHalo: e.target.checked })} /><span>Show emotional icon halo</span></label>
          <button className="primary-button" onClick={() => mode === 'custom' ? handleCreateCustomPet() : selectedTemplate && handleCreateTemplatePet(selectedTemplate)} disabled={loading || (mode === 'template' && !selectedTemplate)}>{loading ? 'Creating your pet...' : 'Create Pet'}</button>
        </div>
      </div>
    );
  }

  if (mode === 'template' && step === 'describe') {
    return (
      <div className="pet-creation">
        <div className="creation-header">
          <button className="back-button" onClick={() => setMode('choice')}>← Back</button>
          <h2>Choose a Template</h2>
        </div>
        <div className="template-grid">
          {PET_TEMPLATES.map((template) => (
            <button key={template.id} className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`} onClick={() => setSelectedTemplate(template)}>
              <div className="template-preview" style={{ backgroundColor: template.colors.primary, borderColor: template.colors.secondary }}></div>
              <h3>{template.name}</h3>
              <p>{template.description}</p>
            </button>
          ))}
        </div>
        <button className="primary-button" onClick={() => setStep('personality')} disabled={!selectedTemplate}>Next: Personality →</button>
      </div>
    );
  }

  return null;
}
