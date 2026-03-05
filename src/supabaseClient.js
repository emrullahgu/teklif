import { createClient } from '@supabase/supabase-js';

// Supabase bağlantı bilgileri
const supabaseUrl = 'https://ctylfbmukmoxpzwzeffr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0eWxmYm11a21veHB6d3plZmZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5ODQyMTMsImV4cCI6MjA4MjU2MDIxM30.kI4bc_zcb1FJ-E_be7HRtEZ4im00KXGE_OHrnPR4POM';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0eWxmYm11a21veHB6d3plZmZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk4NDIxMywiZXhwIjoyMDgyNTYwMjEzfQ.14kc5zULNFa04lc0yFP-p7Odim321Wud890H4rgCdbc';

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

// 🔐 Admin client (service_role key ile) - Delete/Update için
// Bu client RLS'i bypass eder, DİKKATLE KULLAN!
export const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public'
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
