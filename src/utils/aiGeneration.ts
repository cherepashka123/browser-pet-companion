import { PetEmotion, PetConfig } from '../types';
import { PetTemplate } from '../types';

// Free AI Image Generation Services (No API Key Required)
const FREE_AI_SERVICES = [
  {
    name: 'Pollinations',
    url: 'https://image.pollinations.ai/prompt/',
    type: 'direct'
  },
  {
    name: 'Prodia',
    url: 'https://api.prodia.com/generate',
    type: 'api'
  },
  {
    name: 'Dezgo',
    url: 'https://api.dezgo.com/text2image',
    type: 'api'
  }
];

const EMOTION_PROMPTS: Record<PetEmotion, string> = {
  CALM: 'calm, peaceful, relaxed expression, soft smile, gentle',
  CONTENT: 'happy, content, satisfied expression, gentle eyes, cheerful',
  SLEEPY: 'sleepy, tired, yawning expression, droopy eyes, resting',
  ALERT: 'alert, attentive, wide-eyed expression, curious, focused',
  CONFUSED: 'confused, puzzled, questioning expression, tilted head, wondering',
  OVERWHELMED: 'overwhelmed, stressed, worried expression, anxious, flustered',
  CELEBRATING: 'celebrating, excited, joyful expression, happy, elated'
};

/**
 * Generate pet icons using AI (free Hugging Face API) with SVG fallback
 */
