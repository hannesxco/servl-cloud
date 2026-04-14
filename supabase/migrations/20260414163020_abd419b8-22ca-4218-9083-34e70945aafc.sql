
INSERT INTO storage.buckets (id, name, public) VALUES ('expense-receipts', 'expense-receipts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Expense receipts are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'expense-receipts');

CREATE POLICY "Anyone can upload expense receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'expense-receipts');

CREATE POLICY "Anyone can delete expense receipts"
ON storage.objects FOR DELETE
USING (bucket_id = 'expense-receipts');
