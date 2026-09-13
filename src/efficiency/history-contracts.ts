import { z } from 'zod';

export const sanitizedAiSourceSchema = z.enum([
  'CHATGPT',
  'CLAUDE',
  'OTHER',
]);

export const sanitizedAiRoleSchema = z.enum([
  'USER',
  'ASSISTANT',
  'SYSTEM',
  'TOOL',
]);

export const sanitizedAiMessageSchema = z
  .object({
    source: sanitizedAiSourceSchema,
    conversationId: z.string().min(1).max(256),
    messageId: z.string().min(1).max(256),
    createdAt: z.string().datetime({ offset: true }),
    role: sanitizedAiRoleSchema,
    content: z.string().min(1).max(100_000),
    model: z.string().min(1).max(256).nullable(),
  })
  .strict();

export type SanitizedAiMessage = z.infer<typeof sanitizedAiMessageSchema>;

export const sanitizedAiExportSchema = z
  .object({
    schemaVersion: z.literal('sanitized-ai-export-v1'),
    exportedAt: z.string().datetime({ offset: true }),
    messages: z.array(sanitizedAiMessageSchema).min(1).max(100_000),
  })
  .strict();

export type SanitizedAiExport = z.infer<typeof sanitizedAiExportSchema>;
