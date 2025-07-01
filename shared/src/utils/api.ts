/**
 * API関連のユーティリティ関数
 */

import type { ApiResponse, ApiError } from '../types/api';

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
  defaultMessage = 'An error occurred'
): ApiError {
  const errorMessage = error instanceof Error ? error.message : defaultMessage;
  
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