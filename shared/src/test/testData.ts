/**
 * 共通のテストデータ
 */

import type { PromptData, ApiPromptData, PromptGenerationOptions } from '../types/prompt';
import type { CategoryMaster, DetailMaster } from '../types/category';

/**
 * モックカテゴリーを作成
 */
export function createMockCategory(overrides?: Partial<CategoryMaster>): CategoryMaster {
  return {
    id: 'landscape',
    name: '風景',
    nameEn: 'Landscape',
    description: '風景カテゴリ',
    icon: '🏞️',
    order: 1,
    isActive: true,
    ...overrides,
  };
}

/**
 * モックカテゴリー詳細を作成
 */
export function createMockCategoryDetail(overrides?: Partial<DetailMaster>): DetailMaster {
  return {
    id: 'mountain',
    categoryId: 'landscape',
    name: '山',
    nameEn: 'Mountain',
    description: '山の風景',
    order: 1,
    isActive: true,
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
      name: '風景',
      nameEn: 'Landscape',
    },
    details: [
      {
        predefinedId: 'mountain',
        name: '山',
        nameEn: 'Mountain',
        order: 1,
      },
    ],
    style: {
      predefinedId: 'photographic',
      name: '写真的',
      nameEn: 'Photographic',
    },
    mood: {
      predefinedId: 'peaceful',
      name: '平和的',
      nameEn: 'Peaceful',
    },
    lighting: {
      predefinedId: 'natural',
      name: '自然光',
      nameEn: 'Natural Light',
    },
    colors: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * APIプロンプトデータを作成（生成されたフィールドを除外）
 */
export function createMockApiPromptData(overrides?: Partial<ApiPromptData>): ApiPromptData {
  return {
    category: {
      predefinedId: 'landscape',
      customText: null,
    },
    details: [
      {
        predefinedId: 'mountain',
        customText: null,
        order: 1,
      },
    ],
    colors: [],
    style: {
      predefinedId: 'photographic',
      customText: null,
    },
    mood: {
      predefinedId: 'peaceful',
      customText: null,
    },
    lighting: {
      predefinedId: 'natural',
      customText: null,
    },
    ...overrides,
  };
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
    ...overrides,
  };
}

/**
 * テスト用のサンプルカテゴリーリスト
 */
export const mockCategories: CategoryMaster[] = [
  createMockCategory({ id: 'landscape', name: '風景', nameEn: 'Landscape', icon: '🏞️' }),
  createMockCategory({ id: 'animal', name: '動物', nameEn: 'Animal', icon: '🦁' }),
  createMockCategory({ id: 'person', name: '人物', nameEn: 'Person', icon: '👤' }),
  createMockCategory({ id: 'abstract', name: '抽象画', nameEn: 'Abstract', icon: '🎨' }),
];

/**
 * テスト用のサンプルカテゴリー詳細リスト
 */
export const mockCategoryDetails: DetailMaster[] = [
  createMockCategoryDetail({
    id: 'mountain',
    categoryId: 'landscape',
    name: '山',
    nameEn: 'Mountain',
  }),
  createMockCategoryDetail({
    id: 'ocean',
    categoryId: 'landscape',
    name: '海',
    nameEn: 'Ocean',
  }),
  createMockCategoryDetail({
    id: 'forest',
    categoryId: 'landscape',
    name: '森',
    nameEn: 'Forest',
  }),
];
