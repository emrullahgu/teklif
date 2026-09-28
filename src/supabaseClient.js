import { createClient } from '@supabase/supabase-js';

// Supabase bağlantı bilgileri
// Adres ve anahtar Netlify ortam degiskenlerinden gelir (Site settings > Environment variables)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanimli olmali');
}

// Normal client (anon key ile) - Okuma ve auth için
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-bordro-client': 'web'
    }
  }
});


// Kullanıcı tablosu şeması:
// CREATE TABLE users (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   email TEXT UNIQUE NOT NULL,
//   password TEXT NOT NULL,
//   name TEXT,
//   company TEXT,
//   role TEXT DEFAULT 'user',
//   approved BOOLEAN DEFAULT false,
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//   created_by TEXT,
//   updated_by TEXT
// );

// Sunucu durum kontrolu (SunucuDurumu.jsx) icin
export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;