export async function generatePetIcons(
  basePrompt: string,
  name: string,
  colors?: { primary: string; secondary: string }
): Promise<Record<PetEmotion, string>> {
  const emotions: PetEmotion[] = ['CALM', 'CONTENT', 'SLEEPY', 'ALERT', 'CONFUSED', 'OVERWHELMED', 'CELEBRATING'];
  const icons: Partial<Record<PetEmotion, string>> = {};
  
  console.log(`Generating pet icons for: ${basePrompt}`);
  
  // For custom pets, prioritize AI generation - try harder before falling back to SVG
  const isCustomPet = basePrompt.toLowerCase().includes('cute minimalist') || 
                      !basePrompt.toLowerCase().match(/\b(cat|dog|bird|bunny|rabbit|robot|cyber|frog)\b/);
  
  // Try AI generation first, then fallback to SVG
  for (const emotion of emotions) {
    try {
      const emotionPrompt = EMOTION_PROMPTS[emotion];
      // Improved prompt for better AI results
      const fullPrompt = `${basePrompt}, ${emotionPrompt}, cute kawaii chibi character icon, 128x128 pixels, simple clean white background, centered, high quality, detailed`;
      
      // Try AI generation but expect it to fail (HF API unreliable)
      let imageData: string | null = null;
      const maxAttempts = 1; // Reduced attempts since HF API is unreliable
      
      for (let attempt = 0; attempt < maxAttempts && !imageData; attempt++) {
        try {
          console.log(`[AI] Attempt ${attempt + 1}/${maxAttempts} for ${emotion}...`);
          imageData = await Promise.race([
            generateImageWithAI(fullPrompt),
            new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 10000)) // 10s timeout (faster fallback)
          ]);
          
          if (imageData) {
            console.log(`[AI] Successfully generated ${emotion} icon on attempt ${attempt + 1}!`);
            break;
          } else if (attempt < maxAttempts - 1) {
            console.log(`[AI] Attempt ${attempt + 1} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
          }
        } catch (error) {
          console.log(`[AI] Attempt ${attempt + 1} error for ${emotion}:`, error);
          if (attempt < maxAttempts - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      // If AI generation failed or timed out, use personalized SVG
      if (!imageData) {
        console.log(`[AI] All attempts failed for ${emotion}, using personalized SVG fallback`);
        imageData = generatePersonalizedSVGIcon(emotion, colors, basePrompt, name);
      }
      
      icons[emotion] = imageData;
      
      // Small delay between generations to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to generate ${emotion} icon:`, error);
      icons[emotion] = generatePersonalizedSVGIcon(emotion, colors, basePrompt, name);
    }
  }
  
  // Verify all icons were generated
  const allGenerated = emotions.every(emotion => icons[emotion] && icons[emotion]!.length > 0);
  if (!allGenerated) {
    console.error('Some icons failed to generate, using defaults');
    emotions.forEach(emotion => {
      if (!icons[emotion] || icons[emotion]!.length === 0) {
        icons[emotion] = generatePersonalizedSVGIcon(emotion, colors, basePrompt, name || 'Pet');
      }
    });
  }
  
  console.log(`Successfully generated ${Object.keys(icons).length} pet icons`);
  return icons as Record<PetEmotion, string>;
}

/**
 * Generate image using multiple reliable AI services
 */
async function generateImageWithAI(prompt: string): Promise<string | null> {
  // Try multiple free AI services in order of reliability
  
  // 1. Pollinations AI (most reliable, no API key)
  try {
    const pollinationsResult = await generateWithPollinations(prompt);
    if (pollinationsResult) {
      console.log('[AI] Pollinations AI successful!');
      return pollinationsResult;
    }
  } catch (error) {
    console.log('[AI] Pollinations failed:', error);
  }

  // 2. Try Prodia API (free, reliable)
  try {
    const prodiaResult = await generateWithProdia(prompt);
    if (prodiaResult) {
      console.log('[AI] Prodia AI successful!');
      return prodiaResult;
    }
  } catch (error) {
    console.log('[AI] Prodia failed:', error);
  }

  // 3. Try Dezgo API (free alternative)
  try {
    const dezgoResult = await generateWithDezgo(prompt);
    if (dezgoResult) {
      console.log('[AI] Dezgo AI successful!');
      return dezgoResult;
    }
  } catch (error) {
    console.log('[AI] Dezgo failed:', error);
  }

  // No more Hugging Face - it's too unreliable
  console.log('[AI] All AI services failed, using SVG fallback');
  return null;
}

/**
 * Generate image using Pollinations AI (free, no API key, most reliable)
 */
async function generateWithPollinations(prompt: string): Promise<string | null> {
  try {
    // Clean and optimize prompt for better results
    const cleanPrompt = prompt
      .replace(/[^\w\s,.-]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    const encodedPrompt = encodeURIComponent(cleanPrompt);
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=128&height=128&seed=${seed}&model=flux&enhance=true`;
    
    console.log(`[AI] Trying Pollinations with prompt: ${cleanPrompt}`);
    
    // Test if image loads and is valid
    const response = await fetch(imageUrl, { method: 'HEAD' });
    if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
      // Convert URL to base64 for consistent storage
      const imageResponse = await fetch(imageUrl);
      const blob = await imageResponse.blob();
      return await blobToDataUrl(blob);
    }
  } catch (error) {
    console.warn('[AI] Pollinations error:', error);
  }
  return null;
}

/**
 * Generate image using Prodia API (free, reliable)
 */
async function generateWithProdia(prompt: string): Promise<string | null> {
  try {
    const cleanPrompt = prompt.replace(/[^\w\s,.-]/g, '').trim();
    
    // Prodia free endpoint (no API key required)
    const response = await fetch('https://api.prodia.com/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: cleanPrompt,
        model: 'dreamshaper_6BakedVae.safetensors [114c8abb]',
        steps: 20,
        cfg_scale: 7,
        width: 128,
        height: 128,
        negative_prompt: 'blurry, bad quality, distorted, ugly'
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.job) {
        // Poll for completion
        let attempts = 0;
        while (attempts < 30) { // Max 30 seconds
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const statusResponse = await fetch(`https://api.prodia.com/job/${data.job}`);
          const statusData = await statusResponse.json();
          
          if (statusData.status === 'succeeded' && statusData.imageUrl) {
            // Convert to base64
            const imageResponse = await fetch(statusData.imageUrl);
            const blob = await imageResponse.blob();
            return await blobToDataUrl(blob);
          } else if (statusData.status === 'failed') {
            break;
          }
          attempts++;
        }
      }
    }
  } catch (error) {
    console.warn('[AI] Prodia error:', error);
  }
  return null;
}

/**
 * Generate image using Dezgo API (free alternative)
 */
