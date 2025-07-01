/**
 * プロンプト関連のバリデーションスキーマ
 */

import { z } from 'zod';

// 共通のプロンプトアイテムスキーマ
const promptItemSchema = z.object({
  predefinedId: z.string().nullable(),
  customText: z.string().nullable().optional(),
});

// 順序付きプロンプトアイテムスキーマ
const promptItemWithOrderSchema = promptItemSchema.extend({
  order: z.number(),
});

// プロンプト生成リクエストのバリデーションスキーマ
export const generatePromptSchema = z.object({
  promptData: z.object({
    category: promptItemSchema,
    details: z.array(promptItemWithOrderSchema),
    colors: z.array(promptItemSchema),
    style: promptItemSchema.nullable().optional(),
    mood: promptItemSchema.nullable().optional(),
    lighting: promptItemSchema.nullable().optional(),
  }),
  options: z.object({
    language: z.enum(['ja', 'en']),
    quality: z.enum(['draft', 'standard', 'high']).optional(),
    style: z.enum(['realistic', 'artistic', 'anime']).optional(),
    includeNegativePrompt: z.boolean().optional(),
  }),
});
