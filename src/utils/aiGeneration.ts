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
  
  // RELIABLE GENERATION: Focus on working solutions
  for (const emotion of emotions) {
    try {
      const emotionPrompt = EMOTION_PROMPTS[emotion];
      const fullPrompt = `${basePrompt} ${emotionPrompt}`;
      
      console.log(`[AI] Generating ${emotion} icon`);
      
      // Use guaranteed generation with comprehensive error handling
      let imageData: string | null = null;
      
      try {
        imageData = await generateGuaranteedImage(fullPrompt, emotion);
      } catch (genError) {
        console.log(`[AI] Generation error for ${emotion}:`, genError);
        imageData = null;
      }
      
      if (imageData && imageData.length > 100) {
        console.log(`[AI] ✅ Successfully generated ${emotion}`);
        icons[emotion] = imageData;
      } else {
        console.log(`[AI] Using SVG fallback for ${emotion}`);
        // Always have a working fallback
        try {
          imageData = generatePersonalizedSVGIcon(emotion, colors, basePrompt, name);
          if (imageData && imageData.length > 50) {
            icons[emotion] = imageData;
          } else {
            throw new Error('SVG generation returned invalid data');
          }
        } catch (svgError) {
          console.error(`[AI] SVG generation failed for ${emotion}:`, svgError);
          try {
            // Try basic circle fallback
            icons[emotion] = generateBasicCircle(emotion);
          } catch (circleError) {
            console.error(`[AI] Basic circle failed for ${emotion}:`, circleError);
            // Ultimate fallback - colored div
            icons[emotion] = generateColoredDiv();
          }
        }
      }
      
      // Small delay between generations to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`[AI] Critical error generating ${emotion} icon:`, error);
      // Ensure we always have something
      try {
        icons[emotion] = generateBasicCircle(emotion);
      } catch (finalError) {
        console.error(`[AI] Final fallback failed for ${emotion}:`, finalError);
        icons[emotion] = generateColoredDiv();
      }
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
 * SMART HYBRID GENERATION - Fast + Accurate
 * Uses enhanced SVG for accuracy, Robohash for uniqueness
 */
async function generateGuaranteedImage(prompt: string, emotion: PetEmotion): Promise<string | null> {
  console.log(`[AI] Generating image for: ${prompt}`);
  
  // PRIORITY 1: Try simple, reliable AI generation with timeout
  try {
    const aiImage = await Promise.race([
      generateSimpleAI(prompt, emotion),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('AI timeout')), 5000)
      )
    ]);
    
    if (aiImage) {
      console.log(`[AI] ✅ AI image generated successfully!`);
      return aiImage;
    }
  } catch (error) {
    console.log(`[AI] AI generation failed or timed out, using SVG:`, error);
  }
  
  // PRIORITY 2: Enhanced SVG (reliable and fast)
  const svgResult = tryEnhancedSVGFirst(prompt, emotion);
  if (svgResult) {
    console.log(`[AI] Using enhanced SVG`);
    return svgResult;
  }

  // PRIORITY 3: Basic SVG fallback
  console.log(`[AI] Using basic SVG fallback`);
  return generatePersonalizedSVGIcon(emotion, undefined, prompt, 'Pet');
}

/**
 * Convert blob to data URL
 */
async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * ENHANCED SVG FIRST - Check if we can create accurate SVG for common prompts
 */
function tryEnhancedSVGFirst(prompt: string, emotion: PetEmotion): string | null {
  const promptLower = prompt.toLowerCase();
  
  // Define accurate SVG patterns for common pet types
  const svgPatterns = {
    // Animals
    'cat': true, 'kitten': true, 'feline': true,
    'dog': true, 'puppy': true, 'canine': true,
    'bird': true, 'chicken': true, 'duck': true,
    'fish': true, 'goldfish': true,
    'rabbit': true, 'bunny': true,
    'hamster': true, 'mouse': true,
    'frog': true, 'toad': true,
    'hedgehog': true, 'panda': true, 'bear': true,
    'octopus': true,
    
    // Creatures
    'dragon': true, 'slime': true, 'blob': true,
    'ghost': true, 'spirit': true,
    'alien': true, 'monster': true,
    
    // Objects with character
    'robot': true, 'android': true,
    'crystal': true, 'gem': true,
    'plant': true, 'flower': true,
    'star': true, 'moon': true, 'sun': true
  };
  
  // Check if prompt contains recognizable elements
  const hasKnownElement = Object.keys(svgPatterns).some(pattern => 
    promptLower.includes(pattern)
  );
  
  if (hasKnownElement) {
    console.log(`[SVG] Creating accurate SVG for recognized prompt: ${prompt}`);
    return generatePersonalizedSVGIcon(emotion, undefined, prompt, 'Pet');
  }
  
  return null;
}

