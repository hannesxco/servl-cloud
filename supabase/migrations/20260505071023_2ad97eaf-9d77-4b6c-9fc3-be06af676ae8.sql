DROP POLICY IF EXISTS "Public read access for expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete expense receipts" ON storage.objects;
DELETE FROM public.app_data WHERE key IN ('sc_business_expenses', 'sc_expense_categories');