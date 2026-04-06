import { API_CONFIG } from '../constants/api';

/**
 * Converts a relative URL to a full URL
 * Handles both relative URLs (/uploads/xxx.jpg) and full URLs (http://...)
 */
export const getImageUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;

  // Already a full URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Relative URL - prepend base URL
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, '');
  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
};

/**
 * Get image URL with a fallback
 */
export const getImageUrlWithFallback = (
  url: string | null | undefined,
  fallback: string
): string => {
  const imageUrl = getImageUrl(url);
  return imageUrl || fallback;
};
