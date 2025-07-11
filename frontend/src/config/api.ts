export const API_BASE_URL = import.meta.env.PROD
  ? 'https://visual-prompt-builder.yuya-kitamori.workers.dev'
  : 'http://localhost:8787';

export const API_ENDPOINTS = {
  generatePrompt: `${API_BASE_URL}/api/v1/prompt/generate`,
  translatePrompt: `${API_BASE_URL}/api/v1/translation/trans`, // Changed from /translate due to Cloudflare Workers issue
  generateImage: `${API_BASE_URL}/api/v1/image/generate`,
  health: `${API_BASE_URL}/health`,
} as const;
