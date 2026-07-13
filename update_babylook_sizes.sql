-- Update babylook products: clear unavailable sizes and ensure correct price
UPDATE public.products
SET unavailable_sizes = '{}', price = 47.90
WHERE name ILIKE '%babylook%' OR name ILIKE '%baby look%';
