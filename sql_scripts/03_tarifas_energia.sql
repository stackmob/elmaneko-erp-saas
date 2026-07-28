-- ============================================================
-- ELMANEKO 3D ERP — SCRIPTS DE IMPORTAÇÃO (ETL)
-- TELA / TABELA: 03. TARIFAS DE ENERGIA
-- Registros a inserir: 1
-- ============================================================

INSERT INTO tarifas_energia (id, empresa_id, data_inicio_vigencia, valor_kwh)
VALUES
  ('337f046c-cad2-4574-8b3c-2dbca076cacb', '00000000-0000-0000-0000-000000000001', '2026-07-08', 1.2)
ON CONFLICT (id) DO NOTHING;
