/**
 * API通信関連の型定義
 */

/**
 * APIレスポンスの基本型
 */
export interface ApiResponse<T> {
  /** 成功フラグ */
  success: boolean;
  /** レスポンスデータ */
  data?: T;
  /** エラーメッセージ */
  error?: string;
  /** エラーコード */
  errorCode?: string;
  /** タイムスタンプ */
  timestamp: string;
}

/**
 * 翻訳APIリクエストの型
 */
export interface TranslationRequest {
  /** 翻訳するテキスト */
  text: string;
  /** ソース言語 */
  sourceLang: 'ja' | 'en';
  /** ターゲット言語 */
  targetLang: 'ja' | 'en';
}

/**
 * 翻訳APIレスポンスの型
 */
export interface TranslationResponse {
  /** 翻訳されたテキスト */
  translatedText: string;
  /** 検出された言語 */
  detectedLanguage?: string;
  /** 信頼度スコア */
  confidence?: number;
}

/**
 * プロンプト生成APIリクエストの型
 */
export interface GeneratePromptRequest {
  /** プロンプトデータ（カテゴリ、詳細など） */
  promptData: Omit<import('./prompt').PromptData, 'id' | 'createdAt' | 'updatedAt' | 'generatedPrompt' | 'generatedPromptJa' | 'negativePrompt'>;
  /** 生成オプション */
  options: import('./prompt').PromptGenerationOptions;
}

/**
 * プロンプト生成APIレスポンスの型
 */
export interface GeneratePromptResponse {
  /** 生成されたプロンプト（指定言語） */
  prompt: string;
  /** ネガティブプロンプト（オプション） */
  negativePrompt?: string;
  /** 使用されたキーワード */
  usedKeywords: string[];
  /** 生成にかかった時間（ミリ秒） */
  generationTime: number;
}

/**
 * エラーレスポンスの型
 */
export interface ErrorResponse {
  /** HTTPステータスコード */
  statusCode: number;
  /** エラーメッセージ */
  message: string;
  /** エラーコード（アプリケーション固有） */
  code: string;
  /** 詳細情報 */
  details?: Record<string, unknown>;
}

/**
 * APIエラーレスポンスの型
 */
export interface ApiError {
  /** 成功フラグ（常にfalse） */
  success: false;
  /** エラーメッセージ */
  error: string;
  /** タイムスタンプ */
  timestamp: string;
}

/**
 * ページネーションパラメータ
 */
export interface PaginationParams {
  /** ページ番号（1から始まる） */
  page: number;
  /** 1ページあたりのアイテム数 */
  limit: number;
  /** ソートフィールド */
  sortBy?: string;
  /** ソート順序 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * ページネーションレスポンス
 */
export interface PaginatedResponse<T> {
  /** データ配列 */
  items: T[];
  /** 総アイテム数 */
  total: number;
  /** 現在のページ */
  page: number;
  /** 1ページあたりのアイテム数 */
  limit: number;
  /** 総ページ数 */
  totalPages: number;
  /** 次のページがあるか */
  hasNext: boolean;
  /** 前のページがあるか */
  hasPrev: boolean;
}