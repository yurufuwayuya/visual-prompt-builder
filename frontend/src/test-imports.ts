/**
 * テスト用インポートファイル
 * shared パッケージからのインポートが正しく動作するかテスト
 */

import {
  // 型定義
  PromptData,
  CategoryMaster as _CategoryMaster,
  DetailMaster as _DetailMaster,
  ColorMaster as _ColorMaster,
  StyleMaster as _StyleMaster,
  MoodMaster as _MoodMaster,
  LightingMaster as _LightingMaster,
  ApiResponse as _ApiResponse,
  TranslationRequest as _TranslationRequest,
  TranslationResponse as _TranslationResponse,
  
  // 定数
  CATEGORIES,
  CATEGORY_DETAILS,
  COLORS,
  STYLES,
  MOODS,
  LIGHTINGS,
  
  // ヘルパー関数
  getCategoryById,
  getDetailsByCategoryId,
  getColorById,
  getStyleById,
  getMoodById,
  getLightingById,
} from '@visual-prompt-builder/shared';

// 型のテスト
const _testPromptData: PromptData = {
  id: 'test-id',
  category: {
    predefinedId: 'landscape',
    customText: null,
  },
  details: [],
  colors: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/* eslint-disable no-console */

// 定数のテスト
console.log('Categories count:', CATEGORIES.length);
console.log('First category:', CATEGORIES[0]);
console.log('Details count:', CATEGORY_DETAILS.length);
console.log('Colors count:', COLORS.length);
console.log('Styles count:', STYLES.length);
console.log('Moods count:', MOODS.length);
console.log('Lightings count:', LIGHTINGS.length);

// ヘルパー関数のテスト
const landscape = getCategoryById('landscape');
console.log('Landscape category:', landscape);

const landscapeDetails = getDetailsByCategoryId('landscape');
console.log('Landscape details count:', landscapeDetails.length);

const red = getColorById('red');
console.log('Red color:', red);

const realistic = getStyleById('realistic');
console.log('Realistic style:', realistic);

const happy = getMoodById('happy');
console.log('Happy mood:', happy);

const natural = getLightingById('natural');
console.log('Natural lighting:', natural);

console.log('✅ All imports successful!');

/* eslint-enable no-console */