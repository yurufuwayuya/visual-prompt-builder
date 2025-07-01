/**
 * プロンプト関連のバリデーションスキーマ
 */

import { z } from 'zod';

// プロンプト生成リクエストのバリデーションスキーマ
export const generatePromptSchema = z.object({
  promptData: z.object({
    category: z.object({
      predefinedId: z.string().nullable(),
      customText: z.string().nullable().optional(),
    }),
    details: z.array(
      z.object({
        predefinedId: z.string().nullable(),
        customText: z.string().nullable().optional(),
        order: z.number(),
      })
    ),
    colors: z.array(
      z.object({
        predefinedId: z.string().nullable(),
        customText: z.string().nullable().optional(),
      })
    ),
    style: z
      .object({
        predefinedId: z.string().nullable(),
        customText: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
    mood: z
      .object({
        predefinedId: z.string().nullable(),
        customText: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
    lighting: z
      .object({
        predefinedId: z.string().nullable(),
        customText: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
  }),
  options: z.object({
    language: z.enum(['ja', 'en']),
    quality: z.enum(['draft', 'standard', 'high']).optional(),
    style: z.enum(['realistic', 'artistic', 'anime']).optional(),
    includeNegativePrompt: z.boolean().optional(),
  }),
});
