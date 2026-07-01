-- Execute esta query no SQL Editor do seu painel Supabase para habilitar a ordenação personalizada de depoimentos:

ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
