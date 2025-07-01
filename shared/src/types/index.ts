/**
 * 型定義のエントリーポイント
 */

// プロンプト関連の型
export * from './prompt';

// カテゴリ関連の型
export * from './category';

// API関連の型
export * from './api';

// ユーティリティ型
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export type DeepRequired<T> = T extends object ? {
  [P in keyof T]-?: DeepRequired<T[P]>;
} : T;

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;