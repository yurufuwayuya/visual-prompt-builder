import type { Category, CategoryDetail, PromptData } from '@visual-prompt-builder/shared';

/**
 * Test data factory functions
 */

export const createMockCategory = (overrides?: Partial<Category>): Category => ({
  id: 'people',
  name: '人物',
  nameEn: 'People',
  description: '人物・キャラクターのプロンプト',
  order: 1,
  ...overrides,
});

export const createMockCategoryDetail = (
  overrides?: Partial<CategoryDetail>
): CategoryDetail => ({
  id: 'people-001',
  categoryId: 'people',
  predefinedId: 'young-woman',
  displayName: '若い女性',
  displayNameEn: 'Young Woman',
  promptJa: '若い女性',
  promptEn: 'young woman',
  order: 1,
  ...overrides,
});

export const createMockPromptData = (overrides?: Partial<PromptData>): PromptData => ({
  category: {
    predefinedId: 'people',
  },
  details: [
    { predefinedId: 'young-woman' },
    { predefinedId: 'casual-style' },
  ],
  style: {
    color: { predefinedId: 'vivid' },
    style: { predefinedId: 'photorealistic' },
    mood: { predefinedId: 'cheerful' },
    lighting: { predefinedId: 'natural' },
    framing: { predefinedId: 'medium-shot' },
  },
  customPrompt: '',
  negativePrompt: '',
  language: 'ja',
  ...overrides,
});

export const mockCategories: Category[] = [
  createMockCategory({
    id: 'people',
    name: '人物',
    nameEn: 'People',
    order: 1,
  }),
  createMockCategory({
    id: 'animals',
    name: '動物',
    nameEn: 'Animals',
    order: 2,
  }),
  createMockCategory({
    id: 'food',
    name: '食べ物',
    nameEn: 'Food',
    order: 3,
  }),
];

export const mockCategoryDetails: CategoryDetail[] = [
  createMockCategoryDetail({
    id: 'people-001',
    categoryId: 'people',
    predefinedId: 'young-woman',
    displayName: '若い女性',
    displayNameEn: 'Young Woman',
    order: 1,
  }),
  createMockCategoryDetail({
    id: 'people-002',
    categoryId: 'people',
    predefinedId: 'young-man',
    displayName: '若い男性',
    displayNameEn: 'Young Man',
    order: 2,
  }),
  createMockCategoryDetail({
    id: 'animals-001',
    categoryId: 'animals',
    predefinedId: 'cat',
    displayName: '猫',
    displayNameEn: 'Cat',
    order: 1,
  }),
];