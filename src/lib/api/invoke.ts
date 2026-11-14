import { getSupabase } from '@/lib/supabase';

export class FunctionError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
  }
}

/**
 * Call one of the app's Supabase Edge Functions and return its `data` payload.
 *
 * supabase-js reports any non-2xx reply as "Edge Function returned a non-2xx
 * status code"; the useful message is in the response body, so dig it out.
 */
export async function invokeFunction<T>(
  name: string,
  body: Record<string, unknown>,
  label: string
): Promise<T> {
  const { data, error } = await getSupabase().functions.invoke(name, { body });

  if (error) {
    let message: string | null = null;
    let code: string | undefined;
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      if (context.status === 404) message = `the "${name}" function is not deployed`;
      try {
        const payload = await context.clone().json();
        if (payload && typeof payload.error === 'string') message = payload.error;
        if (payload && typeof payload.code === 'string') code = payload.code;
      } catch {
        // body was not JSON; keep whatever we have
      }
    }
    throw new FunctionError(message ?? `${label} is unavailable right now`, code);
  }

  if (!data || data.success === false) {
    throw new Error((data && data.error) || `${label} request failed`);
  }
  return data.data as T;
}
