import { createClient } from '@supabase/supabase-js';

// Supabase bağlantı bilgileri
const supabaseUrl = 'https://ctylfbmukmoxpzwzeffr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0eWxmYm11a21veHB6d3plZmZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5ODQyMTMsImV4cCI6MjA4MjU2MDIxM30.kI4bc_zcb1FJ-E_be7HRtEZ4im00KXGE_OHrnPR4POM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
