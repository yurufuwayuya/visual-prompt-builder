/**
 * 商用利用可能な画像生成サービス連携ロジック
 */

import { ImageGenerationService } from '../config/commercialImageServices';

/**
 * プロンプトをURLエンコードして画像生成URLを作成
 */
export function generateImageUrl(service: ImageGenerationService, prompt: string): string | null {
  if (service.type !== 'url' && service.type !== 'both') {
    return null;
  }

  if (!service.urlTemplate) {
    return null;
  }

  // プロンプトをURLエンコード
  const encodedPrompt = encodeURIComponent(prompt);

  // URLテンプレートのプレースホルダーを置換
  return service.urlTemplate.replace('{prompt}', encodedPrompt);
}

/**
 * プロンプトをクリップボードにコピー
 */
export async function copyPromptToClipboard(prompt: string): Promise<boolean> {
  try {
    // Clipboard APIが利用可能かチェック
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(prompt);
      return true;
    } else {
      // フォールバック: 従来の方法
      const textArea = document.createElement('textarea');
      textArea.value = prompt;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        textArea.remove();
        return successful;
      } catch {
        textArea.remove();
        return false;
      }
    }
  } catch (err) {
    console.error('Failed to copy prompt:', err);
    return false;
  }
}

/**
 * 画像生成サービスを開く
 */
export function openImageService(service: ImageGenerationService, prompt?: string): void {
  let targetUrl: string | null = null;

  // URL連携型の場合はプロンプト付きURLを生成
  if (prompt && (service.type === 'url' || service.type === 'both')) {
    targetUrl = generateImageUrl(service, prompt);
  }

  // URL連携できない場合は通常のURLを使用
  if (!targetUrl && service.url) {
    targetUrl = service.url;
  }

  // 新しいタブで開く
  if (targetUrl) {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }
}

/**
 * プロンプトの文字数をチェック（一部のサービスには制限がある）
 */
export function checkPromptLength(prompt: string, maxLength: number = 2000): boolean {
  return prompt.length <= maxLength;
}

/**
 * ユーザーの最後に使用したサービスIDを保存
 */
export function saveLastUsedService(serviceId: string): void {
  try {
    localStorage.setItem('lastUsedImageService', serviceId);
  } catch (err) {
    console.error('Failed to save last used service:', err);
  }
}

/**
 * ユーザーの最後に使用したサービスIDを取得
 */
export function getLastUsedService(): string | null {
  try {
    return localStorage.getItem('lastUsedImageService');
  } catch (err) {
    console.error('Failed to get last used service:', err);
    return null;
  }
}
