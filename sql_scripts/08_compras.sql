-- ============================================================
-- ELMANEKO 3D ERP — SCRIPTS DE IMPORTAÇÃO (ETL)
-- TELA / TABELA: 08. COMPRAS DE INSUMOS
-- Registros a inserir: 1
-- ============================================================

INSERT INTO compras (id, empresa_id, data, fornecedor, filamento_id, quantidade_adquirida, valor_pago, nota_fiscal, observacoes)
VALUES
  ('707ee60d-6717-4a99-8b47-b466cfeb4606', '00000000-0000-0000-0000-000000000001', '2026-07-10', 'Mercado Livre', '8d0c89f3-2936-4b63-8321-c2d196123e24', 1000, 124.9, NULL, 'pago com saldo da conta Elmaneko Mercado Pago')
ON CONFLICT (id) DO NOTHING;
