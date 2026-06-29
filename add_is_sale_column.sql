-- ============================================================
-- Migração: Adição da coluna 'is_sale' na tabela products
-- Execute este SQL no Editor SQL do Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/agbskncncrnzmutaubdn/editor
-- ============================================================

ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS is_sale BOOLEAN DEFAULT false;

-- 2. Corrigir imagem principal do produto Brasil 26/27 Versão Jogador (ID: 1382)
--    (Substitui o vídeo quebrado/não renderizável por uma imagem PNG válida)
UPDATE products 
SET 
  image = 'https://agbskncncrnzmutaubdn.supabase.co/storage/v1/object/public/product-images/1776342367903-zl8sj1m55n.png',
  gallery = '["https://agbskncncrnzmutaubdn.supabase.co/storage/v1/object/public/product-images/1776342367903-zl8sj1m55n.png","https://agbskncncrnzmutaubdn.supabase.co/storage/v1/object/public/product-images/1776342369814-9vu862yb53o.png","https://agbskncncrnzmutaubdn.supabase.co/storage/v1/object/public/product-images/1776342370735-ami1wxwzmut.png","https://agbskncncrnzmutaubdn.supabase.co/storage/v1/object/public/product-images/1776342371387-65xpljw4512.png","https://agbskncncrnzmutaubdn.supabase.co/storage/v1/object/public/product-images/1776342372167-xcymhl5235.png","https://agbskncncrnzmutaubdn.supabase.co/storage/v1/object/public/product-images/1776775821796-51m9epgm1wm.mp4"]'::jsonb
WHERE id = 1382;

-- 3. Adicionar coluna 'wishlist' na tabela profiles
--    (Permite salvar a lista de desejos de cada usuário)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS wishlist JSONB DEFAULT '[]'::jsonb;

-- 4. Adicionar coluna 'is_trending' na tabela products
--    (Permite marcar produtos para exibição na seção Trending Fan Gear)
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;