/**
 * SMART ROBOHASH - Better prompt mapping for more accurate results
 */
/**
 * Simple, reliable AI generation with better error handling
 */
async function generateSimpleAI(prompt: string, emotion: PetEmotion): Promise<string | null> {
  console.log(`[AI] Attempting simple AI generation for: ${prompt}`);
  
  // Create optimized prompt
  const optimizedPrompt = createOptimizedPrompt(prompt, emotion);
  
  // Try only the most reliable service (Pollinations)
  try {
    const result = await generateWithPollinations(optimizedPrompt);
    if (result) {
      console.log(`[AI] ✅ Pollinations succeeded!`);
      return result;
    }
  } catch (error) {
    console.log(`[AI] Pollinations failed:`, error);
  }
  
  console.log(`[AI] AI generation failed, will use SVG`);
  return null;
}

/**
 * Create optimized prompt for AI generation
 */
function createOptimizedPrompt(basePrompt: string, emotion: PetEmotion): string {
  const emotionText = EMOTION_PROMPTS[emotion];
  
  // Clean and optimize the prompt for better AI results
  let optimized = basePrompt
    .replace(/cute minimalist cartoon/gi, 'adorable kawaii style')
    .replace(/simple clean background/gi, 'white background')
    .replace(/soft muted/gi, 'pastel');
  
  // Add quality enhancers
  const qualityTerms = [
    'high quality',
    'detailed',
    'professional illustration',
    'clean art style',
    emotionText
  ].join(', ');
  
  return `${optimized}, ${qualityTerms}`;
}

/**
 * Pollinations AI - Simplified and more robust
 */
