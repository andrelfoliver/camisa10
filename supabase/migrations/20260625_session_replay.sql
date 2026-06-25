-- Migration: 20260625_session_replay.sql
-- Adiciona suporte a Replay de Sessão e vinculação de Session ID nos pedidos

-- 1. Adicionar coluna 'page' na tabela 'analytics_events' se não existir
ALTER TABLE public.analytics_events 
ADD COLUMN IF NOT EXISTS page TEXT;

-- 2. Adicionar coluna 'session_id' na tabela 'orders' se não existir
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- 3. Criar índices para otimizar busca e agrupamento por sessões
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON public.orders(session_id);
