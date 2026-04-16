-- ============================================
-- POLÍTICAS DO SUPABASE STORAGE - CAMISA10
-- Execute este SQL no editor do Supabase
-- ============================================

-- 1. Permitir que qualquer pessoa LEIA as imagens (acesso público)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 2. Permitir que usuários AUTENTICADOS (admin) façam upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- 3. Permitir que usuários AUTENTICADOS ATUALIZEM imagens
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- 4. Permitir que usuários AUTENTICADOS DELETEM imagens
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);
