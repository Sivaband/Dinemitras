/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not found in environment configuration. Using safe in-memory mock fallback.");
  
  const mockSupabase = {
    from: (table: string) => {
      const chain: any = () => Promise.resolve({ data: [], error: null });
      chain.select = () => chain;
      chain.insert = () => chain;
      chain.update = () => chain;
      chain.delete = () => chain;
      chain.eq = () => chain;
      chain.neq = () => chain;
      chain.then = (onfulfilled: any) => Promise.resolve({ data: [], error: null }).then(onfulfilled);
      return chain;
    },
    channel: (name: string) => {
      const channelMock: any = {
        on: (event: string, filter: any, callback: any) => {
          return channelMock;
        },
        subscribe: () => {
          return channelMock;
        }
      };
      return channelMock;
    },
    removeChannel: (channel: any) => {
      return Promise.resolve();
    },
    auth: {
      signInWithPassword: async () => {
        throw new Error("Supabase is not configured. Falling back to local authentication.");
      },
      signUp: async () => {
        throw new Error("Supabase is not configured. Falling back to local signup.");
      },
      signOut: async () => {
        return { error: null };
      },
      updateUser: async () => {
        return { data: { user: {} }, error: null };
      }
    }
  };
  supabaseInstance = mockSupabase;
} else {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;

