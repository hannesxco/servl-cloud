
-- Create storage bucket for customer avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-avatars', 'customer-avatars', true);

-- Allow anyone to read avatars (public bucket)
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'customer-avatars');

-- Allow anyone to upload avatars (no auth yet in this app)
CREATE POLICY "Allow upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'customer-avatars');

-- Allow anyone to update avatars
CREATE POLICY "Allow update" ON storage.objects FOR UPDATE USING (bucket_id = 'customer-avatars');

-- Allow anyone to delete avatars
CREATE POLICY "Allow delete" ON storage.objects FOR DELETE USING (bucket_id = 'customer-avatars');
