-- ============================================================
-- ELMANEKO 3D ERP — SCRIPTS DE IMPORTAÇÃO (ETL)
-- TELA / TABELA: 04. CLIENTES (CRM)
-- Registros a inserir: 14
-- ============================================================

INSERT INTO clientes (id, empresa_id, nome, cpf_cnpj, telefone, whatsapp, email, endereco, observacoes)
VALUES
  ('07822f20-f4e8-4ecc-82d4-729825fa23b4', '00000000-0000-0000-0000-000000000001', 'Aline Helena Alves Braga', '04753904660', '34998642398', '5534998642398', 'aninhappt@gmail.com', NULL, 'Retirada no local'),
  ('a2f9ac0a-4d80-461a-8cd5-fb498121e630', '00000000-0000-0000-0000-000000000001', 'Neide Vaz', '04753904660', '34997827250', '5534997827250', 'aninhappt@gmail.com', NULL, NULL),
  ('f8a46d5f-b0b1-401a-8ad1-65651fb097bf', '00000000-0000-0000-0000-000000000001', 'Ezequiel Naves', '04753904660', '34997646496', '5534997646496', 'aninhappt@gmail.com', NULL, 'Colega da Hadassa'),
  ('54e2f238-e0ec-492b-8e26-08c7d656ec03', '00000000-0000-0000-0000-000000000001', 'Sara Beatriz', '04753904660', '34991075683', '5534991075683', 'aninhappt@gmail.com', NULL, 'entregar'),
  ('9a39c7b6-b257-45c5-804f-5fc32dcca0d7', '00000000-0000-0000-0000-000000000001', 'Flavia Cristina Alves', '04753904660', '34991933569', '5534991933569', 'aninhappt@gmail.com', NULL, 'Irma da Aline'),
  ('8ae0eeae-cd05-4837-8757-ddd472b3ed47', '00000000-0000-0000-0000-000000000001', 'Vitoria Neres- colega da Sara', '04753904660', '34991933569', '5534991933569', 'aninhappt@gmail.com', NULL, 'colega de trabalho da Sara Beatriz - sobrinha'),
  ('2e07515b-821e-44a4-8104-cca2218a2a0c', '00000000-0000-0000-0000-000000000001', 'Angela Aparecida Braga', '04753904660', '34991933569', '5534991933569', 'aninhappt@gmail.com', 'Cunhada', NULL),
  ('1fce49aa-cbd4-447c-883f-7ba243e0ad5c', '00000000-0000-0000-0000-000000000001', 'Nathalia -Neide', '04753904660', '34991933569', '5534991933569', 'aninhappt@gmail.com', NULL, 'suporte para bottons'),
  ('e469d194-e18e-4fd4-8b83-94acf2c20c38', '00000000-0000-0000-0000-000000000001', 'Leticia- amiga da Hadassa', '04753904660', '34991933569', '5534991933569', 'aninhappt@gmail.com', NULL, 'amiga da Hadassa escola'),
  ('562e7918-7aad-4513-859f-a3672f69fda2', '00000000-0000-0000-0000-000000000001', 'Emilly- amiga da Hadassa', '04753904660', '34991933569', '5534991933569', 'aninhappt@gmail.com', NULL, 'amiga da Hadassa escola'),
  ('dfe8f3b4-b172-4db8-8437-705374b0095a', '00000000-0000-0000-0000-000000000001', 'Emanuelle Medeiros- Amiga do Henry', '04753904660', '34991933569', '5534991933569', 'aninhappt@gmail.com', NULL, 'Amiga do Henry de escola'),
  ('c6c75e5a-96ee-4e8d-8a12-3e7f809cec5e', '00000000-0000-0000-0000-000000000001', 'Amigo de Trabalho do Wellington', '04753904660', '34991933569', '5534991933569', 'aninhappt@gmail.com', NULL, 'Amigo de trabalho do Wellington'),
  ('db31f0ff-00e6-464f-897e-c0484c388205', '00000000-0000-0000-0000-000000000001', 'Victor / colega de trabalho do Wellington', '04753904660', '34991933569', '5534991933569', 'aninhappt@gmail.com', NULL, NULL),
  ('1f244ac2-6620-4d46-817f-74b0caf903ff', '00000000-0000-0000-0000-000000000001', 'Everson Perez Teixeira', '04753904660', '34991933569', '5534991933569', 'aninhappt@gmail.com', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
