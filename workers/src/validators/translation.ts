/**
 * 翻訳関連のバリデーションスキーマ
 */

import { z } from 'zod';

// 翻訳リクエストのバリデーションスキーマ
export const translationSchema = z.object({
  text: z.string().min(1).max(1000),
  sourceLang: z.enum(['ja', 'en']),
  targetLang: z.enum(['ja', 'en']),
});