/*
  # Create Storage Buckets

  1. New Buckets
    - `xray-images`: Stores uploaded chest X-ray images
    - `heatmaps`: Stores Grad-CAM heatmap images

  2. Security
    - Enable RLS on both buckets
    - Add policies for authenticated users to upload and access their own files
*/

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES
  ('xray-images', 'xray-images', true, true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('heatmaps', 'heatmaps', true, true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT DO NOTHING;

CREATE POLICY "Users can upload X-ray images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'xray-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their X-ray images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'xray-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their X-ray images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'xray-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public can view heatmaps"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'heatmaps');

CREATE POLICY "Service can upload heatmaps"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'heatmaps');