-- Migration: 20260624_marketing_analytics.sql
-- Adiciona suporte a rastreamento de eventos de funil e parâmetros UTM

-- 1. Criar tabela de eventos de analytics
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_id UUID,
    product_id INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Permitir inserção pública de eventos" 
ON public.analytics_events FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir leitura pública de eventos" 
ON public.analytics_events FOR SELECT 
USING (true);

-- Criar índices para performance de agregação no painel Admin
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events(created_at);

-- 2. Adicionar colunas UTM na tabela de pedidos (orders)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT;
