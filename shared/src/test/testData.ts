/**
 * 共通のテストデータ
 */

import type { PromptData, ApiPromptData, PromptGenerationOptions } from '../types/prompt';
import type { Category, CategoryDetail } from '../types/category';

/**
 * モックカテゴリーを作成
 */
export function createMockCategory(overrides?: Partial<Category>): Category {
  return {
    id: 'landscape',
    nameJa: '風景',
    nameEn: 'Landscape',
    icon: '🏞️',
    ...overrides,
  };
}

/**
 * モックカテゴリー詳細を作成
 */
export function createMockCategoryDetail(overrides?: Partial<CategoryDetail>): CategoryDetail {
  return {
    id: 'mountain',
    categoryId: 'landscape',
    predefinedId: 'mountain',
    nameJa: '山',
    nameEn: 'Mountain',
    descriptionJa: '山の風景',
    descriptionEn: 'Mountain landscape',
    keywords: ['peak', 'summit', 'ridge'],
    ...overrides,
  };
}

/**
 * モックプロンプトデータを作成
 */
export function createMockPromptData(overrides?: Partial<PromptData>): PromptData {
  return {
    id: 'test-id',
    category: {
      predefinedId: 'landscape',
      customText: null,
    },
    details: {
      predefinedIds: ['mountain'],
      customText: null,
    },
    style: {
      predefinedId: 'photographic',
      customText: null,
    },
    composition: {
      angle: 'eye_level',
      shotSize: 'medium_shot',
    },
    mood: 'peaceful',
    lighting: 'natural',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * APIプロンプトデータを作成（生成されたフィールドを除外）
 */
export function createMockApiPromptData(overrides?: Partial<ApiPromptData>): ApiPromptData {
  const promptData = createMockPromptData(overrides);
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...apiData } = promptData;
  return apiData as ApiPromptData;
}

/**
 * プロンプト生成オプションを作成
 */
export function createMockPromptOptions(
  overrides?: Partial<PromptGenerationOptions>
): PromptGenerationOptions {
  return {
    language: 'ja',
    quality: 'standard',
    includeNegativePrompt: true,
    ...overrides,
  };
}

/**
 * テスト用のサンプルカテゴリーリスト
 */
export const mockCategories: Category[] = [
  createMockCategory({ id: 'landscape', nameJa: '風景', nameEn: 'Landscape', icon: '🏞️' }),
  createMockCategory({ id: 'animal', nameJa: '動物', nameEn: 'Animal', icon: '🦁' }),
  createMockCategory({ id: 'person', nameJa: '人物', nameEn: 'Person', icon: '👤' }),
  createMockCategory({ id: 'abstract', nameJa: '抽象画', nameEn: 'Abstract', icon: '🎨' }),
];

/**
 * テスト用のサンプルカテゴリー詳細リスト
 */
export const mockCategoryDetails: CategoryDetail[] = [
  createMockCategoryDetail({
    id: 'mountain',
    categoryId: 'landscape',
    predefinedId: 'mountain',
    nameJa: '山',
    nameEn: 'Mountain',
  }),
  createMockCategoryDetail({
    id: 'ocean',
    categoryId: 'landscape',
    predefinedId: 'ocean',
    nameJa: '海',
    nameEn: 'Ocean',
  }),
  createMockCategoryDetail({
    id: 'forest',
    categoryId: 'landscape',
    predefinedId: 'forest',
    nameJa: '森',
    nameEn: 'Forest',
  }),
];
