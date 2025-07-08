/**
 * プロンプト関連の型定義
 */

/**
 * カテゴリ選択の型
 */
export interface CategorySelection {
  /** 事前定義されたカテゴリID */
  predefinedId?: string;
  /** カテゴリ名 */
  name: string;
  /** カテゴリ名（英語） */
  nameEn?: string;
  /** カスタムカテゴリの場合のテキスト */
  customText?: string;
}

/**
 * 詳細選択の型
 */
export interface DetailSelection {
  /** 事前定義された詳細ID */
  predefinedId: string;
  /** 詳細名 */
  name: string;
  /** 詳細名（英語） */
  nameEn?: string;
  /** 選択順序（1から始まる） */
  order?: number;
}

/**
 * 色選択の型
 */
export interface ColorSelection {
  /** 事前定義された色ID */
  predefinedId: string;
  /** 色名 */
  name: string;
  /** 色名（英語） */
  nameEn?: string;
  /** 16進数カラーコード */
  hex: string;
}

/**
 * スタイル選択の型
 */
export interface StyleSelection {
  /** 事前定義されたスタイルID */
  predefinedId: string;
  /** スタイル名 */
  name: string;
  /** スタイル名（英語） */
  nameEn?: string;
}

/**
 * 雰囲気選択の型
 */
export interface MoodSelection {
  /** 事前定義された雰囲気ID */
  predefinedId: string;
  /** 雰囲気名 */
  name: string;
  /** 雰囲気名（英語） */
  nameEn?: string;
}

/**
 * 照明選択の型
 */
export interface LightingSelection {
  /** 事前定義された照明ID */
  predefinedId: string;
  /** 照明名 */
  name: string;
  /** 照明名（英語） */
  nameEn?: string;
}

/**
 * API用の選択項目の基本型
 * predefinedIdまたはcustomTextのいずれかを持つ
 */
export interface ApiSelectionItem {
  /** 事前定義されたID */
  predefinedId: string | null;
  /** カスタムテキスト */
  customText: string | null;
}

/**
 * API用の詳細選択項目
 */
export interface ApiDetailSelectionItem extends ApiSelectionItem {
  /** 選択順序 */
  order: number;
}

/**
 * API用のプロンプトデータ型
 */
export interface ApiPromptData {
  /** カテゴリ選択 */
  category: ApiSelectionItem;
  /** 詳細選択 */
  details: ApiDetailSelectionItem[];
  /** 色選択 */
  colors: ApiSelectionItem[];
  /** スタイル選択 */
  style?: ApiSelectionItem;
  /** 雰囲気選択 */
  mood?: ApiSelectionItem;
  /** 照明選択 */
  lighting?: ApiSelectionItem;
}

/**
 * プロンプト全体のデータ型
 */
export interface PromptData {
  /** 一意のID */
  id: string;
  /** カテゴリ選択 */
  category: CategorySelection;
  /** 詳細選択（最大5個） */
  details: DetailSelection[];
  /** 色選択 */
  colors: ColorSelection[];
  /** スタイル選択 */
  style?: StyleSelection;
  /** 雰囲気選択 */
  mood?: MoodSelection;
  /** 照明選択 */
  lighting?: LightingSelection;
  /** 生成されたプロンプト（英語） */
  generatedPrompt?: string;
  /** 生成されたプロンプト（日本語） */
  generatedPromptJa?: string;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * プロンプト生成オプション
 */
export interface PromptGenerationOptions {
  /** 品質向上キーワードを追加するか */
  enhanceQuality?: boolean;
  /** 出力言語 */
  language: 'ja' | 'en';
  /** 品質設定 */
  quality?: 'draft' | 'standard' | 'high';
  /** スタイル設定 */
  style?: 'realistic' | 'artistic' | 'anime';
}

/**
 * 品質レベルに対応するキーワード
 */
export const QUALITY_KEYWORDS = {
  draft: ['quick sketch', 'rough'],
  standard: ['good quality', 'well composed'],
  high: ['best quality', 'ultra detailed', '8k', 'photorealistic'],
} as const;
