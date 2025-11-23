import { PetTemplate } from '../types';

export const PET_TEMPLATES: PetTemplate[] = [
  {
    id: 'chicken-heels',
    name: 'Chicken in Heels',
    description: 'A fashionable chicken strutting in stylish heels',
    prompt: 'cute minimalist cartoon chicken wearing high heels, soft muted pastel colors, kawaii style, friendly expression, simple clean background',
    colors: { primary: '#D4A5B8', secondary: '#E8D5C4' }
  },
  {
    id: 'octopus-headphones',
    name: 'Octopus with Headphones',
    description: 'A chill octopus jamming to music',
    prompt: 'cute minimalist cartoon octopus wearing headphones, soft muted colors, kawaii style, happy expression, simple clean background',
    colors: { primary: '#C8B8D4', secondary: '#D4A5B8' }
  },
  {
    id: 'frog-astronaut',
    name: 'Frog Astronaut',
    description: 'A brave frog exploring the cosmos',
    prompt: 'cute minimalist cartoon frog in astronaut suit, space theme, soft pastel colors, kawaii style, determined expression, simple background',
    colors: { primary: '#B8D4A5', secondary: '#C8D4E8' }
  },
  {
    id: 'panda-programmer',
    name: 'Panda Programmer',
    description: 'A tech-savvy panda coding away',
    prompt: 'cute minimalist cartoon panda with glasses and laptop, tech theme, soft muted colors, kawaii style, focused expression, simple background',
    colors: { primary: '#4A5568', secondary: '#A8B8C8' }
  },
  {
    id: 'cat-barista',
    name: 'Cat Barista',
    description: 'A coffee-loving cat serving up brews',
    prompt: 'cute minimalist cartoon cat in barista apron, coffee theme, warm muted colors, kawaii style, cheerful expression, simple background',
    colors: { primary: '#A88A6B', secondary: '#D4C4A8' }
  },
  {
    id: 'bunny-wizard',
    name: 'Bunny Wizard',
    description: 'A magical bunny casting spells',
    prompt: 'cute minimalist cartoon bunny in wizard hat with magic wand, fantasy theme, soft pastel colors, kawaii style, mystical expression, simple background',
    colors: { primary: '#C8B8D4', secondary: '#E8D5C4' }
  },
  {
    id: 'cyberpunk-hedgehog',
    name: 'Cyberpunk Hedgehog',
    description: 'A futuristic hedgehog with subtle tech vibes',
    prompt: 'cute minimalist cartoon hedgehog with subtle tech elements, soft muted colors, kawaii style, cool expression, simple background',
    colors: { primary: '#A8C8D4', secondary: '#B8D4E8' }
  },
  {
    id: 'crystal-slime',
    name: 'Crystal Slime Creature',
    description: 'A translucent, sparkly slime friend',
    prompt: 'cute minimalist cartoon slime creature with subtle sparkles, soft pastel colors, kawaii style, friendly expression, simple background',
    colors: { primary: '#E0E8F4', secondary: '#D4C4E8' }
  }
];

export function getTemplateById(id: string): PetTemplate | undefined {
  return PET_TEMPLATES.find(t => t.id === id);
}
