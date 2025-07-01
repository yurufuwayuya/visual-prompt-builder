/**
 * プロンプト生成で使用するキーワード定数
 */

/**
 * 基本的なネガティブプロンプトキーワード
 */
export const BASE_NEGATIVE_KEYWORDS = [
  // 基本的な品質問題
  'worst quality',
  'low quality',
  'normal quality',
  'lowres',
  'low resolution',
  'bad anatomy',
  'bad hands',
  'error',
  'missing fingers',
  'extra digit',
  'fewer digits',
  'cropped',
  'jpeg artifacts',
  'signature',
  'watermark',
  'username',
  'blurry',
  'bad feet',
  'poorly drawn hands',
  'poorly drawn face',
  'mutation',
  'deformed',
  'ugly',
  'bad proportions',
  'extra limbs',
  'cloned face',
  'disfigured',
  'gross proportions',
  'malformed limbs',
  'missing arms',
  'missing legs',
  'extra arms',
  'extra legs',
  'mutated hands',
  'fused fingers',
  'too many fingers',
  'long neck',
] as const;

/**
 * スタイル別のネガティブキーワード
 */
export const STYLE_NEGATIVE_KEYWORDS = {
  realistic: [
    'cartoon',
    'anime',
    '3d render',
    'drawing',
    'painting',
    'illustration',
  ],
  anime: [
    'realistic',
    'photorealistic',
    '3d',
    'photograph',
  ],
  artistic: [],
} as const;

/**
 * カテゴリ別のネガティブキーワード
 */
export const CATEGORY_NEGATIVE_KEYWORDS = {
  person: [
    'bad face',
    'bad eyes',
    'cross eyed',
    'malformed face',
  ],
  landscape: [
    'people',
    'person',
    'human',
    'character',
  ],
} as const;


/**
 * ネガティブプロンプトを生成するヘルパー関数
 */
export function buildNegativePrompt(
  style?: keyof typeof STYLE_NEGATIVE_KEYWORDS,
  category?: keyof typeof CATEGORY_NEGATIVE_KEYWORDS
): string[] {
  const keywords: string[] = [...BASE_NEGATIVE_KEYWORDS];
  
  if (style && STYLE_NEGATIVE_KEYWORDS[style]) {
    keywords.push(...(STYLE_NEGATIVE_KEYWORDS[style] as readonly string[]));
  }
  
  if (category && CATEGORY_NEGATIVE_KEYWORDS[category]) {
    keywords.push(...(CATEGORY_NEGATIVE_KEYWORDS[category] as readonly string[]));
  }
  
  // 重複を削除
  return [...new Set(keywords)];
}