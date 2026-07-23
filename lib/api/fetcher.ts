export async function fetchWithRetry(url: string, retries: number = 2, delayMs: number = 1000): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 3600 }
      });

      // Handle Jikan 504 or 429 errors
      if (res.status === 504 || res.status === 429) {
        if (i < retries) {
          console.warn(`[fetchWithRetry] Received HTTP ${res.status} for ${url}. Retrying attempt ${i + 1}/${retries}...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1))); // Exponential backoff
          continue;
        }
      }

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.message || `HTTP Error ${res.status}`);
      }

      return res.json();
    } catch (err: any) {
      if (i === retries) throw err;
      console.warn(`[fetchWithRetry] Error fetching ${url}: ${err?.message || err}. Retrying attempt ${i + 1}/${retries}...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
    }
  }
}
