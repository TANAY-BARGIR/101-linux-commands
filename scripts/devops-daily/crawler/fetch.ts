import axios from 'axios';

/**
 * Fetch URL with retry logic
 */
export async function fetchWithRetry(
  url: string,
  maxRetries: number = 3,
  timeout: number = 10000
): Promise<string> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url, {
        timeout,
        headers: {
          'User-Agent': 'DevOps Daily News Crawler/1.0',
        },
      });
      return response.data;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${i + 1}/${maxRetries} failed for ${url}: ${error}`);

      if (i < maxRetries - 1) {
        // Exponential backoff
        await sleep(Math.pow(2, i) * 1000);
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${url}`);
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if URL is accessible
 */
export async function isUrlAccessible(url: string): Promise<boolean> {
  try {
    await fetchWithRetry(url, 1, 5000);
    return true;
  } catch {
    return false;
  }
}
