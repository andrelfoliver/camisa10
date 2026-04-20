-- 1. Remover o valor padrão atual que está travando a conversão
ALTER TABLE public.products ALTER COLUMN inventory DROP DEFAULT;

-- 2. Converter para JSONB inicializando todos os produtos com o objeto padrão
ALTER TABLE public.products 
ALTER COLUMN inventory TYPE JSONB 
USING jsonb_build_object(
  'S', 0, 
  'M', 0, 
  'L', 0, 
  'XL', 0, 
  '2XL', 0, 
  '3XL', 0, 
  '4XL', 0
);

-- 3. Definir o novo valor padrão para futuros produtos
ALTER TABLE public.products 
ALTER COLUMN inventory SET DEFAULT '{"S": 0, "M": 0, "L": 0, "XL": 0, "2XL": 0, "3XL": 0, "4XL": 0}'::jsonb;

-- 2. Função para decrementar o estoque de forma atômica
-- Isso garante que, se dois pedidos chegarem ao mesmo tempo, o estoque diminua corretamente.
CREATE OR REPLACE FUNCTION decrement_product_stock(product_id_input BIGINT, size_input TEXT, quantity_input INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET inventory = jsonb_set(
    inventory,
    ARRAY[size_input],
    (GREATEST(0, (COALESCE((inventory->>size_input)::int, 0) - quantity_input)))::text::jsonb
  )
  WHERE id = product_id_input;
END;
$$ LANGUAGE plpgsql;
