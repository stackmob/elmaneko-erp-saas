-- ============================================================
-- ELMANEKO 3D ERP — SCRIPTS DE IMPORTAÇÃO (ETL)
-- TELA / TABELA: 02. IMPRESSORAS
-- Registros a inserir: 1
-- ============================================================

INSERT INTO impressoras (id, empresa_id, nome, marca, modelo, potencia_watts, status)
VALUES
  ('6e45c61c-7162-480b-8984-d8d09f0105d4', '00000000-0000-0000-0000-000000000001', 'Bambu Lab A1', 'Bambu Lab', 'A1', 350, 'Ativa')
ON CONFLICT (id) DO NOTHING;
