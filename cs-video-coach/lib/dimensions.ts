export const DIMENSIONS = [
  { key: 'pacing', label: 'Pacing', icon: '⏱️', description: 'Speed and rhythm of delivery' },
  { key: 'tone', label: 'Tone', icon: '🎙️', description: 'Warmth, confidence, and authenticity' },
  { key: 'inspiration', label: 'Inspiration', icon: '✨', description: 'Ability to motivate and energize' },
  { key: 'clarity', label: 'Message Clarity', icon: '💡', description: 'How clear and focused the core message is' },
  { key: 'credibility', label: 'Professional Credibility', icon: '🏆', description: 'Authority and expertise conveyed' },
  { key: 'hook', label: 'Hook Strength', icon: '🪝', description: 'Opening that grabs attention' },
  { key: 'cta', label: 'Call to Action', icon: '🎯', description: 'Clarity and effectiveness of the CTA' },
] as const;

export type DimensionKey = typeof DIMENSIONS[number]['key'];