async function generateWithDezgo(prompt: string): Promise<string | null> {
  try {
    const cleanPrompt = prompt.replace(/[^\w\s,.-]/g, '').trim();
    
    const response = await fetch('https://api.dezgo.com/text2image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: cleanPrompt,
        model: 'epic_realism',
        width: 128,
        height: 128,
        steps: 20,
        guidance: 7.5,
        negative_prompt: 'blurry, low quality, distorted'
      })
    });

    if (response.ok) {
      const blob = await response.blob();
      if (blob.type.startsWith('image/')) {
        return await blobToDataUrl(blob);
      }
    }
  } catch (error) {
    console.warn('[AI] Dezgo error:', error);
  }
  return null;
}

/**
 * Generate personalized SVG icon based on user's prompt
 */
function generatePersonalizedSVGIcon(
  emotion: PetEmotion,
  colors: { primary: string; secondary: string } | undefined,
  basePrompt: string,
  name: string
): string {
  const primary = colors?.primary || '#D4A5B8';
  const secondary = colors?.secondary || '#C8B8D4';
  const accent = colors?.secondary || '#E8D5C4';
  
  // Extract character type from prompt (e.g., "cat", "dog", "robot")
  const promptLower = basePrompt.toLowerCase();
  let characterType = 'round';
  let characterShape = '';
  
  if (promptLower.includes('cat') || promptLower.includes('feline')) {
    characterType = 'cat';
    characterShape = `<ellipse cx="64" cy="70" rx="40" ry="45" fill="url(#petGrad${emotion})"/><path d="M 50 30 Q 64 20 78 30 L 75 35 Q 64 28 53 35 Z" fill="url(#petGrad${emotion})"/><path d="M 90 30 Q 78 20 64 25 L 64 35 Q 75 28 90 35 Z" fill="url(#petGrad${emotion})"/>`;
  } else if (promptLower.includes('dog') || promptLower.includes('puppy')) {
    characterType = 'dog';
    characterShape = `<ellipse cx="64" cy="70" rx="42" ry="45" fill="url(#petGrad${emotion})"/><ellipse cx="50" cy="30" rx="8" ry="12" fill="url(#petGrad${emotion})"/><ellipse cx="78" cy="30" rx="8" ry="12" fill="url(#petGrad${emotion})"/>`;
  } else if (promptLower.includes('bird') || promptLower.includes('chicken')) {
    characterType = 'bird';
    characterShape = `<ellipse cx="64" cy="70" rx="35" ry="40" fill="url(#petGrad${emotion})"/><ellipse cx="64" cy="35" rx="25" ry="30" fill="url(#petGrad${emotion})"/>`;
  } else if (promptLower.includes('bunny') || promptLower.includes('rabbit')) {
    characterType = 'bunny';
    characterShape = `<ellipse cx="64" cy="75" rx="35" ry="40" fill="url(#petGrad${emotion})"/><ellipse cx="50" cy="25" rx="6" ry="18" fill="url(#petGrad${emotion})"/><ellipse cx="78" cy="25" rx="6" ry="18" fill="url(#petGrad${emotion})"/>`;
  } else if (promptLower.includes('robot') || promptLower.includes('cyber')) {
    characterType = 'robot';
    characterShape = `<rect x="30" y="40" width="68" height="68" rx="8" fill="url(#petGrad${emotion})"/><rect x="40" y="50" width="48" height="48" rx="4" fill="${accent}" opacity="0.3"/>`;
  } else if (promptLower.includes('frog')) {
    characterType = 'frog';
    // Frog body shape - wider at bottom
    const isAstronaut = promptLower.includes('astronaut') || promptLower.includes('space');
    if (isAstronaut) {
      // Frog astronaut with helmet
      characterShape = `
        <ellipse cx="64" cy="75" rx="38" ry="42" fill="url(#petGrad${emotion})"/>
        <ellipse cx="64" cy="68" rx="35" ry="38" fill="url(#petGrad${emotion})"/>
        <!-- Astronaut helmet -->
        <circle cx="64" cy="50" r="32" fill="none" stroke="${accent}" stroke-width="3" opacity="0.6"/>
        <ellipse cx="64" cy="45" rx="28" ry="30" fill="${accent}" opacity="0.2"/>
        <!-- Helmet visor reflection -->
        <ellipse cx="64" cy="48" rx="20" ry="22" fill="none" stroke="${primary}" stroke-width="1.5" opacity="0.4"/>
      `;
    } else {
      // Regular frog shape
      characterShape = `
        <ellipse cx="64" cy="75" rx="38" ry="42" fill="url(#petGrad${emotion})"/>
        <ellipse cx="64" cy="68" rx="35" ry="38" fill="url(#petGrad${emotion})"/>
        <!-- Frog eyes bulge -->
        <ellipse cx="50" cy="50" rx="8" ry="10" fill="url(#petGrad${emotion})"/>
        <ellipse cx="78" cy="50" rx="8" ry="10" fill="url(#petGrad${emotion})"/>
      `;
    }
  } else if (promptLower.includes('octopus')) {
    characterType = 'octopus';
    // Octopus with tentacles
    characterShape = `
      <circle cx="64" cy="60" r="35" fill="url(#petGrad${emotion})"/>
      <!-- Tentacles -->
      <ellipse cx="40" cy="85" rx="8" ry="20" fill="url(#petGrad${emotion})"/>
      <ellipse cx="55" cy="90" rx="8" ry="18" fill="url(#petGrad${emotion})"/>
      <ellipse cx="73" cy="90" rx="8" ry="18" fill="url(#petGrad${emotion})"/>
      <ellipse cx="88" cy="85" rx="8" ry="20" fill="url(#petGrad${emotion})"/>
    `;
  } else if (promptLower.includes('dragon')) {
    characterType = 'dragon';
    characterShape = `
      <ellipse cx="64" cy="70" rx="40" ry="45" fill="url(#petGrad${emotion})"/>
      <!-- Dragon horns -->
      <ellipse cx="50" cy="30" rx="6" ry="15" fill="url(#petGrad${emotion})" transform="rotate(-20 50 30)"/>
      <ellipse cx="78" cy="30" rx="6" ry="15" fill="url(#petGrad${emotion})" transform="rotate(20 78 30)"/>
      <!-- Wings -->
      <ellipse cx="35" cy="55" rx="15" ry="25" fill="${accent}" opacity="0.6" transform="rotate(-30 35 55)"/>
      <ellipse cx="93" cy="55" rx="15" ry="25" fill="${accent}" opacity="0.6" transform="rotate(30 93 55)"/>
    `;
  } else if (promptLower.includes('unicorn')) {
    characterType = 'unicorn';
    characterShape = `
      <ellipse cx="64" cy="70" rx="40" ry="45" fill="url(#petGrad${emotion})"/>
      <!-- Unicorn horn -->
      <ellipse cx="64" cy="25" rx="4" ry="20" fill="${accent}"/>
      <!-- Mane -->
      <ellipse cx="45" cy="35" rx="12" ry="20" fill="${secondary}" opacity="0.7"/>
      <ellipse cx="83" cy="35" rx="12" ry="20" fill="${secondary}" opacity="0.7"/>
    `;
  } else if (promptLower.includes('bear')) {
    characterType = 'bear';
    characterShape = `
      <circle cx="64" cy="70" r="40" fill="url(#petGrad${emotion})"/>
      <!-- Bear ears -->
      <circle cx="45" cy="35" r="12" fill="url(#petGrad${emotion})"/>
      <circle cx="83" cy="35" r="12" fill="url(#petGrad${emotion})"/>
      <circle cx="45" cy="35" r="6" fill="${accent}"/>
      <circle cx="83" cy="35" r="6" fill="${accent}"/>
    `;
  } else {
    // Enhanced default with smart decorative elements
    let decorativeElements = '';
    let mainShape = `<circle cx="64" cy="64" r="48" fill="url(#petGrad${emotion})" stroke="${accent}" stroke-width="2" opacity="0.9"/>`;
    
    // Add theme-based decorations
    if (promptLower.includes('astronaut') || promptLower.includes('space')) {
      decorativeElements = `
        <circle cx="64" cy="50" r="30" fill="none" stroke="${accent}" stroke-width="2" opacity="0.5" stroke-dasharray="4,4"/>
        <circle cx="50" cy="40" r="2" fill="${accent}" opacity="0.8"/>
        <circle cx="78" cy="45" r="1.5" fill="${accent}" opacity="0.6"/>
      `;
    } else if (promptLower.includes('cyber') || promptLower.includes('tech')) {
      decorativeElements = `
        <rect x="45" y="45" width="38" height="38" rx="4" fill="none" stroke="${accent}" stroke-width="2" opacity="0.4"/>
        <circle cx="55" cy="55" r="3" fill="${accent}" opacity="0.6"/>
        <circle cx="73" cy="73" r="2" fill="${accent}" opacity="0.5"/>
      `;
    } else if (promptLower.includes('magic') || promptLower.includes('wizard')) {
      decorativeElements = `
        <path d="M 64 20 L 68 35 L 60 35 Z" fill="${accent}" opacity="0.7"/>
        <circle cx="40" cy="50" r="2" fill="${accent}" opacity="0.8"/>
        <circle cx="88" cy="60" r="1.5" fill="${accent}" opacity="0.6"/>
        <path d="M 35 85 L 40 90 L 30 90 Z" fill="${accent}" opacity="0.5"/>
      `;
    } else if (promptLower.includes('pirate')) {
      decorativeElements = `
        <ellipse cx="64" cy="30" rx="25" ry="8" fill="${accent}" opacity="0.6"/>
        <circle cx="75" cy="55" r="3" fill="none" stroke="${accent}" stroke-width="2"/>
      `;
    }
    
    characterShape = mainShape + decorativeElements;
  }
  
  // Emotion-based expressions
  const expressions: Record<PetEmotion, { eyes: string; mouth: string; doodles: string }> = {
    CALM: {
      eyes: '<circle cx="50" cy="55" r="4" fill="#4A5568"/><circle cx="78" cy="55" r="4" fill="#4A5568"/>',
      mouth: '<path d="M 52 72 Q 64 77 76 72" stroke="#4A5568" stroke-width="2" fill="none" stroke-linecap="round"/>',
      doodles: '<circle cx="20" cy="20" r="2" fill="' + accent + '" opacity="0.6"/><path d="M 100 30 Q 105 25 110 30" stroke="' + accent + '" stroke-width="1.5" fill="none" opacity="0.5"/>'
    },
    CONTENT: {
      eyes: '<circle cx="50" cy="55" r="4.5" fill="#4A5568"/><circle cx="78" cy="55" r="4.5" fill="#4A5568"/><circle cx="51" cy="54" r="1.5" fill="#fff"/>',
      mouth: '<path d="M 52 74 Q 64 82 76 74" stroke="#4A5568" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
      doodles: '<circle cx="15" cy="25" r="2.5" fill="' + accent + '" opacity="0.7"/><path d="M 105 25 Q 110 20 115 25" stroke="' + accent + '" stroke-width="2" fill="none" opacity="0.6"/>'
    },
    SLEEPY: {
      eyes: '<path d="M 45 55 Q 50 50 55 55" stroke="#4A5568" stroke-width="3" fill="none"/><path d="M 73 55 Q 78 50 83 55" stroke="#4A5568" stroke-width="3" fill="none"/>',
      mouth: '<path d="M 52 72 Q 64 74 76 72" stroke="#4A5568" stroke-width="2" fill="none"/>',
      doodles: '<circle cx="18" cy="18" r="1.5" fill="' + accent + '" opacity="0.5"/><path d="M 108 28 Q 112 25 116 28" stroke="' + accent + '" stroke-width="1" fill="none" opacity="0.4"/>'
    },
    ALERT: {
      eyes: '<ellipse cx="50" cy="55" rx="5" ry="6" fill="#4A5568"/><ellipse cx="78" cy="55" rx="5" ry="6" fill="#4A5568"/><circle cx="50" cy="55" r="2" fill="#fff"/>',
      mouth: '<ellipse cx="64" cy="75" rx="8" ry="4" fill="#4A5568"/>',
      doodles: '<circle cx="12" cy="22" r="2" fill="' + accent + '" opacity="0.8"/><path d="M 102 22 Q 107 18 112 22" stroke="' + accent + '" stroke-width="2" fill="none" opacity="0.7"/>'
    },
    CONFUSED: {
      eyes: '<circle cx="50" cy="55" r="4" fill="#4A5568"/><circle cx="78" cy="55" r="4" fill="#4A5568"/><circle cx="50" cy="57" r="1.5" fill="#fff"/>',
      mouth: '<path d="M 52 74 Q 64 70 76 74" stroke="#4A5568" stroke-width="2" fill="none" stroke-linecap="round"/>',
      doodles: '<circle cx="22" cy="20" r="1.5" fill="' + accent + '" opacity="0.6"/><path d="M 98 30 Q 103 27 108 30" stroke="' + accent + '" stroke-width="1.5" fill="none" opacity="0.5"/>'
    },
    OVERWHELMED: {
      eyes: '<ellipse cx="50" cy="57" rx="4" ry="5" fill="#4A5568"/><ellipse cx="78" cy="57" rx="4" ry="5" fill="#4A5568"/><path d="M 48 53 Q 50 51 52 53" stroke="#fff" stroke-width="1.5" fill="none"/>',
      mouth: '<path d="M 52 76 Q 64 72 76 76" stroke="#4A5568" stroke-width="2.5" fill="none"/>',
      doodles: '<circle cx="16" cy="18" r="2" fill="' + accent + '" opacity="0.7"/><path d="M 104 24 Q 109 20 114 24" stroke="' + accent + '" stroke-width="2" fill="none" opacity="0.6"/>'
    },
    CELEBRATING: {
      eyes: '<circle cx="50" cy="53" r="5" fill="#4A5568"/><circle cx="78" cy="53" r="5" fill="#4A5568"/><circle cx="51" cy="52" r="2" fill="#fff"/>',
      mouth: '<path d="M 50 72 Q 64 87 78 72" stroke="#4A5568" stroke-width="3" fill="none" stroke-linecap="round"/>',
      doodles: '<circle cx="14" cy="16" r="2.5" fill="' + accent + '" opacity="0.8"/><circle cx="110" cy="20" r="2" fill="' + accent + '" opacity="0.7"/><path d="M 100 15 Q 105 12 110 15" stroke="' + accent + '" stroke-width="2" fill="none" opacity="0.7"/>'
    }
  };
  
  const expr = expressions[emotion];
  
  // Add name initial or first letter as a cute detail
  const nameInitial = name ? name.charAt(0).toUpperCase() : '?';
  
  const svg = `
    <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="petGrad${emotion}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${secondary};stop-opacity:1" />
        </linearGradient>
      </defs>
      <!-- Cute doodle background elements -->
      ${expr.doodles}
      <!-- Main pet body (character-specific shape) -->
      ${characterShape}
      <!-- Face details -->
      ${expr.eyes}
      ${expr.mouth}
      <!-- Cute blush -->
      <ellipse cx="52" cy="65" rx="6" ry="4" fill="${accent}" opacity="0.4"/>
      <ellipse cx="76" cy="65" rx="6" ry="4" fill="${accent}" opacity="0.4"/>
      <!-- Name initial badge (subtle) -->
      <circle cx="100" cy="28" r="12" fill="${accent}" opacity="0.3"/>
      <text x="100" y="32" text-anchor="middle" font-size="10" font-weight="700" fill="${primary}" opacity="0.7">${nameInitial}</text>
      <!-- Additional doodle elements -->
      <circle cx="30" cy="95" r="1.5" fill="${accent}" opacity="0.5"/>
      <circle cx="98" cy="105" r="1" fill="${accent}" opacity="0.4"/>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function generateCustomPet(
  description: string,
  vibe: string,
  colors: string,
  name: string
): Promise<Record<PetEmotion, string>> {
  // Build a detailed, descriptive prompt from user input for better AI results
  // Include all user details to ensure AI captures the full description
  const colorDesc = colors ? `, ${colors} colors` : '';
  const vibeDesc = vibe ? `, ${vibe} personality` : '';
  const basePrompt = `cute kawaii chibi ${description}${vibeDesc}${colorDesc}, minimalist character icon, simple clean white background, centered, high quality`;
  console.log(`[AI] Generating custom pet with prompt: ${basePrompt}`);
  return generatePetIcons(basePrompt, name, parseColors(colors));
}

export async function generateTemplatePet(template: PetTemplate): Promise<Record<PetEmotion, string>> {
  console.log(`Generating template pet: ${template.name}`);
  return generatePetIcons(template.prompt, template.name, template.colors);
}

function parseColors(colorString: string): { primary: string; secondary: string } | undefined {
  const colors = colorString.match(/#[0-9A-Fa-f]{6}/g);
  if (colors && colors.length >= 2) {
    return { primary: colors[0], secondary: colors[1] };
  }
  return undefined;
}

