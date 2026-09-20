/**
 * CourseIT Single Source of Truth for Pricing & Tier Configurations
 *
 * All credit costs, model tier definitions, and quota limits are defined here.
 * Shared across serverless backend endpoints and React client components.
 *
 * NOTE: CourseIT credits are internal usage quota units, NOT USD or provider API dollars.
 */

export const DEFAULT_ACCOUNT_CREDITS = 250;
export const GUEST_DAILY_COURSE_LIMIT = 3;
export const GUEST_TUTOR_DAILY_LIMIT = 15;

/**
 * Course Generation Credit Costs
 */
export const MODEL_CREDIT_COSTS = {
  'gemini-flash-lite-latest': 0.5,
  'gemini-3.5-flash-lite': 1.0,
  'gemini-3.6-flash': 2.0,
  'gemini-3.7-flash': 5.0
};

/**
 * Rich Model Tier Metadata for UI Selectors and Success Modals
 */
export const MODEL_TIER_CONFIG = {
  'gemini-flash-lite-latest': {
    id: 'gemini-flash-lite-latest',
    tierName: 'Fast Tier',
    preferredModel: 'Flash Lite',
    maxCredits: 0.5,
    badge: '0.5 credits',
    label: 'Fast — Flash Lite preferred (0.5 cr)',
    description: 'Fastest generation (~0.8s), great for standard guides and quick checklists.',
    isPublicAllowed: true
  },
  'gemini-3.5-flash-lite': {
    id: 'gemini-3.5-flash-lite',
    tierName: 'Balanced Tier',
    preferredModel: 'Gemini 3.5 Flash Lite',
    maxCredits: 1.0,
    badge: 'Up to 1.0 cr',
    label: 'Balanced — Gemini 3.5 preferred (Up to 1.0 cr)',
    description: 'Balanced depth and detail for API references and multi-step tutorials.',
    isPublicAllowed: false
  },
  'gemini-3.6-flash': {
    id: 'gemini-3.6-flash',
    tierName: 'Deep Synthesis',
    preferredModel: 'Gemini 3.6 Flash',
    maxCredits: 2.0,
    badge: 'Up to 2.0 cr',
    label: 'Deep — Gemini 3.6 Flash preferred (Up to 2.0 cr)',
    description: 'Thorough synthesis with extensive code examples, pitfall warnings, and architecture notes.',
    isPublicAllowed: false
  },
  'gemini-3.7-flash': {
    id: 'gemini-3.7-flash',
    tierName: 'Maximum Depth',
    preferredModel: 'Gemini 3.7 Flash',
    maxCredits: 5.0,
    badge: 'Up to 5.0 cr',
    label: 'Maximum Depth — Gemini 3.7 Flash preferred (Up to 5.0 cr)',
    description: 'Maximum reasoning power for complex technical architectures and comprehensive systems.',
    isPublicAllowed: false
  }
};

/**
 * Returns credit cost for a given course generation model ID.
 * Defaults to 0.5 (lowest tier) if unknown.
 */
export function getModelCost(modelId) {
  return MODEL_CREDIT_COSTS[modelId] ?? 0.5;
}

/**
 * Contextual Tutor Credit Costs
 */
export const TUTOR_CREDIT_COSTS = {
  quick: 0.1,
  normal: 0.25,
  deep: 0.5
};

export const TUTOR_MODE_CONFIG = {
  quick: {
    id: 'quick',
    name: 'Quick',
    cost: 0.1,
    description: 'Concise explanation under 150 words'
  },
  normal: {
    id: 'normal',
    name: 'Normal',
    cost: 0.25,
    description: 'Balanced explanation under 250 words with code snippets'
  },
  deep: {
    id: 'deep',
    name: 'Deep',
    cost: 0.5,
    description: 'In-depth explanation with mental models and edge cases'
  }
};

/**
 * Returns credit cost for a given tutor response mode.
 */
export function getTutorCost(mode) {
  return TUTOR_CREDIT_COSTS[mode] ?? 0.1;
}

/**
 * Returns tier metadata for a course generation model ID.
 */
export function getTierForModel(modelId) {
  if (MODEL_TIER_CONFIG[modelId]) return MODEL_TIER_CONFIG[modelId];
  return MODEL_TIER_CONFIG['gemini-flash-lite-latest'];
}

/**
 * Extracts provider name from a model or provider identifier string.
 */
export function resolveProviderName(modelString = '') {
  const m = String(modelString || '').toLowerCase();
  if (m.startsWith('groq') || m.includes('groq')) return 'Groq';
  if (m.startsWith('cerebras') || m.includes('cerebras')) return 'Cerebras';
  if (m.startsWith('mistral') || m.includes('mistral')) return 'Mistral';
  if (m.startsWith('openrouter') || m.includes('openrouter')) return 'OpenRouter';
  if (m.startsWith('openai') || m.includes('openai')) return 'OpenAI';
  return 'Gemini';
}
