export const API_BASE_URL = import.meta.env.PROD
  ? 'https://visual-prompt-builder-api.yuya-kitamori.workers.dev'
  : 'http://localhost:8787';

export const API_ENDPOINTS = {
  generatePrompt: `${API_BASE_URL}/api/v1/prompt/generate`,
  translatePrompt: `${API_BASE_URL}/api/v1/translate`,
  health: `${API_BASE_URL}/health`,
} as const;
