-- BEYAZ YAKA BORDRO - RLS POLİTİKALARI DÜZELTMESİ
-- Tüm adminlerin birbirlerinin kayıtlarını görebilmesi için
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Önce eski politikaları kaldır
DROP POLICY IF EXISTS "Users can view white collar employees" ON beyaz_yaka_employees;
DROP POLICY IF EXISTS "Users can insert white collar employees" ON beyaz_yaka_employees;
DROP POLICY IF EXISTS "Users can update white collar employees" ON beyaz_yaka_employees;
DROP POLICY IF EXISTS "Users can delete white collar employees" ON beyaz_yaka_employees;

-- Yeni politikalar - user_id NULL olan kayıtları herkes görebilir
CREATE POLICY "Users can view white collar employees" ON beyaz_yaka_employees
  FOR SELECT USING (
    user_id IS NULL OR auth.uid() = user_id
  );

CREATE POLICY "Users can insert white collar employees" ON beyaz_yaka_employees
  FOR INSERT WITH CHECK (true); -- Herkes ekleyebilir

CREATE POLICY "Users can update white collar employees" ON beyaz_yaka_employees
  FOR UPDATE USING (
    user_id IS NULL OR auth.uid() = user_id
  );

CREATE POLICY "Users can delete white collar employees" ON beyaz_yaka_employees
  FOR DELETE USING (
    user_id IS NULL OR auth.uid() = user_id
  );

-- Payroll tablosu politikalarını güncelle
DROP POLICY IF EXISTS "Users can view white collar payroll" ON beyaz_yaka_monthly_payroll;
DROP POLICY IF EXISTS "Users can insert white collar payroll" ON beyaz_yaka_monthly_payroll;
DROP POLICY IF EXISTS "Users can update white collar payroll" ON beyaz_yaka_monthly_payroll;
DROP POLICY IF EXISTS "Users can delete white collar payroll" ON beyaz_yaka_monthly_payroll;

CREATE POLICY "Users can view white collar payroll" ON beyaz_yaka_monthly_payroll
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM beyaz_yaka_employees 
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert white collar payroll" ON beyaz_yaka_monthly_payroll
  FOR INSERT WITH CHECK (
    employee_id IN (
      SELECT id FROM beyaz_yaka_employees 
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update white collar payroll" ON beyaz_yaka_monthly_payroll
  FOR UPDATE USING (
    employee_id IN (
      SELECT id FROM beyaz_yaka_employees 
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete white collar payroll" ON beyaz_yaka_monthly_payroll
  FOR DELETE USING (
    employee_id IN (
      SELECT id FROM beyaz_yaka_employees 
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

-- Advances tablosu
DROP POLICY IF EXISTS "Users can view white collar advances" ON beyaz_yaka_advances;
DROP POLICY IF EXISTS "Users can insert white collar advances" ON beyaz_yaka_advances;
DROP POLICY IF EXISTS "Users can update white collar advances" ON beyaz_yaka_advances;
DROP POLICY IF EXISTS "Users can delete white collar advances" ON beyaz_yaka_advances;

CREATE POLICY "Users can view white collar advances" ON beyaz_yaka_advances
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM beyaz_yaka_employees 
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert white collar advances" ON beyaz_yaka_advances
  FOR INSERT WITH CHECK (
    employee_id IN (
      SELECT id FROM beyaz_yaka_employees 
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update white collar advances" ON beyaz_yaka_advances
  FOR UPDATE USING (
    employee_id IN (
      SELECT id FROM beyaz_yaka_employees 
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete white collar advances" ON beyaz_yaka_advances
  FOR DELETE USING (
    employee_id IN (
      SELECT id FROM beyaz_yaka_employees 
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

-- Leaves ve Bonuses için de aynı şekilde
DROP POLICY IF EXISTS "Users can view white collar leaves" ON beyaz_yaka_leaves;
DROP POLICY IF EXISTS "Users can insert white collar leaves" ON beyaz_yaka_leaves;
DROP POLICY IF EXISTS "Users can update white collar leaves" ON beyaz_yaka_leaves;
DROP POLICY IF EXISTS "Users can delete white collar leaves" ON beyaz_yaka_leaves;

CREATE POLICY "Users can view white collar leaves" ON beyaz_yaka_leaves
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM beyaz_yaka_employees 
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert white collar leaves" ON beyaz_yaka_leaves
  FOR INSERT WITH CHECK (
    employee_id IN (
      SELECT id FROM beyaz_yaka_employees 
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update white collar leaves" ON beyaz_yaka_leaves
  FOR UPDATE USING (
    employee_id IN (
      SELECT id FROM beyaz_yaka_employees 
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete white collar leaves" ON beyaz_yaka_leaves
  FOR DELETE USING (
    employee_id IN (
      SELECT id FROM beyaz_yaka_employees 
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view white collar bonuses" ON beyaz_yaka_bonuses;
DROP POLICY IF EXISTS "Users can insert white collar bonuses" ON beyaz_yaka_bonuses;
DROP POLICY IF EXISTS "Users can update white collar bonuses" ON beyaz_yaka_bonuses;
DROP POLICY IF EXISTS "Users can delete white collar bonuses" ON beyaz_yaka_bonuses;

CREATE POLICY "Users can view white collar bonuses" ON beyaz_yaka_bonuses
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM beyaz_yaka_employees 
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert white collar bonuses" ON beyaz_yaka_bonuses
  FOR INSERT WITH CHECK (
    employee_id IN (
      SELECT id FROM beyaz_yaka_employees 
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update white collar bonuses" ON beyaz_yaka_bonuses
  FOR UPDATE USING (
    employee_id IN (
      SELECT id FROM beyaz_yaka_employees 
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete white collar bonuses" ON beyaz_yaka_bonuses
  FOR DELETE USING (
    employee_id IN (
      SELECT id FROM beyaz_yaka_employees 
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

-- Tamamlandı! Artık:
-- 1. user_id NULL olan kayıtlar (admin kayıtları) HERKES tarafından görülebilir
-- 2. user_id dolu olan kayıtlar sadece o kullanıcı tarafından görülebilir
-- 3. Tüm adminler birbirlerinin eklediği kayıtları görebilir
