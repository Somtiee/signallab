
interface FetchOptions extends RequestInit {
  retries?: number;
  backoff?: number;
}

export async function fetchWithRetry(url: string, options: FetchOptions = {}): Promise<Response> {
  const { retries = 3, backoff = 1000, ...fetchOptions } = options;

  try {
    const res = await fetch(url, fetchOptions);

    if (res.ok) {
      return res;
    }

    // If we have retries left and it's a retryable error
    if (retries > 0 && (res.status === 408 || res.status === 429 || res.status >= 500)) {
      const retryAfterHeader = res.headers.get('Retry-After');
      let waitTime = backoff;

      if (res.status === 429 && retryAfterHeader) {
        waitTime = parseInt(retryAfterHeader, 10) * 1000;
      } else {
        // Exponential backoff with jitter
        waitTime = backoff * Math.pow(2, 3 - retries) + Math.random() * 100;
      }

      console.warn(`Request failed with ${res.status}. Retrying in ${waitTime}ms... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));

      return fetchWithRetry(url, { ...options, retries: retries - 1 });
    }

    return res;
  } catch (error) {
    if (retries > 0) {
      const waitTime = backoff * Math.pow(2, 3 - retries) + Math.random() * 100;
      console.warn(`Request failed with error. Retrying in ${waitTime}ms... (${retries} left)`, error);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return fetchWithRetry(url, { ...options, retries: retries - 1 });
    }
    throw error;
  }
}