async function generateWithPollinations(prompt: string): Promise<string | null> {
  try {
    console.log(`[AI] Trying Pollinations with simplified approach`);
    
    // Simplify prompt to avoid encoding issues
    const simplePrompt = prompt.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 100);
    const encodedPrompt = encodeURIComponent(simplePrompt);
    const seed = Math.floor(Math.random() * 10000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=256&height=256&seed=${seed}&nologo=true`;
    
    console.log(`[AI] Fetching from: ${imageUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout
    
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: { 
        'Accept': 'image/*',
        'User-Agent': 'Mozilla/5.0 (compatible; PetCompanion/1.0)'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok && response.status === 200) {
      const blob = await response.blob();
      console.log(`[AI] Received blob: ${blob.type}, ${blob.size} bytes`);
      
      if (blob.type.startsWith('image/') && blob.size > 1000) {
        const dataUrl = await blobToDataUrl(blob);
        console.log(`[AI] ✅ Pollinations success!`);
        return dataUrl;
      } else {
        console.log(`[AI] Invalid blob: ${blob.type}, ${blob.size} bytes`);
      }
    } else {
      console.log(`[AI] Bad response: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`[AI] Pollinations error:`, error);
  }
  return null;
}

// Removed other AI services to prevent DOMExceptions and focus on reliability

/**
 * Generate basic circle as ultimate fallback - completely safe
 */
function generateBasicCircle(emotion: PetEmotion): string {
  const colors = {
    CALM: '#90EE90',
    CONTENT: '#87CEEB', 
    SLEEPY: '#DDA0DD',
    ALERT: '#FFD700',
    CONFUSED: '#9370DB',
    OVERWHELMED: '#FF6347',
    CELEBRATING: '#FFD700'
  };
  
  const color = colors[emotion] || '#87CEEB';
  
  // Use URL encoding instead of btoa to avoid DOMExceptions
  const svg = `<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="35" fill="${color}" opacity="0.8"/><circle cx="30" cy="35" r="4" fill="#333"/><circle cx="50" cy="35" r="4" fill="#333"/><path d="M 28 48 Q 40 53 52 48" stroke="#333" stroke-width="2" fill="none"/></svg>`;
  
  try {
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  } catch (error) {
    // If btoa fails, use URL encoding
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
}

/**
 * Safe SVG generation wrapper
 */
function generateSafeSVG(svgContent: string): string {
  try {
    // Try btoa first
    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  } catch (error) {
    console.log('[SVG] btoa failed, using URL encoding');
    try {
      // Fallback to URL encoding
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
    } catch (urlError) {
      console.error('[SVG] Both encoding methods failed:', urlError);
      // Ultimate fallback - simple colored div
      return generateColoredDiv();
    }
  }
}

/**
 * Ultimate fallback - colored div as CSS
 */
function generateColoredDiv(): string {
  const colors = ['#87CEEB', '#90EE90', '#DDA0DD', '#FFD700', '#9370DB', '#FF6347'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  // Return a simple data URL that creates a colored circle
  const css = `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Ccircle cx='40' cy='40' r='35' fill='${color}'/%3E%3C/svg%3E`;
  return css;
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
  
  // Extract character type from prompt - check for multiple keywords
  const promptLower = basePrompt.toLowerCase();
  let characterType = 'round';
  let characterShape = '';
  
  console.log(`[SVG] Analyzing prompt: "${basePrompt}" for character type`);
  
  // Check for frog first (most specific for your case)
  if (promptLower.includes('frog')) {
    characterType = 'frog';
    console.log(`[SVG] Detected frog character`);
    
    // Check for astronaut/space theme
    const isAstronaut = promptLower.includes('astronaut') || promptLower.includes('space') || promptLower.includes('suit');
    console.log(`[SVG] Is astronaut: ${isAstronaut}`);
    
    if (isAstronaut) {
      // Frog astronaut with helmet - more visible design
      characterShape = `
        <!-- Frog body -->
        <ellipse cx="64" cy="80" rx="35" ry="40" fill="url(#petGrad${emotion})"/>
        <!-- Astronaut suit body -->
        <ellipse cx="64" cy="75" rx="32" ry="35" fill="${accent}" opacity="0.3"/>
        <!-- Helmet bubble -->
        <circle cx="64" cy="50" r="28" fill="none" stroke="${accent}" stroke-width="3" opacity="0.8"/>
        <circle cx="64" cy="50" r="25" fill="${accent}" opacity="0.1"/>
        <!-- Helmet reflection -->
        <ellipse cx="58" cy="45" rx="8" ry="12" fill="white" opacity="0.4"/>
        <!-- Suit details -->
        <rect x="58" y="85" width="12" height="6" rx="2" fill="${accent}" opacity="0.6"/>
        <circle cx="64" cy="70" r="3" fill="${accent}" opacity="0.7"/>
      `;
    } else {
      // Regular frog shape with bulging eyes
      characterShape = `
        <ellipse cx="64" cy="75" rx="38" ry="42" fill="url(#petGrad${emotion})"/>
        <ellipse cx="64" cy="68" rx="35" ry="38" fill="url(#petGrad${emotion})"/>
        <!-- Frog eyes bulge -->
        <ellipse cx="50" cy="45" rx="8" ry="12" fill="url(#petGrad${emotion})"/>
        <ellipse cx="78" cy="45" rx="8" ry="12" fill="url(#petGrad${emotion})"/>
        <!-- Eye pupils -->
        <circle cx="50" cy="48" r="4" fill="#4A5568"/>
        <circle cx="78" cy="48" r="4" fill="#4A5568"/>
      `;
    }
  } else if (promptLower.includes('cat') || promptLower.includes('feline')) {
    characterType = 'cat';
    console.log(`[SVG] Creating cat character`);
    
    // Check for barista theme
    const isBarista = promptLower.includes('barista') || promptLower.includes('coffee') || promptLower.includes('apron');
    
    if (isBarista) {
      // Cat barista with apron and coffee
      characterShape = `
        <!-- Cat body -->
        <ellipse cx="64" cy="70" rx="38" ry="43" fill="url(#petGrad${emotion})"/>
        <!-- Cat ears -->
        <path d="M 50 30 Q 64 20 78 30 L 75 35 Q 64 28 53 35 Z" fill="url(#petGrad${emotion})"/>
        <!-- Barista apron -->
        <rect x="50" y="55" width="28" height="35" rx="3" fill="#FFFFFF" opacity="0.9"/>
        <rect x="52" y="57" width="24" height="8" fill="#8B4513"/>
        <!-- Coffee cup in paw -->
        <ellipse cx="35" cy="65" rx="6" ry="8" fill="#8B4513"/>
        <ellipse cx="35" cy="62" rx="5" ry="3" fill="#D2691E"/>
        <!-- Steam from coffee -->
        <path d="M 32 55 Q 30 50 32 45" stroke="#DDD" stroke-width="1" fill="none"/>
        <path d="M 35 55 Q 33 50 35 45" stroke="#DDD" stroke-width="1" fill="none"/>
        <path d="M 38 55 Q 36 50 38 45" stroke="#DDD" stroke-width="1" fill="none"/>
        <!-- Coffee beans on apron -->
        <ellipse cx="60" cy="70" rx="2" ry="3" fill="#8B4513"/>
        <ellipse cx="68" cy="75" rx="2" ry="3" fill="#8B4513"/>
      `;
    } else {
      // Regular cat
      characterShape = `<ellipse cx="64" cy="70" rx="40" ry="45" fill="url(#petGrad${emotion})"/><path d="M 50 30 Q 64 20 78 30 L 75 35 Q 64 28 53 35 Z" fill="url(#petGrad${emotion})"/><path d="M 90 30 Q 78 20 64 25 L 64 35 Q 75 28 90 35 Z" fill="url(#petGrad${emotion})"/>`;
    }
  } else if (promptLower.includes('dog') || promptLower.includes('puppy')) {
    characterType = 'dog';
    characterShape = `<ellipse cx="64" cy="70" rx="42" ry="45" fill="url(#petGrad${emotion})"/><ellipse cx="50" cy="30" rx="8" ry="12" fill="url(#petGrad${emotion})"/><ellipse cx="78" cy="30" rx="8" ry="12" fill="url(#petGrad${emotion})"/>`;
  } else if (promptLower.includes('bird') || promptLower.includes('chicken')) {
    characterType = 'chicken';
    console.log(`[SVG] Creating chicken character`);
    
    // Check for heels/fashion accessories
    const hasHeels = promptLower.includes('heels') || promptLower.includes('shoes') || promptLower.includes('fashion');
    
    if (hasHeels) {
      // Chicken in heels - more detailed and fashionable
      characterShape = `
        <!-- Chicken body -->
        <ellipse cx="64" cy="65" rx="32" ry="35" fill="url(#petGrad${emotion})"/>
        <!-- Chicken head -->
        <ellipse cx="64" cy="35" rx="22" ry="25" fill="url(#petGrad${emotion})"/>
        <!-- Beak -->
        <path d="M 45 35 L 38 38 L 45 41 Z" fill="${accent}"/>
        <!-- Comb on head -->
        <path d="M 55 15 Q 60 10 65 15 Q 70 10 75 15 L 75 25 L 55 25 Z" fill="#FF6B6B"/>
        <!-- Wing -->
        <ellipse cx="45" cy="60" rx="12" ry="20" fill="${secondary}" opacity="0.7"/>
        <!-- Legs -->
        <rect x="55" y="95" width="4" height="15" fill="${accent}"/>
        <rect x="69" y="95" width="4" height="15" fill="${accent}"/>
        <!-- High heels -->
        <ellipse cx="57" cy="115" rx="8" ry="4" fill="#FF1493"/>
        <ellipse cx="71" cy="115" rx="8" ry="4" fill="#FF1493"/>
        <!-- Heel stilettos -->
        <rect x="55" y="110" width="2" height="8" fill="#8B0000"/>
        <rect x="69" y="110" width="2" height="8" fill="#8B0000"/>
        <!-- Fashionable tail feathers -->
        <ellipse cx="90" cy="70" rx="8" ry="15" fill="${secondary}" opacity="0.8" transform="rotate(20 90 70)"/>
      `;
    } else {
      // Regular bird/chicken
      characterShape = `
        <!-- Bird body -->
        <ellipse cx="64" cy="70" rx="35" ry="40" fill="url(#petGrad${emotion})"/>
        <!-- Bird head -->
        <ellipse cx="64" cy="35" rx="25" ry="30" fill="url(#petGrad${emotion})"/>
        <!-- Beak -->
        <path d="M 42 35 L 35 38 L 42 41 Z" fill="${accent}"/>
        <!-- Wing -->
        <ellipse cx="45" cy="65" rx="15" ry="25" fill="${secondary}" opacity="0.6"/>
      `;
    }
  } else if (promptLower.includes('bunny') || promptLower.includes('rabbit')) {
    characterType = 'bunny';
    console.log(`[SVG] Creating bunny character`);
    
    // Check for wizard theme
    const isWizard = promptLower.includes('wizard') || promptLower.includes('magic') || promptLower.includes('hat') || promptLower.includes('wand');
    
    if (isWizard) {
      // Bunny wizard with hat and wand
      characterShape = `
        <!-- Bunny body -->
        <ellipse cx="64" cy="75" rx="32" ry="38" fill="url(#petGrad${emotion})"/>
        <!-- Bunny ears -->
        <ellipse cx="50" cy="25" rx="6" ry="18" fill="url(#petGrad${emotion})"/>
        <ellipse cx="78" cy="25" rx="6" ry="18" fill="url(#petGrad${emotion})"/>
        <!-- Wizard hat -->
        <path d="M 45 35 L 64 10 L 83 35 Z" fill="#4B0082"/>
        <ellipse cx="64" cy="35" rx="20" ry="5" fill="#4B0082"/>
        <!-- Hat star -->
        <text x="60" y="25" font-family="Arial" font-size="12" fill="#FFD700">★</text>
        <!-- Magic wand in paw -->
        <line x1="85" y1="65" x2="100" y2="55" stroke="#8B4513" stroke-width="2"/>
        <circle cx="100" cy="55" r="3" fill="#FFD700"/>
        <!-- Magic sparkles -->
        <text x="105" y="50" font-family="Arial" font-size="8" fill="#FFD700">✨</text>
        <text x="35" y="40" font-family="Arial" font-size="6" fill="#FFD700">✨</text>
        <!-- Wizard robe collar -->
        <ellipse cx="64" cy="55" rx="25" ry="8" fill="#4B0082" opacity="0.6"/>
      `;
    } else {
      // Regular bunny
      characterShape = `
        <ellipse cx="64" cy="75" rx="35" ry="40" fill="url(#petGrad${emotion})"/>
        <ellipse cx="50" cy="25" rx="6" ry="18" fill="url(#petGrad${emotion})"/>
        <ellipse cx="78" cy="25" rx="6" ry="18" fill="url(#petGrad${emotion})"/>
      `;
    }
  } else if (promptLower.includes('hedgehog')) {
    characterType = 'hedgehog';
    console.log(`[SVG] Creating hedgehog character`);
    
    // Check for cyberpunk theme
    const isCyberpunk = promptLower.includes('cyber') || promptLower.includes('tech') || promptLower.includes('digital');
    
    if (isCyberpunk) {
      // Cyberpunk hedgehog with tech elements
      characterShape = `
        <!-- Hedgehog body -->
        <ellipse cx="64" cy="75" rx="35" ry="35" fill="url(#petGrad${emotion})"/>
        <!-- Spiky back -->
        <path d="M 35 50 L 30 40 L 40 45 L 35 35 L 45 40 L 40 30 L 50 35 L 45 25 L 55 30 L 50 20 L 60 25 L 55 15 L 65 20 L 70 15 L 75 20 L 80 15 L 85 20 L 90 25 L 95 35 L 90 45 L 85 50" 
              fill="url(#petGrad${emotion})" opacity="0.8"/>
        <!-- Cyberpunk visor -->
        <ellipse cx="64" cy="60" rx="20" ry="8" fill="#00FFFF" opacity="0.7"/>
        <rect x="50" y="57" width="28" height="6" fill="#333"/>
        <!-- Tech spikes -->
        <circle cx="45" cy="40" r="2" fill="#00FFFF"/>
        <circle cx="55" cy="30" r="2" fill="#FF00FF"/>
        <circle cx="75" cy="25" r="2" fill="#00FFFF"/>
        <circle cx="85" cy="35" r="2" fill="#FF00FF"/>
        <!-- Digital lines -->
        <line x1="30" y1="70" x2="98" y2="70" stroke="#00FFFF" stroke-width="1" opacity="0.5"/>
        <line x1="35" y1="80" x2="93" y2="80" stroke="#FF00FF" stroke-width="1" opacity="0.5"/>
      `;
    } else {
      // Regular hedgehog
      characterShape = `
        <ellipse cx="64" cy="75" rx="35" ry="35" fill="url(#petGrad${emotion})"/>
        <!-- Spiky back -->
        <path d="M 35 50 L 30 40 L 40 45 L 35 35 L 45 40 L 40 30 L 50 35 L 45 25 L 55 30 L 50 20 L 60 25 L 55 15 L 65 20 L 70 15 L 75 20 L 80 15 L 85 20 L 90 25 L 95 35 L 90 45 L 85 50" 
              fill="url(#petGrad${emotion})" opacity="0.8"/>
      `;
    }
  } else if (promptLower.includes('robot') || promptLower.includes('cyber')) {
    characterType = 'robot';
    characterShape = `<rect x="30" y="40" width="68" height="68" rx="8" fill="url(#petGrad${emotion})"/><rect x="40" y="50" width="48" height="48" rx="4" fill="${accent}" opacity="0.3"/>`;
  // This section was moved up above
  } else if (promptLower.includes('octopus')) {
    characterType = 'octopus';
    console.log(`[SVG] Creating octopus character`);
    
    // Check for headphones
    const hasHeadphones = promptLower.includes('headphones') || promptLower.includes('music') || promptLower.includes('audio');
    
    if (hasHeadphones) {
      // Octopus with headphones - musical vibes
      characterShape = `
        <!-- Octopus head -->
        <circle cx="64" cy="50" r="32" fill="url(#petGrad${emotion})"/>
        <!-- Headphones band -->
        <path d="M 35 35 Q 64 20 93 35" stroke="#333" stroke-width="4" fill="none"/>
        <!-- Left headphone -->
        <circle cx="38" cy="45" r="12" fill="#333"/>
        <circle cx="38" cy="45" r="8" fill="#666"/>
        <!-- Right headphone -->
        <circle cx="90" cy="45" r="12" fill="#333"/>
        <circle cx="90" cy="45" r="8" fill="#666"/>
        <!-- Tentacles -->
        <ellipse cx="40" cy="75" rx="6" ry="18" fill="url(#petGrad${emotion})" transform="rotate(-15 40 75)"/>
        <ellipse cx="52" cy="80" rx="6" ry="16" fill="url(#petGrad${emotion})" transform="rotate(-5 52 80)"/>
        <ellipse cx="76" cy="80" rx="6" ry="16" fill="url(#petGrad${emotion})" transform="rotate(5 76 80)"/>
        <ellipse cx="88" cy="75" rx="6" ry="18" fill="url(#petGrad${emotion})" transform="rotate(15 88 75)"/>
        <!-- Music notes -->
        <text x="25" y="25" font-family="Arial" font-size="12" fill="${accent}">♪</text>
        <text x="100" y="30" font-family="Arial" font-size="10" fill="${accent}">♫</text>
      `;
    } else {
      // Regular octopus
      characterShape = `
        <circle cx="64" cy="60" r="35" fill="url(#petGrad${emotion})"/>
        <!-- Tentacles -->
        <ellipse cx="40" cy="85" rx="8" ry="20" fill="url(#petGrad${emotion})"/>
        <ellipse cx="55" cy="90" rx="8" ry="18" fill="url(#petGrad${emotion})"/>
        <ellipse cx="73" cy="90" rx="8" ry="18" fill="url(#petGrad${emotion})"/>
        <ellipse cx="88" cy="85" rx="8" ry="20" fill="url(#petGrad${emotion})"/>
      `;
    }
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
  } else if (promptLower.includes('bear') || promptLower.includes('panda')) {
    characterType = 'bear';
    console.log(`[SVG] Creating bear/panda character`);
    
    // Check for panda and programmer features
    const isPanda = promptLower.includes('panda');
    const isProgrammer = promptLower.includes('programmer') || promptLower.includes('laptop') || promptLower.includes('glasses') || promptLower.includes('code');
    
    if (isPanda && isProgrammer) {
      // Panda programmer with glasses and laptop
      characterShape = `
        <!-- Panda body -->
        <circle cx="64" cy="70" r="38" fill="#FFFFFF"/>
        <!-- Panda ears (black) -->
        <circle cx="45" cy="35" r="12" fill="#000000"/>
        <circle cx="83" cy="35" r="12" fill="#000000"/>
        <!-- Eye patches (black) -->
        <ellipse cx="55" cy="50" rx="8" ry="10" fill="#000000"/>
        <ellipse cx="73" cy="50" rx="8" ry="10" fill="#000000"/>
        <!-- Glasses -->
        <circle cx="55" cy="50" r="10" stroke="#333" stroke-width="2" fill="none"/>
        <circle cx="73" cy="50" r="10" stroke="#333" stroke-width="2" fill="none"/>
        <line x1="65" y1="50" x2="63" y2="50" stroke="#333" stroke-width="2"/>
        <!-- Laptop -->
        <rect x="45" y="85" width="38" height="20" rx="2" fill="#333"/>
        <rect x="47" y="87" width="34" height="12" fill="#000"/>
        <!-- Code on screen -->
        <line x1="50" y1="90" x2="60" y2="90" stroke="#00FF00" stroke-width="1"/>
        <line x1="50" y1="93" x2="65" y2="93" stroke="#00FF00" stroke-width="1"/>
        <line x1="50" y1="96" x2="55" y2="96" stroke="#00FF00" stroke-width="1"/>
      `;
    } else if (isPanda) {
      // Regular panda
      characterShape = `
        <circle cx="64" cy="70" r="40" fill="#FFFFFF"/>
        <!-- Panda ears (black) -->
        <circle cx="45" cy="35" r="12" fill="#000000"/>
        <circle cx="83" cy="35" r="12" fill="#000000"/>
        <!-- Eye patches (black) -->
        <ellipse cx="55" cy="50" rx="8" ry="10" fill="#000000"/>
        <ellipse cx="73" cy="50" rx="8" ry="10" fill="#000000"/>
      `;
    } else {
      // Regular bear
      characterShape = `
        <circle cx="64" cy="70" r="40" fill="url(#petGrad${emotion})"/>
        <!-- Bear ears -->
        <circle cx="45" cy="35" r="12" fill="url(#petGrad${emotion})"/>
        <circle cx="83" cy="35" r="12" fill="url(#petGrad${emotion})"/>
        <circle cx="45" cy="35" r="6" fill="${accent}"/>
        <circle cx="83" cy="35" r="6" fill="${accent}"/>
      `;
    }
  } else if (promptLower.includes('slime') || promptLower.includes('blob') || promptLower.includes('goo')) {
    characterType = 'slime';
    console.log(`[SVG] Creating slime character`);
    
    // Check for crystal/gem modifiers
    const isCrystal = promptLower.includes('crystal') || promptLower.includes('gem') || promptLower.includes('diamond');
    
    if (isCrystal) {
      // Crystal slime with faceted, gem-like appearance
      characterShape = `
        <!-- Crystal slime body with faceted edges -->
        <path d="M 64 35 L 85 50 L 90 75 L 75 95 L 53 95 L 38 75 L 43 50 Z" fill="url(#petGrad${emotion})" opacity="0.9"/>
        <!-- Inner crystal facets -->
        <path d="M 64 40 L 78 52 L 82 72 L 70 85 L 58 85 L 46 72 L 50 52 Z" fill="${accent}" opacity="0.3"/>
        <!-- Crystal shine effects -->
        <path d="M 55 45 L 65 42 L 68 55 L 58 58 Z" fill="white" opacity="0.6"/>
        <path d="M 70 60 L 75 58 L 77 68 L 72 70 Z" fill="white" opacity="0.4"/>
        <!-- Crystal sparkles -->
        <circle cx="50" cy="50" r="1.5" fill="white" opacity="0.8"/>
        <circle cx="78" cy="65" r="1" fill="white" opacity="0.7"/>
        <circle cx="60" cy="80" r="1.2" fill="white" opacity="0.6"/>
      `;
    } else {
      // Regular slime with soft, gooey appearance
      characterShape = `
        <!-- Soft slime body -->
        <ellipse cx="64" cy="80" rx="40" ry="35" fill="url(#petGrad${emotion})"/>
        <!-- Slime drips -->
        <ellipse cx="45" cy="95" rx="8" ry="12" fill="url(#petGrad${emotion})" opacity="0.8"/>
        <ellipse cx="83" cy="95" rx="6" ry="10" fill="url(#petGrad${emotion})" opacity="0.8"/>
        <ellipse cx="64" cy="98" rx="4" ry="8" fill="url(#petGrad${emotion})" opacity="0.6"/>
        <!-- Slime shine -->
        <ellipse cx="55" cy="65" rx="12" ry="8" fill="white" opacity="0.3"/>
        <ellipse cx="58" cy="67" rx="6" ry="4" fill="white" opacity="0.5"/>
      `;
    }
  } else if (promptLower.includes('ghost') || promptLower.includes('spirit')) {
    characterType = 'ghost';
    characterShape = `
      <!-- Ghost body -->
      <path d="M 64 40 Q 85 40 85 65 Q 85 90 80 95 L 75 90 L 70 95 L 65 90 L 60 95 L 55 90 L 50 95 Q 43 90 43 65 Q 43 40 64 40 Z" fill="url(#petGrad${emotion})" opacity="0.8"/>
      <!-- Ghost wispy trails -->
      <ellipse cx="48" cy="85" rx="3" ry="8" fill="url(#petGrad${emotion})" opacity="0.4"/>
      <ellipse cx="80" cy="85" rx="3" ry="8" fill="url(#petGrad${emotion})" opacity="0.4"/>
    `;
  } else if (promptLower.includes('crystal') || promptLower.includes('gem') || promptLower.includes('diamond')) {
    characterType = 'crystal';
    characterShape = `
      <!-- Crystal creature with geometric facets -->
      <path d="M 64 30 L 85 45 L 90 70 L 75 90 L 53 90 L 38 70 L 43 45 Z" fill="url(#petGrad${emotion})"/>
      <!-- Inner facets -->
      <path d="M 64 35 L 78 48 L 82 68 L 70 82 L 58 82 L 46 68 L 50 48 Z" fill="white" opacity="0.2"/>
      <!-- Crystal highlights -->
      <path d="M 58 40 L 68 38 L 70 50 L 60 52 Z" fill="white" opacity="0.7"/>
      <path d="M 72 55 L 76 53 L 78 63 L 74 65 Z" fill="white" opacity="0.5"/>
      <!-- Sparkles -->
      <circle cx="52" cy="48" r="1.5" fill="white" opacity="0.9"/>
      <circle cx="76" cy="62" r="1" fill="white" opacity="0.8"/>
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
  
  // Adjust eye and mouth positions based on character type
  const isFrogAstronaut = characterType === 'frog' && (promptLower.includes('astronaut') || promptLower.includes('space') || promptLower.includes('suit'));
  const eyeY = isFrogAstronaut ? 48 : 55; // Higher eyes for astronaut helmet
  const mouthY = isFrogAstronaut ? 85 : 72; // Lower mouth for astronaut
  
  // Emotion-based expressions
  const expressions: Record<PetEmotion, { eyes: string; mouth: string; doodles: string }> = {
    CALM: {
      eyes: `<circle cx="50" cy="${eyeY}" r="4" fill="#4A5568"/><circle cx="78" cy="${eyeY}" r="4" fill="#4A5568"/>`,
      mouth: `<path d="M 52 ${mouthY} Q 64 ${mouthY + 5} 76 ${mouthY}" stroke="#4A5568" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      doodles: '<circle cx="20" cy="20" r="2" fill="' + accent + '" opacity="0.6"/><path d="M 100 30 Q 105 25 110 30" stroke="' + accent + '" stroke-width="1.5" fill="none" opacity="0.5"/>'
    },
    CONTENT: {
      eyes: `<circle cx="50" cy="${eyeY}" r="4.5" fill="#4A5568"/><circle cx="78" cy="${eyeY}" r="4.5" fill="#4A5568"/><circle cx="51" cy="${eyeY - 1}" r="1.5" fill="#fff"/>`,
      mouth: `<path d="M 52 ${mouthY + 2} Q 64 ${mouthY + 10} 76 ${mouthY + 2}" stroke="#4A5568" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
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
  
  return generateSafeSVG(svg);
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
  console.log(`[TEMPLATE] Generating template pet: ${template.name}`);
  console.log(`[TEMPLATE] Using prompt: "${template.prompt}"`);
  console.log(`[TEMPLATE] Colors:`, template.colors);
  return generatePetIcons(template.prompt, template.name, template.colors);
}

function parseColors(colorString: string): { primary: string; secondary: string } | undefined {
  const colors = colorString.match(/#[0-9A-Fa-f]{6}/g);
  if (colors && colors.length >= 2) {
    return { primary: colors[0], secondary: colors[1] };
  }
  return undefined;
}

