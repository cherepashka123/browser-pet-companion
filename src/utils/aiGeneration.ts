import { PetEmotion, PetConfig } from '../types';
import { PetTemplate } from '../types';

// Hugging Face Inference API - Free tier, no API key required for some models
// Using models optimized for character/icon generation
const HF_MODELS = [
  'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
  'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
  'https://api-inference.huggingface.co/models/CompVis/stable-diffusion-v1-4',
  'https://api-inference.huggingface.co/models/prompthero/openjourney-v4',
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
      
      // Try AI generation with longer timeout and multiple attempts for custom pets
      let imageData: string | null = null;
      const maxAttempts = isCustomPet ? 3 : 1; // Try harder for custom pets
      
      for (let attempt = 0; attempt < maxAttempts && !imageData; attempt++) {
        try {
          console.log(`[AI] Attempt ${attempt + 1}/${maxAttempts} for ${emotion}...`);
          imageData = await Promise.race([
            generateImageWithAI(fullPrompt),
            new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 30000)) // 30s timeout
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
 * Generate image using Hugging Face Inference API (free, no key required)
 */
async function generateImageWithAI(prompt: string): Promise<string | null> {
  // Try each model until one works
  for (const modelUrl of HF_MODELS) {
    try {
      console.log(`[AI] Trying model: ${modelUrl}`);
      
      const response = await fetch(modelUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            width: 128,
            height: 128,
            num_inference_steps: 30, // More steps for better quality
            guidance_scale: 7.5,
            negative_prompt: 'blurry, low quality, distorted, ugly, bad anatomy, text, watermark'
          }
        })
      });
      
      // Check if model is loading (first time use)
      if (response.status === 503) {
        console.log('[AI] Model loading, waiting...');
        const data = await response.json().catch(() => ({}));
        if (data.estimated_time) {
          const waitTime = Math.min(data.estimated_time * 1000 + 5000, 45000); // Max 45s wait
          console.log(`[AI] Waiting ${waitTime}ms for model to load...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          // Retry up to 2 times
          for (let retry = 0; retry < 2; retry++) {
            console.log(`[AI] Retry ${retry + 1}/2 after model load...`);
            const retryResponse = await fetch(modelUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                inputs: prompt,
                parameters: { 
                  width: 128, 
                  height: 128, 
                  num_inference_steps: 30, // More steps for better quality
                  guidance_scale: 7.5 
                }
              })
            });
            
            if (retryResponse.ok) {
              const blob = await retryResponse.blob();
              if (blob.type.startsWith('image/')) {
                console.log('[AI] Successfully generated image after model load!');
                return await blobToDataUrl(blob);
              }
            } else if (retryResponse.status === 503) {
              // Still loading, wait more
              const retryData = await retryResponse.json().catch(() => ({}));
              if (retryData.estimated_time) {
                const additionalWait = Math.min(retryData.estimated_time * 1000 + 3000, 20000);
                await new Promise(resolve => setTimeout(resolve, additionalWait));
                continue; // Try again
              }
            } else {
              const errorText = await retryResponse.text().catch(() => '');
              console.warn(`[AI] Retry ${retry + 1} failed: ${retryResponse.status}`, errorText.substring(0, 100));
              break; // Move to next model
            }
          }
        }
        continue; // Try next model
      }
      
      if (response.ok) {
        const blob = await response.blob();
        
        // Check if it's an image
        if (blob.type.startsWith('image/')) {
          console.log('[AI] Successfully generated image!');
          return await blobToDataUrl(blob);
        }
        
        // Sometimes HF returns JSON with error
        try {
          const text = await blob.text();
          const json = JSON.parse(text);
          if (json.error) {
            console.warn('[AI] HF API error:', json.error);
            continue;
          }
        } catch {
          // Not JSON, might be image data
          if (blob.size > 0) {
            // Try to use it anyway
            console.log('[AI] Got blob, trying to use as image');
            return await blobToDataUrl(blob);
          }
        }
      } else {
        const errorText = await response.text().catch(() => '');
        console.warn(`[AI] API failed with status ${response.status}:`, errorText.substring(0, 100));
      }
    } catch (error) {
      console.warn(`[AI] Model ${modelUrl} failed:`, error);
      continue; // Try next model
    }
  }
  
  console.log('[AI] All models failed, will use SVG fallback');
  return null; // All models failed
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
  } else {
    // Default round shape - but add decorative elements based on prompt keywords
    let decorativeElements = '';
    if (promptLower.includes('astronaut') || promptLower.includes('space')) {
      decorativeElements = `<circle cx="64" cy="50" r="30" fill="none" stroke="${accent}" stroke-width="2" opacity="0.5" stroke-dasharray="4,4"/>`;
    } else if (promptLower.includes('nails') || promptLower.includes('polish')) {
      decorativeElements = `<circle cx="64" cy="64" r="42" fill="url(#petGrad${emotion})" stroke="${accent}" stroke-width="3"/>`;
    }
    characterShape = `<circle cx="64" cy="64" r="48" fill="url(#petGrad${emotion})" stroke="${accent}" stroke-width="2" opacity="0.9"/>${decorativeElements}`;
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

