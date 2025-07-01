/**
 * カテゴリ関連の型定義
 */

/**
 * カテゴリマスターデータの型
 */
export interface CategoryMaster {
  /** カテゴリID */
  id: string;
  /** カテゴリ名（日本語） */
  name: string;
  /** カテゴリ名（英語） */
  nameEn: string;
  /** カテゴリ説明 */
  description: string;
  /** アイコン（絵文字またはLucideアイコン名） */
  icon: string;
  /** 表示順序 */
  order: number;
  /** アクティブフラグ */
  isActive: boolean;
}

/**
 * 詳細オプションマスターデータの型
 */
export interface DetailMaster {
  /** 詳細ID */
  id: string;
  /** 所属カテゴリID */
  categoryId: string;
  /** 詳細名（日本語） */
  name: string;
  /** 詳細名（英語） */
  nameEn: string;
  /** 詳細説明 */
  description?: string;
  /** 表示順序 */
  order: number;
  /** アクティブフラグ */
  isActive: boolean;
}

/**
 * 色マスターデータの型
 */
export interface ColorMaster {
  /** 色ID */
  id: string;
  /** 色名（日本語） */
  name: string;
  /** 色名（英語） */
  nameEn: string;
  /** 16進数カラーコード */
  hex: string;
  /** 表示順序 */
  order: number;
}

/**
 * スタイルマスターデータの型
 */
export interface StyleMaster {
  /** スタイルID */
  id: string;
  /** スタイル名（日本語） */
  name: string;
  /** スタイル名（英語） */
  nameEn: string;
  /** スタイル説明 */
  description?: string;
  /** プロンプトキーワード */
  keywords: string[];
  /** 表示順序 */
  order: number;
}

/**
 * 雰囲気マスターデータの型
 */
export interface MoodMaster {
  /** 雰囲気ID */
  id: string;
  /** 雰囲気名（日本語） */
  name: string;
  /** 雰囲気名（英語） */
  nameEn: string;
  /** アイコン（絵文字） */
  icon: string;
  /** プロンプトキーワード */
  keywords: string[];
  /** 表示順序 */
  order: number;
}

/**
 * 照明マスターデータの型
 */
export interface LightingMaster {
  /** 照明ID */
  id: string;
  /** 照明名（日本語） */
  name: string;
  /** 照明名（英語） */
  nameEn: string;
  /** アイコン（絵文字） */
  icon: string;
  /** プロンプトキーワード */
  keywords: string[];
  /** 表示順序 */
  order: number;
}

/**
 * カテゴリと詳細のマッピング型
 */
export interface CategoryDetailsMap {
  [categoryId: string]: DetailMaster[];
}