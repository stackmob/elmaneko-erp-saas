-- ============================================================
-- PATCH: Corrigir constraint orcamentos_status_check
-- Problema: O constraint não incluía 'Faturado' como status válido,
--           causando erro 23514 ao executar converter_orcamento_em_venda.
-- Execute este script no SQL Editor do Supabase Dashboard.
-- ============================================================

-- 1. Remove o constraint antigo (que não inclui 'Faturado')
ALTER TABLE public.orcamentos
  DROP CONSTRAINT IF EXISTS orcamentos_status_check;

-- 2. Recria o constraint com todos os status válidos do sistema,
--    incluindo 'Faturado' que é definido pelo TypeScript como válido.
ALTER TABLE public.orcamentos
  ADD CONSTRAINT orcamentos_status_check
    CHECK (status IN ('Aberto', 'Enviado', 'Aprovado', 'Faturado', 'Rejeitado', 'Expirado', 'Cancelado'));

-- Verificação: deve retornar o constraint recém-criado
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.orcamentos'::regclass
  AND conname = 'orcamentos_status_check';
