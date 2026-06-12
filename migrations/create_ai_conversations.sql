-- Tabela para logs das conversas com a IA (iFooty AI Coach)
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL UNIQUE,
    user_name TEXT,
    user_ip TEXT,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar segurança em nível de linha (RLS)
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Permitir inserção de conversas" ON public.ai_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de conversas" ON public.ai_conversations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Permitir leitura de conversas" ON public.ai_conversations FOR SELECT USING (true);
CREATE POLICY "Permitir exclusão de conversas" ON public.ai_conversations FOR DELETE USING (true);
