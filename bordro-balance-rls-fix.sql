-- FIX: Enable RLS for bordro_balance table with correct column references
-- NOTE: This assumes bordro_balance has employee_id column like other bordro tables

-- First, let's check the actual table structure
-- Run this query to see the columns:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'bordro_balance' AND table_schema = 'public';

-- Enable RLS on the table
ALTER TABLE public.bordro_balance ENABLE ROW LEVEL SECURITY;

-- Option 1: If bordro_balance has employee_id column
-- These policies allow users to access records for employees they own

CREATE POLICY bordro_balance_select_policy
  ON public.bordro_balance
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM bordro_employees 
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

CREATE POLICY bordro_balance_insert_policy
  ON public.bordro_balance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM bordro_employees 
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

CREATE POLICY bordro_balance_update_policy
  ON public.bordro_balance
  FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM bordro_employees 
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  )
  WITH CHECK (
    employee_id IN (
      SELECT id FROM bordro_employees 
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

CREATE POLICY bordro_balance_delete_policy
  ON public.bordro_balance
  FOR DELETE
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM bordro_employees 
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bordro_balance_employee_id ON public.bordro_balance(employee_id);

-- Option 2: If you want to allow all authenticated users (no restrictions)
-- Uncomment these instead if you want simpler access control:

-- CREATE POLICY bordro_balance_all_authenticated
--   ON public.bordro_balance
--   FOR ALL
--   TO authenticated
--   USING (true)
--   WITH CHECK (true);

