
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow update" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete" ON storage.objects;

-- Restrict INSERT to authenticated users
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'customer-avatars');

-- Restrict UPDATE to authenticated users (owner check)
CREATE POLICY "Authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'customer-avatars' AND owner = auth.uid());

-- Restrict DELETE to authenticated users (owner check)
CREATE POLICY "Authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'customer-avatars' AND owner = auth.uid());
