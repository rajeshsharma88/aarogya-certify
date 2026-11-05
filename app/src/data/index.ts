import type { DataProvider } from './DataProvider';
import { LocalProvider } from './local/LocalProvider';
import { SupabaseProvider } from './supabase/SupabaseProvider';

function createProvider(): DataProvider {
  const backend = import.meta.env.VITE_DATA_BACKEND ?? 'local';
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (backend === 'supabase' && url && key) {
    return new SupabaseProvider(url, key);
  }
  if (backend === 'supabase') {
    console.warn('[Aarogya] VITE_DATA_BACKEND=supabase but URL/key missing — using local backend.');
  }
  return new LocalProvider();
}

export const provider: DataProvider = createProvider();
export const usingLocalBackend = provider instanceof LocalProvider;
export type { DataProvider };
