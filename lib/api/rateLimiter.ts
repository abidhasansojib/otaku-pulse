type QueueItem<T> = {
  fn: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  retries: number;
};

class RateLimiterQueue {
  private queue: QueueItem<any>[] = [];
  private activeCount = 0;
  private maxPerSecond = 3;
  private requestTimestamps: number[] = [];
  private cache = new Map<string, Promise<any>>();

  public async enqueue<T>(url: string, fetchFn: () => Promise<T>, maxRetries = 3): Promise<T> {
    // Return existing cached promise if request is currently pending
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    const promise = new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn: fetchFn,
        resolve,
        reject,
        retries: maxRetries,
      });
      this.processQueue();
    }).finally(() => {
      this.cache.delete(url);
    });

    this.cache.set(url, promise);
    return promise;
  }

  private async processQueue() {
    if (this.queue.length === 0) return;

    const now = Date.now();
    // Keep only timestamps from the last 1000ms
    this.requestTimestamps = this.requestTimestamps.filter((t) => now - t < 1000);

    if (this.requestTimestamps.length >= this.maxPerSecond) {
      const oldest = this.requestTimestamps[0];
      const waitTime = Math.max(100, 1000 - (now - oldest));
      setTimeout(() => this.processQueue(), waitTime);
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.requestTimestamps.push(Date.now());
    this.activeCount++;

    try {
      const result = await item.fn();
      item.resolve(result);
    } catch (err: any) {
      // If 429 Rate Limit error, re-queue with backoff delay
      const is429 = err?.status === 429 || (err?.message && err.message.includes('429'));
      if (is429 && item.retries > 0) {
        const backoffDelay = (4 - item.retries) * 1500; // 1.5s, 3s, 4.5s
        console.warn(`[RateLimiter] HTTP 429 hit. Retrying in ${backoffDelay}ms... (${item.retries} retries left)`);
        setTimeout(() => {
          this.queue.unshift({
            ...item,
            retries: item.retries - 1,
          });
          this.processQueue();
        }, backoffDelay);
      } else {
        item.reject(err);
      }
    } finally {
      this.activeCount--;
      this.processQueue();
    }
  }
}

export const rateLimiter = new RateLimiterQueue();

export async function rateLimitedFetch<T>(url: string, options?: RequestInit): Promise<T> {
  return rateLimiter.enqueue(url, async () => {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const error: any = new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      error.status = res.status;
      throw error;
    }

    const data = await res.json();
    return data as T;
  });
}
