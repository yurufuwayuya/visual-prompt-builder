import { describe, it, expect } from 'vitest';
import { generatePrompt } from '../../services/promptGenerator';
import type { ApiPromptData, PromptGenerationOptions } from '@visual-prompt-builder/shared';

describe('promptGenerator', () => {
  it('generates basic prompt with category', async () => {
    const promptData: ApiPromptData = {
      category: { predefinedId: 'person', customText: null },
      details: [],
      colors: [{ predefinedId: 'red', customText: null }],
      style: { predefinedId: 'realistic', customText: null },
      mood: { predefinedId: 'happy', customText: null },
      lighting: { predefinedId: 'natural', customText: null },
    };

    const options: PromptGenerationOptions = {
      language: 'en',
      quality: 'high',
    };

    const result = await generatePrompt(promptData, options, undefined);

    // Check that result contains expected elements (case insensitive)
    expect(result.toLowerCase()).toContain('person');
    expect(result.toLowerCase()).toContain('red');
    expect(result).toContain('photorealistic'); // Style adds keywords
    expect(result.toLowerCase()).toContain('bright');
    expect(result).toContain('natural lighting');
    expect(result).toContain('best quality');
  });

  it('includes details in the prompt', async () => {
    const promptData: ApiPromptData = {
      category: { predefinedId: 'person', customText: null },
      details: [
        { predefinedId: 'person_child', customText: null, order: 0 },
        { predefinedId: 'person_artist', customText: null, order: 1 },
      ],
      colors: [],
    };

    const options: PromptGenerationOptions = {
      language: 'en',
    };

    const result = await generatePrompt(promptData, options, undefined);

    // Check that details are included
    expect(result.toLowerCase()).toContain('child');
    expect(result.toLowerCase()).toContain('artist');
  });

  it('includes custom text when provided', async () => {
    const promptData: ApiPromptData = {
      category: { predefinedId: null, customText: 'wearing a red dress' },
      details: [],
      colors: [],
    };

    const options: PromptGenerationOptions = {
      language: 'en',
    };

    const result = await generatePrompt(promptData, options, undefined);

    expect(result).toContain('wearing a red dress');
  });

  it('generates English prompts even when language is ja', async () => {
    const promptData: ApiPromptData = {
      category: { predefinedId: 'person', customText: null },
      details: [{ predefinedId: 'person_child', customText: null, order: 0 }],
      colors: [{ predefinedId: 'red', customText: null }],
      style: { predefinedId: 'realistic', customText: null },
    };

    const options: PromptGenerationOptions = {
      language: 'ja',
    };

    const result = await generatePrompt(promptData, options, undefined);

    // Prompts are always generated in English regardless of language option
    expect(result.toLowerCase()).toContain('person');
    expect(result.toLowerCase()).toContain('child');
    expect(result.toLowerCase()).toContain('red');
    expect(result).toContain('photorealistic'); // Style adds keywords in English
  });
});
