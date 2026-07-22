-- Ensure the gallery bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist (to avoid errors)
DROP POLICY IF EXISTS "Public gallery read access" ON storage.objects;
DROP POLICY IF EXISTS "Admin gallery upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin gallery update" ON storage.objects;
DROP POLICY IF EXISTS "Admin gallery delete" ON storage.objects;

-- Allow public read access to gallery images
CREATE POLICY "Public gallery read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery');

-- Allow admins to upload to gallery
CREATE POLICY "Admin gallery upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery' AND 
  (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
);

-- Allow admins to update gallery (upsert operations)
CREATE POLICY "Admin gallery update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gallery' AND 
  (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
);

-- Allow admins to delete from gallery
CREATE POLICY "Admin gallery delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery' AND 
  (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
);
