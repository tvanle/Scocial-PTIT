import { z } from 'zod';

const MAX_DISTANCE_KM = 500;

export const updateLocationSchema = z.object({
  latitude: z.number().min(-90, 'Latitude phải từ -90 đến 90').max(90, 'Latitude phải từ -90 đến 90'),
  longitude: z.number().min(-180, 'Longitude phải từ -180 đến 180').max(180, 'Longitude phải từ -180 đến 180'),
});

export const nearbyQuerySchema = z.object({
  distance: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'distance phải là số (km)')
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || (val > 0 && val <= MAX_DISTANCE_KM), {
      message: `distance phải từ 0 đến ${MAX_DISTANCE_KM} km`,
    }),
  page: z.string().regex(/^\d+$/, 'page phải là số').optional(),
  limit: z.string().regex(/^\d+$/, 'limit phải là số').optional(),
});

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;
