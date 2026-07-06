-- Execute este script no SQL Editor do seu painel do Supabase.
-- Ele cria a tabela public.email_logs para registrar todos os e-mails enviados manualmente
-- e ativa a política RLS (Row Level Security) correspondente.

CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    admin_email TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    template_name TEXT NOT NULL,
    order_number TEXT,
    status TEXT NOT NULL,
    message_id TEXT,
    error_message TEXT
);

-- Habilitar segurança em nível de linha (RLS)
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Remover políticas duplicadas se já existirem
DROP POLICY IF EXISTS "Admins full access to email_logs" ON public.email_logs;

-- Criar política de acesso completo para administradores logados (email correspondente ao admin)
CREATE POLICY "Admins full access to email_logs" 
ON public.email_logs 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);
