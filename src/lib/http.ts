export const delay = (ms = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly url?: string
  ) {
    super(message);
  }
}

type FetchOptions = {
  delayMs?: number;
  timeoutMs?: number;
  retries?: number;
};

const withTimeout = async (url: string, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: controller.signal
  });
  clearTimeout(timer);
  return res;
};

export const fetchJson = async <T>(
  url: URL,
  { delayMs = 500, timeoutMs = 15000, retries = 1 }: FetchOptions = {}
): Promise<T> => {
  if (delayMs > 0) await delay(delayMs);

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await withTimeout(url.toString(), timeoutMs);
      if (!res.ok) {
        const body = await res.text();
        throw new ApiError(
          `요청 실패 (${res.status}) ${res.statusText}: ${body.slice(0, 300)}`,
          res.status,
          url.toString()
        );
      }
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const backoff = delayMs + attempt * 200;
        await delay(backoff);
        continue;
      }
    }
  }
  throw lastError;
};

