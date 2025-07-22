import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateImageUrl,
  checkPromptLength,
  saveLastUsedService,
  getLastUsedService,
} from './commercialImageGeneration';
import { ImageGenerationService } from '../config/commercialImageServices';

describe('commercialImageGeneration', () => {
  beforeEach(() => {
    // localStorageのモック
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = localStorageMock as any;
  });

  describe('generateImageUrl', () => {
    it('URL型サービスでプロンプト付きURLを生成する', () => {
      const service: ImageGenerationService = {
        id: 'test',
        name: 'Test Service',
        type: 'url',
        urlTemplate: 'https://example.com/generate?prompt={prompt}',
        instructions: 'Test',
        instructionsEn: 'Test',
        freeInfo: 'Free',
        freeInfoEn: 'Free',
        commercialUse: true,
      };

      const prompt = 'a beautiful sunset';
      const result = generateImageUrl(service, prompt);

      expect(result).toBe('https://example.com/generate?prompt=a%20beautiful%20sunset');
    });

    it('両対応型サービスでプロンプト付きURLを生成する', () => {
      const service: ImageGenerationService = {
        id: 'test',
        name: 'Test Service',
        type: 'both',
        urlTemplate: 'https://example.com/{prompt}',
        url: 'https://example.com',
        instructions: 'Test',
        instructionsEn: 'Test',
        freeInfo: 'Free',
        freeInfoEn: 'Free',
        commercialUse: true,
      };

      const prompt = '日本語プロンプト';
      const result = generateImageUrl(service, prompt);

      expect(result).toBe(
        'https://example.com/%E6%97%A5%E6%9C%AC%E8%AA%9E%E3%83%97%E3%83%AD%E3%83%B3%E3%83%97%E3%83%88'
      );
    });

    it('コピー型サービスではnullを返す', () => {
      const service: ImageGenerationService = {
        id: 'test',
        name: 'Test Service',
        type: 'copy',
        url: 'https://example.com',
        instructions: 'Test',
        instructionsEn: 'Test',
        freeInfo: 'Free',
        freeInfoEn: 'Free',
        commercialUse: true,
      };

      const result = generateImageUrl(service, 'test prompt');
      expect(result).toBeNull();
    });

    it('URLテンプレートがない場合はnullを返す', () => {
      const service: ImageGenerationService = {
        id: 'test',
        name: 'Test Service',
        type: 'url',
        instructions: 'Test',
        instructionsEn: 'Test',
        freeInfo: 'Free',
        freeInfoEn: 'Free',
        commercialUse: true,
      };

      const result = generateImageUrl(service, 'test prompt');
      expect(result).toBeNull();
    });
  });

  describe('checkPromptLength', () => {
    it('制限内のプロンプトはtrueを返す', () => {
      const prompt = 'This is a short prompt';
      expect(checkPromptLength(prompt)).toBe(true);
    });

    it('長すぎるプロンプトはfalseを返す', () => {
      const longPrompt = 'a'.repeat(2001);
      expect(checkPromptLength(longPrompt)).toBe(false);
    });

    it('カスタム制限を指定できる', () => {
      const prompt = 'This is a test prompt';
      expect(checkPromptLength(prompt, 10)).toBe(false);
      expect(checkPromptLength(prompt, 100)).toBe(true);
    });
  });

  describe('saveLastUsedService', () => {
    it('サービスIDをlocalStorageに保存する', () => {
      saveLastUsedService('pollinations');
      expect(localStorage.setItem).toHaveBeenCalledWith('lastUsedImageService', 'pollinations');
    });
  });

  describe('getLastUsedService', () => {
    it('localStorageからサービスIDを取得する', () => {
      (localStorage.getItem as any).mockReturnValue('chatgpt');
      const result = getLastUsedService();
      expect(result).toBe('chatgpt');
      expect(localStorage.getItem).toHaveBeenCalledWith('lastUsedImageService');
    });

    it('エラー時はnullを返す', () => {
      // console.errorをモック
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (localStorage.getItem as any).mockImplementation(() => {
        throw new Error('Storage error');
      });
      const result = getLastUsedService();
      expect(result).toBeNull();

      // console.errorが呼ばれたことを確認
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to get last used service:',
        expect.any(Error)
      );

      // モックをリセット
      consoleErrorSpy.mockRestore();
    });
  });
});
