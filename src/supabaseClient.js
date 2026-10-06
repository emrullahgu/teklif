import { createClient } from '@supabase/supabase-js';

// Supabase bağlantı bilgileri
// Adres ve anahtar Netlify ortam degiskenlerinden gelir (Site settings > Environment variables)
// VITE_SB_YOL tanimliysa (netlify.toml, ornek "/sb") tarayici sunucuya sitenin KENDI adresinden
// ulasir: https://<site>/sb/... Netlify bu yolu sunucuya iletir (netlify.toml [[redirects]]).
// Boylece sunucu adresi tarayiciya gomulmez, CORS/CSP sorunu olmaz ve sunucu adresi
// degistiginde sadece netlify.toml guncellenir. Tanimli degilse eski davranis (VITE_SUPABASE_URL).
const sbYol = import.meta.env.VITE_SB_YOL;
const supabaseUrl =
  sbYol && typeof window !== 'undefined'
    ? `${window.location.origin}${sbYol}`
    : import.meta.env.VITE_SUPABASE_URL;
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
