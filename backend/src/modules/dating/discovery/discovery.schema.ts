import { z } from 'zod';

export const discoveryQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'page phải là số').optional(),
  limit: z.string().regex(/^\d+$/, 'limit phải là số').optional(),
});

export type DiscoveryQuery = z.infer<typeof discoveryQuerySchema>;
