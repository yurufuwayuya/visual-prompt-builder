/**
 * API関連のユーティリティ関数
 */

import type { ApiResponse, ApiError } from '../types/api';
import { isProduction, type EnvironmentContext } from './env';

/**
 * 成功レスポンスを生成する
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * エラーレスポンスを生成する
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage = 'An error occurred',
  context?: EnvironmentContext
): ApiError {
  // 本番環境では詳細なエラーメッセージを露出させない
  const errorMessage =
    !isProduction(context) && error instanceof Error
      ? error.message
      : defaultMessage;
  
  return {
    success: false,
    error: errorMessage,
    timestamp: new Date().toISOString(),
  };
}

/**
 * タイムスタンプを生成する
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}