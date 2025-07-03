/**
 * プロンプト生成で使用するキーワード定数
 */

/**
 * 基本的なネガティブプロンプトキーワード
 * 2024-2025のベストプラクティスに基づく最小限で効果的なセット
 */
export const BASE_NEGATIVE_KEYWORDS = [
  // コア品質問題（最重要）
  'ugly',
  'disfigured',
  'deformed',
  'bad anatomy',
  'bad proportions',

  // 品質関連
  'low quality',
  'worst quality',
  'blurry',
  'overexposed',
  'underexposed',

  // 解剖学的問題（人物の場合に重要）
  'extra limbs',
  'missing limbs',
  'bad hands',
  'mutated hands',
  'poorly drawn face',

  // メタ要素の除外
  'watermark',
  'signature',
  'text',
] as const;

/**
 * スタイル別のネガティブキーワード
 */
export const STYLE_NEGATIVE_KEYWORDS = {
  realistic: ['cartoon', 'anime', '3d render', 'drawing', 'painting', 'illustration'],
  anime: ['realistic', 'photorealistic', '3d', 'photograph'],
  artistic: [],
} as const;

/**
 * カテゴリ別のネガティブキーワード
 * カテゴリ固有の問題に絞った最小限のセット
 */
export const CATEGORY_NEGATIVE_KEYWORDS = {
  person: ['bad face', 'bad eyes', 'cross eyed'],
  landscape: ['people', 'person', 'human'],
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
