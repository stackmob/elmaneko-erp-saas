-- ============================================================
-- ELMANEKO 3D ERP — SCRIPT MASTER DE IMPORTAÇÃO CONSOLIDADO
-- Execute este script no SQL Editor do Supabase para popular tudo de uma vez.
-- ============================================================

-- ============================================================
-- ELMANEKO 3D ERP — SCRIPTS DE IMPORTAÇÃO (ETL)
-- TELA / TABELA: 01. FILAMENTOS
-- Registros a inserir: 18
-- ============================================================

INSERT INTO filamentos (id, empresa_id, nome, tipo, marca, cor, peso_total, quantidade_disponivel, valor_compra, data_compra, fornecedor, observacoes)
VALUES
  ('33ff3cc7-874d-47a1-87e2-e2f02e4fb9db', '00000000-0000-0000-0000-000000000001', 'PLA High Speed', 'PLA', 'Prime 3D', 'Army Green', 1000, 0, 123, '2026-06-25', 'Mercado Livre', 'Caixa plástica, dentro de saco a vácuo, e pode de sílica'),
  ('43af7d10-7ef5-46a5-8325-e2d57f308331', '00000000-0000-0000-0000-000000000001', 'Petg Color White', 'PETG', 'Master Print', 'Branco', 1000, 0, 99.9, '2026-06-25', 'Mercado Livre', 'saco a vácuo, com pode de silica'),
  ('7faa84b3-e640-4d0c-8e05-71aa89186356', '00000000-0000-0000-0000-000000000001', 'PETG Branco Translucido', 'PETG', 'Master Print', 'Branco Translúcido', 1000, 186, 99, '2026-06-25', 'Mercado Livre', 'saco a vácuo, caixa plástica, pote de sílica'),
  ('d5e02e24-bc54-496c-8ad1-7d44d03b3b9c', '00000000-0000-0000-0000-000000000001', 'Petg Color White', 'PETG', 'Master Print', 'Branco', 1000, 1000, 99.9, '2026-06-25', 'Mercado Livre', 'Caixa Plástica, saco a vácuo, pote de sílica'),
  ('7eee0a2d-879d-4a6c-85eb-3c6200b6198b', '00000000-0000-0000-0000-000000000001', 'ABS Premium Filamento 3D', 'ABS', 'Master Print', 'Vermelho/Rojo', 1000, 1000, 89.9, '2026-06-25', 'Mercado Livre', 'Caixa Plástica, saco a vácuo, pote de sílica'),
  ('0925cef7-e00b-4bca-8d2b-05e945f2fc17', '00000000-0000-0000-0000-000000000001', 'PLA Red', 'PLA', 'Creality', 'Vermelho', 1000, 611, 109, '2026-06-25', 'Mercado Livre', 'Caixa Plástica, saco a vácuo, pote de sílica'),
  ('58d14195-2680-4675-8284-cd186b624c56', '00000000-0000-0000-0000-000000000001', 'PLA Elegoo', 'PLA', '3D Printer Filament Elegoo', 'Marrom', 1000, 1000, 114.9, '2026-06-25', 'Elegoo', 'Caixa Plástica, saco a vácuo, pote de sílica'),
  ('29cb24e7-f1c5-42cf-8a81-0e917befd544', '00000000-0000-0000-0000-000000000001', 'pla Hyper Speed', 'PLA', 'Master Print', 'Bronze', 1000, 100, 119.9, '2026-06-25', 'Mercado Livre', ''),
  ('93fb7ae2-f44c-4ee3-8aa8-07716163d5b4', '00000000-0000-0000-0000-000000000001', 'Petg Red', 'PETG', 'Master Print', 'vermelho', 1000, 900, 109, '2026-06-25', 'Mercado Livre', 'Caixa Plástica, saco a vácuo, pote de sílica'),
  ('5828df0c-a99e-4795-80a2-3dfc120a97cc', '00000000-0000-0000-0000-000000000001', 'Petg Skin', 'PETG', 'Master Print', 'cor da pele', 1000, 800, 98.9, '2026-06-25', 'Mercado Livre', 'Caixa plástica, saco a vácuo, pote de sílica'),
  ('c2a241f5-dc4a-4a1f-8ad6-04c04e77b341', '00000000-0000-0000-0000-000000000001', 'EN PLA Blue', 'PLA', 'Creality', 'Azul', 1000, 900, 138.95, '2026-06-25', 'Mercado Livre', 'Caixa plástica, saco a vácuo, pote de sílica'),
  ('f6cb1ed8-1879-455e-89fa-7d6bcfe633ee', '00000000-0000-0000-0000-000000000001', 'PLA basic bringht yellow', 'PLA', 'Onyon3d', 'amarelo', 1000, 200, 99.52, '2026-06-28', 'Mercado Livre', 'saco a vácuo, caixa plástica, pote de sílica. '),
  ('23dabe1a-1b3f-4f07-8f19-50d836129458', '00000000-0000-0000-0000-000000000001', 'Pla  Speed Premium', 'PLA', '3D LAB', 'Areia', 1000, 1000, 144.9, '2026-06-30', 'Mercado Livre', 'saco a vácuo, caixa plástica e pote de sílica'),
  ('0237b9d6-ae2e-4c4f-87ff-d376e185dc9f', '00000000-0000-0000-0000-000000000001', 'EN PLA BLACK', 'PLA', 'Creality', 'Preto', 1000, 500, 128.9, '2026-07-03', 'Mercado Livre', 'caixa plástica, pote de sílica, saco a vácuo'),
  ('8d0c89f3-2936-4b63-8321-c2d196123e24', '00000000-0000-0000-0000-000000000001', 'PLA V Silk PREMIUM', 'PLA', 'Premium', 'Tri color dourado/rosa choque/verde', 1000, 2000, 124.9, '2026-07-10', 'Mercado Livre', 'caixa plástica, saco a vácuo/ pote de sílica'),
  ('57d9d3bc-8d8e-4a12-8d9e-2b8aaa283e36', '00000000-0000-0000-0000-000000000001', 'Filamento Pla Tri Azulsafira/dourado/verde Vsilk 1kg Voolt3d', 'PLA', 'Voolt3d', 'azul, dourado e verde', 1000, 1000, 140, '2026-07-17', 'Mercado Livre', 'caixa plástica, pote sílica e saco a vácuo
'),
  ('78f2373a-0f8c-4805-85ac-da5f2a8ef9fa', '00000000-0000-0000-0000-000000000001', 'EN PLA White', 'PLA', 'Creality', 'Branco', 1000, 200, 139.9, '2026-07-20', 'Mercado Livre', 'Caixa Plástica, pote de Sílica, saco a vácuo'),
  ('b99334d6-75b3-490d-8ad5-6d231666a2f9', '00000000-0000-0000-0000-000000000001', 'PLA V-SILK PREMIUM', 'PLA', 'Voolt3d', 'Dourado', 1000, 1000, 119.9, '2026-07-20', 'Mercado Livre', 'caixa plástica, pote de sílica, saco vácuo')
ON CONFLICT (id) DO UPDATE SET quantidade_disponivel = EXCLUDED.quantidade_disponivel;


-- ============================================================
-- ELMANEKO 3D ERP — SCRIPTS DE IMPORTAÇÃO (ETL)
-- TELA / TABELA: 02. IMPRESSORAS
-- Registros a inserir: 1
-- ============================================================

INSERT INTO impressoras (id, empresa_id, nome, marca, modelo, potencia_watts, status)
VALUES
  ('6e45c61c-7162-480b-8984-d8d09f0105d4', '00000000-0000-0000-0000-000000000001', 'Bambu Lab A1', 'Bambu Lab', 'A1', 350, 'Ativa')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- ELMANEKO 3D ERP — SCRIPTS DE IMPORTAÇÃO (ETL)
-- TELA / TABELA: 03. TARIFAS DE ENERGIA
-- Registros a inserir: 1
-- ============================================================

INSERT INTO tarifas_energia (id, empresa_id, data_inicio_vigencia, valor_kwh)
VALUES
  ('337f046c-cad2-4574-8b3c-2dbca076cacb', '00000000-0000-0000-0000-000000000001', '2026-07-08', 1.2)
ON CONFLICT (id) DO NOTHING;


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


-- ============================================================
-- ELMANEKO 3D ERP — SCRIPTS DE IMPORTAÇÃO (ETL)
-- TELA / TABELA: 05A. PRODUTOS (CATÁLOGO)
-- Registros a inserir: 75
-- ============================================================

INSERT INTO produtos (id, empresa_id, nome, categoria, descricao, imagem, tempo_impressao, impressora_padrao_id, tempo_acabamento, valor_mao_de_obra, observacoes)
VALUES
  ('fb8031ae-6ff5-4dba-88b6-153b952cafc3', '00000000-0000-0000-0000-000000000001', 'Empunhadura para Raspador Bambu', 'Suporte', '0.2mm layer, 20%+15% infill, walls OPTIMIZED 6+2', NULL, 2.2, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('86eba8b1-35df-4b53-86e3-267eb6231c3e', '00000000-0000-0000-0000-000000000001', 'Suporte superior AMS Lite para Bambu Lab A1', 'Suporte', 'AMS Lite top mount (Update v1.1)', NULL, 7, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('25037d67-c6c6-47c3-821f-4ff93d3f42d2', '00000000-0000-0000-0000-000000000001', 'Chaveiros Smiley Daisy — Clicker Fidget', 'Lembrancinha', '0.2mm layer, 3 walls, 15% infill', NULL, 1.1, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('3337b8f2-9de8-402d-876f-b696c66a6cde', '00000000-0000-0000-0000-000000000001', 'Chaveiros Smiley Daisy — Clicker Fidget', 'Lembrancinha', '0.2mm layer, 3 walls, 15% infill', NULL, 0.2, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 15, NULL),
  ('19b6148b-b6eb-4dc8-8253-bed40df82bd4', '00000000-0000-0000-0000-000000000001', 'Gabinete Definitivo para Bobinas de Filamento - TIPO 01', 'Suporte', 'Latest version', NULL, 16, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('4101bd7c-1246-4b4b-85e2-6c2d472aa696', '00000000-0000-0000-0000-000000000001', 'Gabinete Definitivo para Bobinas de Filamento - TIPO 01', 'Suporte', 'Latest version', NULL, 15, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('aa5c38cb-c70f-4ed0-844f-68e22655cf78', '00000000-0000-0000-0000-000000000001', 'Gabinete Definitivo para Bobinas de Filamento - TIPO 01', 'Suporte', 'Latest version', NULL, 3, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('202504c8-b160-4e7f-8ce7-43009f56eb8a', '00000000-0000-0000-0000-000000000001', 'Gabinete Definitivo para Bobinas de Filamento - TIPO 01', 'Suporte', 'Latest version', NULL, 3, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('71d18f0d-e771-4f68-82b8-05d749d93529', '00000000-0000-0000-0000-000000000001', 'Gabinete Definitivo para Bobinas de Filamento - TIPO 01', 'Suporte', 'Latest version', NULL, 2.2, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('d1309524-1591-4e3e-89a1-c6d3c374512e', '00000000-0000-0000-0000-000000000001', 'Gabinete Definitivo para Bobinas de Filamento - TIPO 01', 'Suporte', 'Latest version', NULL, 2.3, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('fe324524-859a-4c9f-84f1-b5d39a9d431f', '00000000-0000-0000-0000-000000000001', 'Chaveiros Smiley Daisy — Clicker Fidget', 'Lembrancinha', '0.2mm layer, 3 walls, 15% infill', NULL, 9.5, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('a7758352-ed1a-482c-8ab4-e335e71e529b', '00000000-0000-0000-0000-000000000001', 'Chaveiros Smiley Daisy — Clicker Fidget', 'Lembrancinha', '0.2mm layer, 3 walls, 15% infill', NULL, 3.5, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('56a0be22-8920-4511-8ebf-e3cc5952e67e', '00000000-0000-0000-0000-000000000001', 'A Base Impossível para Laptop v2 - Serve no A1 Mini!', 'Suporte', 'Fast - Stand with no cutout for TPU foot', NULL, 6.2, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('762f78c3-bb5e-4592-81bd-1df3bb9e9081', '00000000-0000-0000-0000-000000000001', 'Suporte para Garrafas de Vinho', 'Decoração', '0.8mm nozzle, 0.4mm layer, 2 walls, 5% infill', NULL, 6.3, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('87ce3cd8-ecfb-4fce-8942-69cd978b6d27', '00000000-0000-0000-0000-000000000001', 'Um pequeno dragão branco', 'Brinquedo', 'Standard，42cm in length，0.2mm layer, 2 walls, 15% infill', NULL, 3.5, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('59b07322-d889-4f20-825a-bbee2826554b', '00000000-0000-0000-0000-000000000001', 'Meu design de fidget de 10 estrelas', 'Brinquedo', '0.24mm layer, 1 walls, 10% infill, 2 colors, both sides', NULL, 3, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('55a96fcd-d8bc-47db-858d-0361e9defc97', '00000000-0000-0000-0000-000000000001', 'Estátua do Homem-Aranha Noir | Base de Fan Art com Alto Detalhe', 'Brinquedo', '0.2mm layer, 2 walls, 15% infill', NULL, 5.2, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('ed125cec-57da-4bf4-860e-acdd82264092', '00000000-0000-0000-0000-000000000001', 'Suporte para taças de vinho | Opções para 2, 3 ou 4 taças', 'Decoração', 'Fast print!', NULL, 1, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('308cc619-2050-4852-8c33-15d96a35ced6', '00000000-0000-0000-0000-000000000001', 'logo Zaya', 'Decoração', 'Placa1', NULL, 0.2, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('cc79ceb6-4edf-49f2-8ed0-b4ba2c8a5226', '00000000-0000-0000-0000-000000000001', 'Caixa de Cartões', 'Brinquedo', 'Standard 0.2mm V2', NULL, 3.3, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('108c0afb-2be6-4f09-8a82-4e2c21d2d318', '00000000-0000-0000-0000-000000000001', 'Suporte Triplo para Vinhos', 'Decoração', '0.28mm layer, 3 walls, 6% infill', NULL, 4.7, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('1baaed13-4130-419a-8488-df6667e1e5fa', '00000000-0000-0000-0000-000000000001', 'Recipiente - gel de sílica', 'Suporte', '0.2mm layer, 2 walls, 15% infill', NULL, 4.5, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('9bcbdbaa-701d-4d02-8309-3a6d7c0e5472', '00000000-0000-0000-0000-000000000001', 'Bandeja Prato Tigela Oval Contorno V5 - Design Japandi', 'Decoração', 'Medium Plate Tray oval Bowl Contour V5 - Japandi Design', NULL, 3.5, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('3a47ff49-9b1d-4dbb-8aff-08294986da0f', '00000000-0000-0000-0000-000000000001', 'Suporte de Taças de Vinho Montado na Garrafa – 6 Taças', 'Decoração', '6 glasses version , 1-piece, print & enjoy (A1 & up)', NULL, 1.9, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('f3db461a-bdeb-4e22-8916-bbc4af4a2660', '00000000-0000-0000-0000-000000000001', 'Homem-Aranha / SEM AMS / COMPATÍVEL COM AMS', 'Brinquedo', 'NO AMS NEED MULTIPART', NULL, 0.2, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('1649fae8-beaa-4ba8-8729-20d665cecf55', '00000000-0000-0000-0000-000000000001', 'Homem-Aranha / SEM AMS / COMPATÍVEL COM AMS', 'Brinquedo', 'NO AMS NEED MULTIPART', NULL, 4, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('1fdf2082-802f-49b8-87bb-f00f81bb2d82', '00000000-0000-0000-0000-000000000001', 'Homem-Aranha / SEM AMS / COMPATÍVEL COM AMS', 'Brinquedo', 'NO AMS NEED MULTIPART', NULL, 0.1, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('671c7a83-a485-457b-85bc-5330a80833ff', '00000000-0000-0000-0000-000000000001', 'Homem-Aranha / SEM AMS / COMPATÍVEL COM AMS', 'Brinquedo', 'NO AMS NEED MULTIPART', NULL, 4.5, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('23d550d4-1e50-4c15-874d-00932c05badd', '00000000-0000-0000-0000-000000000001', 'Bandeja com Borda de Corda - Decoração de Luxo Minimalista', 'Decoração', '0.2mm layer, 2 walls, 5% infill', NULL, 2.9, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('a75887b7-336c-4a9c-8793-627d16091cdd', '00000000-0000-0000-0000-000000000001', 'Porta-Velas Zen "Flor de Lótus"', 'Decoração', '0.2mm layer, 2 walls, 5% infill', NULL, 2, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('b82436be-63d4-486e-817a-bafab0b0ae38', '00000000-0000-0000-0000-000000000001', 'Girador Estrela de Engrenagem Planetária – Fidget Sensorial', 'Brinquedo', '0.2mm layer, 2 walls, 15% infill', NULL, 3.1, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('c53f8eac-28aa-4b65-8157-ce614c44d935', '00000000-0000-0000-0000-000000000001', 'Vaso de Planta Canelado Moderno Japandi com drenagem', 'Decoração', 'Planter for Baby Plant - inner diameter 6,7 cm', NULL, 3.6, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('5ef35a72-746c-475d-8c52-6abf5ff50956', '00000000-0000-0000-0000-000000000001', 'Letreiro Bíblico Ore e Confie', 'Decoração', '0.2mm layer, 2 walls, 8% infill/ ', NULL, 5.6, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('7da5f617-b05b-4516-89ec-b96cb1cd3d6d', '00000000-0000-0000-0000-000000000001', 'Prateleira de Parede e Porta-Chaves ArchLine', 'Decoração', 'valor de venda 40,00', NULL, 8.6, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('b53d2173-7e80-472e-8760-74b797a39bee', '00000000-0000-0000-0000-000000000001', 'Suporte para vinho cobra', 'Decoração', '', NULL, 11.2, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('050997c5-4963-4b4e-88f1-457b86901b66', '00000000-0000-0000-0000-000000000001', 'torção fidget dançarino estelar', 'Brinquedo', '', NULL, 3, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 0, NULL),
  ('0f44a0d2-3029-4e96-8e35-7cc0fb72eadc', '00000000-0000-0000-0000-000000000001', ' Pikachu / NO AMS', 'Brinquedo', '', NULL, 7, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 10, NULL),
  ('660f2451-630c-4fb0-8149-b05bdb2aabb8', '00000000-0000-0000-0000-000000000001', 'Shadow Sombra — Clássico', 'Brinquedo', '', NULL, 5.5, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 15, NULL),
  ('72639c6c-10a4-4205-87ad-f827f5ed5664', '00000000-0000-0000-0000-000000000001', 'Dragonair – Modelo em Várias Partes (Não Requer AMS', 'Brinquedo', '', NULL, 9.9, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 15, NULL),
  ('d54991ce-c6ed-48f8-80a6-6efae9eb2259', '00000000-0000-0000-0000-000000000001', 'MONSTER ENERGY PORTA-LATA', 'suporte de latinha monster, completo tampa e chaveiro', '', NULL, 7.5, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 15, NULL),
  ('563d7f57-f970-499d-8b39-befc13d827ee', '00000000-0000-0000-0000-000000000001', 'MONSTER ENERGY PORTA-LATA DE FELPA', 'Suporte lata Monster Moleton', '', NULL, 9.4, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 10, NULL),
  ('ba34dad7-1eab-414f-8b6b-3fcea9980ea1', '00000000-0000-0000-0000-000000000001', 'chaveiro Monster', 'Suporte', '', NULL, 0.2, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 5, NULL),
  ('54684f36-6ba0-4f24-824f-663a5f84a366', '00000000-0000-0000-0000-000000000001', 'Blobtopus - Polvo Articulado Grudento e Torcido', 'Brinquedo', 'No-AMS / Multipart Version/ 34,90 COR SOLIDA E 39,90 COLORIDO', NULL, 6.6, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 10, NULL),
  ('50188fe5-5506-4024-86f9-962382179bf8', '00000000-0000-0000-0000-000000000001', 'Homem-Aranha / SEM AMS / COMPATÍVEL COM AMS', 'Brinquedo', '', NULL, 7.7, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 10, NULL),
  ('a1cd77b1-7fc5-4e5d-8906-6ed6aa43023b', '00000000-0000-0000-0000-000000000001', 'Fofo chaveiro articulado do Banguela Fúria da Noite', 'chaveiro Articulado Banguela', 'chaveiro Articulado Banguela / valor de venda 18,90', NULL, 1.4, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 5, NULL),
  ('1ee370a5-340f-472e-81ad-f3b0257812d9', '00000000-0000-0000-0000-000000000001', 'Chaveiro de Dragão Fúria da Luz Articulado', 'chaveiro Articulado namorada do Banguela', 'chaveiro da namorada do banguela/ valor de venda 14,90', NULL, 1.4, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 5, NULL),
  ('38577a2d-2200-47f2-8737-9e2dbbec42fd', '00000000-0000-0000-0000-000000000001', 'Chaveiro Pokébola', 'chaveiro Chaveiro Pokébola', 'Chaveiro Pokébola/ valor de venda 15,90', NULL, 1, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 5, NULL),
  ('bad2d7b7-7e74-48eb-80e1-fe01c1a44883', '00000000-0000-0000-0000-000000000001', 'Coleção de Clickers de Pokebola, AMS ', 'chaveiro pokebola de click', 'Coleção de Clickers de Pokebola, AMS / chaveiro click/ valor de venda 19,90', NULL, 1.5, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 10, NULL),
  ('bc5bfc5d-4125-4f8f-81a9-f8d80a1838f2', '00000000-0000-0000-0000-000000000001', 'Abridor de Latas de Botão 32MM', 'chaveiro botton', '0.2mm camada, 2 paredes, 15% de preenchimento/ VALOR DE VENDA 3.50', NULL, 0.2, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 2, NULL),
  ('21151d8a-5642-4f89-89b6-36378e4e9801', '00000000-0000-0000-0000-000000000001', ' CHAVEIRO GIRATÓRIO ALL BLACKS', 'chaveiro giratorio bottons', '0.2mm de camada, 3 paredes, 10% de preenchimento/ valor de venda 11,90

', NULL, 0.3, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 5, NULL),
  ('e742d3b7-c66d-4a23-826a-3aa57afb980e', '00000000-0000-0000-0000-000000000001', 'Virgem Maria Minimalista (Q_Craft)', 'Decoração', '0.16mm camada, 3 paredes, 15% de preenchimento/ preço informado 29,90
', NULL, 2.3, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 10, NULL),
  ('3e3a6359-3ad8-470a-807d-c95ffccf4d66', '00000000-0000-0000-0000-000000000001', 'Ornamento da Sagrada Família em Oração', 'Decoração', '0.2mm camada, 2 paredes, 15% de preenchimento
', NULL, 13, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 5, NULL),
  ('6bb89782-6a43-4b29-8500-af47a04a954d', '00000000-0000-0000-0000-000000000001', 'Crucifixo com suporte', 'Decoração Crucifixo', 'Chris1974/ informado preco de venda 34,90
', NULL, 4, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 9, NULL),
  ('6ab5dcaa-fefd-4cc7-8ea8-8743c8499c6c', '00000000-0000-0000-0000-000000000001', 'Sagrada Família', 'decoracao sagrada familia com suporte de pe e em S', '0.2mm camada, 2 paredes, 15% de preenchimento/ Informado preço de venda 50,00
', NULL, 3.5, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 15, NULL),
  ('9427aaee-621d-4a84-8e77-f52ec5427671', '00000000-0000-0000-0000-000000000001', 'Leque stray kids Coleção de personagens', 'Brinquedo', 'straykids leque - 0.12mm camada, 3 paredes, 100% preenchimento/ valor de venda 25,90
', NULL, 5.5, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 5, NULL),
  ('729fcd11-c99d-49b1-8083-d108587f4ff9', '00000000-0000-0000-0000-000000000001', 'Chaveiro de Casa com porta-foto ou mensagem', 'chaveiro botton', '0.16mm camada, 2 paredes, 15% de preenchimento/ valor de venda 15,90
', NULL, 1.5, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 5, NULL),
  ('d6633ef5-7c21-41b1-8353-c4b549b2a11d', '00000000-0000-0000-0000-000000000001', 'Chaveiro Polaroid / Instax - (Sem cola / Suportes)', 'chaveiro para foto personalizado', '0.2mm camada, 2 paredes, 15% de preenchimento/ valor de venda 19,90
', NULL, 0.4, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 10, NULL),
  ('c95d8ec9-1ff0-4bcb-8111-f57a371caea1', '00000000-0000-0000-0000-000000000001', 'Fidget de Ovo de Dragão Texturizado e Giratório', 'Brinquedo/ Ovo de Dragão', '1 Ovo de Dragão Escamado Torcido Texturizado Anti-Estresse/ valor de venda 32,00
', NULL, 8, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 5, NULL),
  ('d65ac690-2dd7-4ffd-8986-bde189be982f', '00000000-0000-0000-0000-000000000001', 'rato cego personagem shrek', 'Brinquedo', 'rato cego personagem shrek/ STL salvo na pasta D, Elmaneko ', NULL, 2, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 3, NULL),
  ('8d32c56f-3978-467c-895e-fc9889b3f2a2', '00000000-0000-0000-0000-000000000001', 'Torre de Rabanetes de Balé 2', 'Brinquedo', 'Altura da camada de 0.16mm, 2 paredes, 15% de preenchimento - Valor de venda 39,90', NULL, 5, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 10, NULL),
  ('305e47a9-b10b-49e9-8e44-c5844113f0e4', '00000000-0000-0000-0000-000000000001', 'Boneco famale figure', 'Brinquedo', 'valor de venda com uma cor 13,90', NULL, 1.5, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 5, NULL),
  ('e505e8fa-cbb8-46c4-8873-1c95c8710abb', '00000000-0000-0000-0000-000000000001', 'Caixa para Dois Baralhos de Cartas - Edição Snaplock', 'Brinquedo', 'Esta é uma caixa com fecho tipo snaplock que comporta dois baralhos de cartas de bicicleta.
Preco de venda 42,90', NULL, 4.5, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 5, NULL),
  ('a5910168-36eb-41c8-8487-0016ea99efed', '00000000-0000-0000-0000-000000000001', 'Chaveiro Esqueleto Flexível Sorridente', 'CHAVEIRO', 'Chaveiro Esqueleto Flexível Sorridente/ Valor de venda 12,90', NULL, 0.5, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 5, NULL),
  ('19e81800-f880-42f9-8acd-dab9dbfa4367', '00000000-0000-0000-0000-000000000001', 'Kimono taekwondo', 'CHAVEIRO', 'CHAVEIRO Kimono taekwondo/ VALOR DE VENDA 16,90', NULL, 1.2, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 5, NULL),
  ('c42c3152-a2cf-4047-8cb3-4f8677cd72bf', '00000000-0000-0000-0000-000000000001', 'Chaveiro raposa click', 'chaveiro click', 'Raposa - Coleção Animais Apaixonados/ valor 15,90', NULL, 1.5, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 5, NULL),
  ('bb52039a-d7e0-41dc-8d2a-d28234d994a6', '00000000-0000-0000-0000-000000000001', 'Aparador de livros Leão e Cruz', 'Aparador de Livros', 'Aparador de livros Leão e Cruz/ valor de venda 49,00', NULL, 10.4, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 3, NULL),
  ('22690559-ed2b-421a-81fe-f7bdf0f5b40a', '00000000-0000-0000-0000-000000000001', 'Expositor de chaveiros - Porta-chaveiros', 'Suporte', '10 galhos/ 0.2mm layer, 3 walls, 15% infill/ valor de venda 32,90', NULL, 4, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 5, NULL),
  ('60896681-b5e8-4253-852f-2067d484fa94', '00000000-0000-0000-0000-000000000001', 'Suporte de Exibição para Chaveiros', 'Suporte', 'com 4 galhos/FAST PRINT (0.28mm layer, 2 walls, 15% infill)/ valor de venda 25,90', NULL, 2, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 5, NULL),
  ('35d5b42e-a115-4de9-8eae-ba159a70e48e', '00000000-0000-0000-0000-000000000001', 'Jogo de Equilíbrio Dinossauro', 'Brinquedo', 'A1 mini,X1,X1 Carbon,X1E,H2D,P1S,P1P,A1,H2D Pro,H2S,P2S,H2C,X2D,A2L/ brinquedo de equilíbrio/ valor de venda 29,90
', NULL, 4.2, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 5, NULL),
  ('35455716-71e3-420d-8d0d-1782f32c8e0b', '00000000-0000-0000-0000-000000000001', 'Cacho de Uva', 'Decoração', 'Uvas - Fruta Falsa - Decoração/A1 mini,X1,H2S,A1,X1E,X1 Carbon,P1S,P2S,H2D Pro,H2D,P1P,X2D,H2C,A2L/ valor de venda 19,90
', NULL, 3.2, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 4, NULL),
  ('a7714ef0-2e76-458b-8a84-57b37bc4a311', '00000000-0000-0000-0000-000000000001', 'Folha para o cacho de uva', 'Decoração', 'Galho de Videira 3D ou Videira Flexível/0.16mm camada, 2 paredes, 15% de preenchimento/ valor de venda  5,00
', NULL, 0.1, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 3, NULL),
  ('b64d02d0-b961-47ac-87ee-b95b4a8fe082', '00000000-0000-0000-0000-000000000001', 'Pão Redondo Miniatura', 'Decoração', 'Bico de 0,2 mm, camada de 0,1 mm, 4 paredes, 15% de preenchimento/ valor de venda 30,90
', NULL, 4, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 4, NULL),
  ('d8a2628e-89b6-4e48-80b9-089546a43c5f', '00000000-0000-0000-0000-000000000001', 'Letreiro Ele Vive', 'Decoração', 'Letreiro Ele Vive _ 0.2mm layer, 2 walls, 15% infill/ valor de venda sem a bandeija 30,9
', NULL, 3.5, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 1, NULL),
  ('d7e0a069-67a3-4b78-87a7-64f2fc7bc789', '00000000-0000-0000-0000-000000000001', 'Coroa de Espinhos de Jesus Cristo', 'Decoração', '0,08 mm camada, 2 paredes, 15% de preenchimento/ valor de venda 6,90
', NULL, 2.2, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 2, NULL),
  ('6de76c62-1cc9-4124-81d2-b0a50f8c8049', '00000000-0000-0000-0000-000000000001', 'Letreiro Foi por Amor', 'Decoração', 'Letreiro "Foi por Amor" - Sem AMS/ valor de venda', NULL, 5.6, '6e45c61c-7162-480b-8984-d8d09f0105d4', 0, 2, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TELA / TABELA: 05B. MATERIAIS DA FICHA TÉCNICA BOM (produto_materiais)
-- ============================================================

INSERT INTO produto_materiais (empresa_id, produto_id, tipo_filamento, filamento_id, quantidade_grams)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'fb8031ae-6ff5-4dba-88b6-153b952cafc3', 'PETG', 'any', 42),
  ('00000000-0000-0000-0000-000000000001', '86eba8b1-35df-4b53-86e3-267eb6231c3e', 'PETG', 'any', 148),
  ('00000000-0000-0000-0000-000000000001', '25037d67-c6c6-47c3-821f-4ff93d3f42d2', 'PETG', 'any', 18),
  ('00000000-0000-0000-0000-000000000001', '3337b8f2-9de8-402d-876f-b696c66a6cde', 'PETG', 'any', 5),
  ('00000000-0000-0000-0000-000000000001', '19b6148b-b6eb-4dc8-8253-bed40df82bd4', 'PETG', 'any', 404),
  ('00000000-0000-0000-0000-000000000001', '4101bd7c-1246-4b4b-85e2-6c2d472aa696', 'PETG', 'any', 204),
  ('00000000-0000-0000-0000-000000000001', 'aa5c38cb-c70f-4ed0-844f-68e22655cf78', 'PETG', 'any', 54),
  ('00000000-0000-0000-0000-000000000001', '202504c8-b160-4e7f-8ce7-43009f56eb8a', 'PETG', 'any', 48),
  ('00000000-0000-0000-0000-000000000001', '71d18f0d-e771-4f68-82b8-05d749d93529', 'PETG', 'any', 36),
  ('00000000-0000-0000-0000-000000000001', 'd1309524-1591-4e3e-89a1-c6d3c374512e', 'PETG', 'any', 36),
  ('00000000-0000-0000-0000-000000000001', 'fe324524-859a-4c9f-84f1-b5d39a9d431f', 'PETG', 'any', 196),
  ('00000000-0000-0000-0000-000000000001', 'a7758352-ed1a-482c-8ab4-e335e71e529b', 'PETG', 'any', 55),
  ('00000000-0000-0000-0000-000000000001', '56a0be22-8920-4511-8ebf-e3cc5952e67e', 'PETG', 'any', 168),
  ('00000000-0000-0000-0000-000000000001', '762f78c3-bb5e-4592-81bd-1df3bb9e9081', 'PLA', 'any', 320),
  ('00000000-0000-0000-0000-000000000001', '87ce3cd8-ecfb-4fce-8942-69cd978b6d27', 'PETG', 'any', 40),
  ('00000000-0000-0000-0000-000000000001', '59b07322-d889-4f20-825a-bbee2826554b', 'PETG', 'any', 90),
  ('00000000-0000-0000-0000-000000000001', '55a96fcd-d8bc-47db-858d-0361e9defc97', 'PETG', 'any', 75),
  ('00000000-0000-0000-0000-000000000001', 'ed125cec-57da-4bf4-860e-acdd82264092', 'PLA', 'any', 35),
  ('00000000-0000-0000-0000-000000000001', '308cc619-2050-4852-8c33-15d96a35ced6', 'PETG', 'any', 2),
  ('00000000-0000-0000-0000-000000000001', 'cc79ceb6-4edf-49f2-8ed0-b4ba2c8a5226', 'PETG', 'any', 88),
  ('00000000-0000-0000-0000-000000000001', '108c0afb-2be6-4f09-8a82-4e2c21d2d318', 'PLA', 'any', 191),
  ('00000000-0000-0000-0000-000000000001', '1baaed13-4130-419a-8488-df6667e1e5fa', 'PETG', 'any', 61),
  ('00000000-0000-0000-0000-000000000001', '9bcbdbaa-701d-4d02-8309-3a6d7c0e5472', 'PLA', 'any', 98),
  ('00000000-0000-0000-0000-000000000001', '3a47ff49-9b1d-4dbb-8aff-08294986da0f', 'PLA', 'any', 52),
  ('00000000-0000-0000-0000-000000000001', 'f3db461a-bdeb-4e22-8916-bbc4af4a2660', 'PLA', 'any', 1),
  ('00000000-0000-0000-0000-000000000001', '1649fae8-beaa-4ba8-8729-20d665cecf55', 'PLA', 'any', 100),
  ('00000000-0000-0000-0000-000000000001', '1fdf2082-802f-49b8-87bb-f00f81bb2d82', 'PLA', 'any', 1),
  ('00000000-0000-0000-0000-000000000001', '671c7a83-a485-457b-85bc-5330a80833ff', 'PLA', 'any', 109),
  ('00000000-0000-0000-0000-000000000001', '23d550d4-1e50-4c15-874d-00932c05badd', 'PLA', 'any', 100),
  ('00000000-0000-0000-0000-000000000001', 'a75887b7-336c-4a9c-8793-627d16091cdd', 'PLA', 'any', 1),
  ('00000000-0000-0000-0000-000000000001', 'b82436be-63d4-486e-817a-bafab0b0ae38', 'PLA', 'any', 38),
  ('00000000-0000-0000-0000-000000000001', 'c53f8eac-28aa-4b65-8157-ce614c44d935', 'PLA', 'any', 73),
  ('00000000-0000-0000-0000-000000000001', '5ef35a72-746c-475d-8c52-6abf5ff50956', 'PETG', 'any', 124),
  ('00000000-0000-0000-0000-000000000001', '7da5f617-b05b-4516-89ec-b96cb1cd3d6d', 'PLA', 'any', 190),
  ('00000000-0000-0000-0000-000000000001', 'b53d2173-7e80-472e-8760-74b797a39bee', 'PLA', 'any', 445),
  ('00000000-0000-0000-0000-000000000001', '050997c5-4963-4b4e-88f1-457b86901b66', 'PLA', 'any', 100),
  ('00000000-0000-0000-0000-000000000001', '0f44a0d2-3029-4e96-8e35-7cc0fb72eadc', 'PLA', 'any', 217),
  ('00000000-0000-0000-0000-000000000001', '660f2451-630c-4fb0-8149-b05bdb2aabb8', 'PLA', 'any', 86),
  ('00000000-0000-0000-0000-000000000001', '72639c6c-10a4-4205-87ad-f827f5ed5664', 'PLA', 'any', 120),
  ('00000000-0000-0000-0000-000000000001', 'd54991ce-c6ed-48f8-80a6-6efae9eb2259', 'PLA', 'any', 198),
  ('00000000-0000-0000-0000-000000000001', '563d7f57-f970-499d-8b39-befc13d827ee', 'PLA', 'any', 198),
  ('00000000-0000-0000-0000-000000000001', 'ba34dad7-1eab-414f-8b6b-3fcea9980ea1', 'PLA', 'any', 1),
  ('00000000-0000-0000-0000-000000000001', '54684f36-6ba0-4f24-824f-663a5f84a366', 'PETG', 'any', 84),
  ('00000000-0000-0000-0000-000000000001', '50188fe5-5506-4024-86f9-962382179bf8', 'PLA', 'any', 240),
  ('00000000-0000-0000-0000-000000000001', 'a1cd77b1-7fc5-4e5d-8906-6ed6aa43023b', 'PLA', 'any', 19),
  ('00000000-0000-0000-0000-000000000001', '1ee370a5-340f-472e-81ad-f3b0257812d9', 'PLA', 'any', 16),
  ('00000000-0000-0000-0000-000000000001', '38577a2d-2200-47f2-8737-9e2dbbec42fd', 'PLA', 'any', 18),
  ('00000000-0000-0000-0000-000000000001', 'bad2d7b7-7e74-48eb-80e1-fe01c1a44883', 'PLA', 'any', 17),
  ('00000000-0000-0000-0000-000000000001', 'bc5bfc5d-4125-4f8f-81a9-f8d80a1838f2', 'PETG', 'any', 1),
  ('00000000-0000-0000-0000-000000000001', '21151d8a-5642-4f89-89b6-36378e4e9801', 'PLA', 'any', 10),
  ('00000000-0000-0000-0000-000000000001', 'e742d3b7-c66d-4a23-826a-3aa57afb980e', 'PLA', 'any', 41),
  ('00000000-0000-0000-0000-000000000001', '3e3a6359-3ad8-470a-807d-c95ffccf4d66', 'PLA', 'any', 500),
  ('00000000-0000-0000-0000-000000000001', '6bb89782-6a43-4b29-8500-af47a04a954d', 'PETG', 'any', 120),
  ('00000000-0000-0000-0000-000000000001', '6ab5dcaa-fefd-4cc7-8ea8-8743c8499c6c', 'PLA', 'any', 80),
  ('00000000-0000-0000-0000-000000000001', '9427aaee-621d-4a84-8e77-f52ec5427671', 'PLA', 'any', 65),
  ('00000000-0000-0000-0000-000000000001', '729fcd11-c99d-49b1-8083-d108587f4ff9', 'PLA', 'any', 15),
  ('00000000-0000-0000-0000-000000000001', 'd6633ef5-7c21-41b1-8353-c4b549b2a11d', 'PLA', 'any', 20),
  ('00000000-0000-0000-0000-000000000001', 'c95d8ec9-1ff0-4bcb-8111-f57a371caea1', 'PETG', 'any', 116),
  ('00000000-0000-0000-0000-000000000001', 'd65ac690-2dd7-4ffd-8986-bde189be982f', 'PLA', 'any', 14),
  ('00000000-0000-0000-0000-000000000001', '8d32c56f-3978-467c-895e-fc9889b3f2a2', 'PLA', 'any', 100),
  ('00000000-0000-0000-0000-000000000001', '305e47a9-b10b-49e9-8e44-c5844113f0e4', 'PLA', 'any', 20),
  ('00000000-0000-0000-0000-000000000001', 'e505e8fa-cbb8-46c4-8873-1c95c8710abb', 'PLA', 'any', 145),
  ('00000000-0000-0000-0000-000000000001', 'a5910168-36eb-41c8-8487-0016ea99efed', 'PLA', 'any', 12),
  ('00000000-0000-0000-0000-000000000001', '19e81800-f880-42f9-8acd-dab9dbfa4367', 'PLA', 'any', 30),
  ('00000000-0000-0000-0000-000000000001', 'c42c3152-a2cf-4047-8cb3-4f8677cd72bf', 'PLA', 'any', 30),
  ('00000000-0000-0000-0000-000000000001', 'bb52039a-d7e0-41dc-8d2a-d28234d994a6', 'PLA', 'any', 172),
  ('00000000-0000-0000-0000-000000000001', '22690559-ed2b-421a-81fe-f7bdf0f5b40a', 'PLA', 'any', 100),
  ('00000000-0000-0000-0000-000000000001', '60896681-b5e8-4253-852f-2067d484fa94', 'PLA', 'any', 60),
  ('00000000-0000-0000-0000-000000000001', '35d5b42e-a115-4de9-8eae-ba159a70e48e', 'PLA', 'any', 90),
  ('00000000-0000-0000-0000-000000000001', '35455716-71e3-420d-8d0d-1782f32c8e0b', 'PLA', 'any', 51),
  ('00000000-0000-0000-0000-000000000001', 'a7714ef0-2e76-458b-8a84-57b37bc4a311', 'PLA', 'any', 1),
  ('00000000-0000-0000-0000-000000000001', 'b64d02d0-b961-47ac-87ee-b95b4a8fe082', 'PLA', 'any', 100),
  ('00000000-0000-0000-0000-000000000001', 'd8a2628e-89b6-4e48-80b9-089546a43c5f', 'PLA', 'any', 125),
  ('00000000-0000-0000-0000-000000000001', 'd7e0a069-67a3-4b78-87a7-64f2fc7bc789', 'PLA', 'any', 9),
  ('00000000-0000-0000-0000-000000000001', '6de76c62-1cc9-4124-81d2-b0a50f8c8049', 'PLA', 'any', 183);


-- ============================================================
-- ELMANEKO 3D ERP — SCRIPTS DE IMPORTAÇÃO (ETL)
-- TELA / TABELA: 06A. ORÇAMENTOS
-- Registros a inserir: 16
-- ============================================================

INSERT INTO orcamentos (id, empresa_id, numero, cliente_id, data_emissao, validade, desconto_geral, status, observacoes)
VALUES
  ('a771f809-0771-4590-8598-96bf28bbdbf1', '00000000-0000-0000-0000-000000000001', 'ORC-2026-428', '07822f20-f4e8-4ecc-82d4-729825fa23b4', '2026-06-25', '2026-07-25', 0, 'Aprovado', 'valor repassado ao cliente 79,00'),
  ('60f0b488-e7d2-4ac9-88e1-16dca9d13d72', '00000000-0000-0000-0000-000000000001', 'ORC-2026-935', 'a2f9ac0a-4d80-461a-8cd5-fb498121e630', '2026-06-25', '2026-07-25', 0, 'Aberto', 'valor informado para cliente 148,40'),
  ('a7cf5d74-e4d8-40a9-8486-853130ebc1cf', '00000000-0000-0000-0000-000000000001', 'ORC-2026-499', 'f8a46d5f-b0b1-401a-8ad1-65651fb097bf', '2026-06-25', '2026-07-25', 0, 'Aprovado', 'valor informado 70,00'),
  ('70e54850-3d66-43e1-825c-9234382d4880', '00000000-0000-0000-0000-000000000001', 'ORC-2026-547', '9a39c7b6-b257-45c5-804f-5fc32dcca0d7', '2026-06-26', '2026-07-26', 0, 'Aberto', 'valor informado ao cliente 69,90 unitário / valor total 139,80'),
  ('f3637020-6034-4fef-84a6-134963989c62', '00000000-0000-0000-0000-000000000001', 'ORC-2026-933', '54e2f238-e0ec-492b-8e26-08c7d656ec03', '2026-06-26', '2026-07-26', 0, 'Aprovado', 'valor informado 70,00'),
  ('d08d026b-7422-4ab5-897e-a95d9acae66c', '00000000-0000-0000-0000-000000000001', 'ORC-2026-536', 'a2f9ac0a-4d80-461a-8cd5-fb498121e630', '2026-06-28', '2026-07-28', 0, 'Aprovado', '19,90'),
  ('ffbac7a3-b2a8-4e76-891d-4dc8c959698a', '00000000-0000-0000-0000-000000000001', 'ORC-2026-274', '2e07515b-821e-44a4-8104-cca2218a2a0c', '2026-07-04', '2026-08-03', 0, 'Aberto', NULL),
  ('879c6953-816d-4f9c-87bf-f43907232b80', '00000000-0000-0000-0000-000000000001', 'ORC-2026-949', '1fce49aa-cbd4-447c-883f-7ba243e0ad5c', '2026-07-09', '2026-08-08', 0, 'Aprovado', NULL),
  ('8c187ee2-3dce-4bab-8f62-8e1190c4447a', '00000000-0000-0000-0000-000000000001', 'ORC-2026-723', 'e469d194-e18e-4fd4-8b83-94acf2c20c38', '2026-07-10', '2026-08-09', 0, 'Aberto', NULL),
  ('0fc3d8c1-932e-4667-86a0-418419b85b8f', '00000000-0000-0000-0000-000000000001', 'ORC-2026-248', '562e7918-7aad-4513-859f-a3672f69fda2', '2026-07-10', '2026-08-09', 0, 'Aberto', NULL),
  ('7a8da6f8-5531-42f8-8c4e-787a694d9601', '00000000-0000-0000-0000-000000000001', 'ORC-2026-945', 'dfe8f3b4-b172-4db8-8437-705374b0095a', '2026-07-10', '2026-08-09', 0, 'Aprovado', NULL),
  ('46002181-93a1-442b-89d5-2ffbcb7a9f3f', '00000000-0000-0000-0000-000000000001', 'ORC-2026-346', 'c6c75e5a-96ee-4e8d-8a12-3e7f809cec5e', '2026-07-10', '2026-08-09', 0, 'Aprovado', NULL),
  ('9630a34f-4cae-4590-822c-469e6a239127', '00000000-0000-0000-0000-000000000001', 'ORC-2026-427', 'dfe8f3b4-b172-4db8-8437-705374b0095a', '2026-07-10', '2026-08-09', 0, 'Aberto', NULL),
  ('f630b376-4721-48f2-81da-ea767251f03a', '00000000-0000-0000-0000-000000000001', 'ORC-2026-695', 'db31f0ff-00e6-464f-897e-c0484c388205', '2026-07-14', '2026-08-13', 0, 'Aprovado', NULL),
  ('5ccddd0d-1ffe-49fb-8aff-ba3e4c8e19c1', '00000000-0000-0000-0000-000000000001', 'ORC-2026-782', '07822f20-f4e8-4ecc-82d4-729825fa23b4', '2026-07-14', '2026-08-13', 0, 'Aberto', NULL),
  ('1577cc4f-53c3-4e19-80d6-cd31e85886b7', '00000000-0000-0000-0000-000000000001', 'ORC-2026-931', '1f244ac2-6620-4d46-817f-74b0caf903ff', '2026-07-19', '2026-08-18', 0, 'Aberto', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TELA / TABELA: 06B. ITENS DE ORÇAMENTO (orcamento_itens)
-- ============================================================

INSERT INTO orcamento_itens (empresa_id, orcamento_id, produto_id, quantidade, valor_unitario, desconto)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'a771f809-0771-4590-8598-96bf28bbdbf1', '7da5f617-b05b-4516-89ec-b96cb1cd3d6d', 1, 30, 0),
  ('00000000-0000-0000-0000-000000000001', 'a771f809-0771-4590-8598-96bf28bbdbf1', 'c53f8eac-28aa-4b65-8157-ce614c44d935', 2, 12, 0),
  ('00000000-0000-0000-0000-000000000001', 'a771f809-0771-4590-8598-96bf28bbdbf1', '5ef35a72-746c-475d-8c52-6abf5ff50956', 1, 15, 0),
  ('00000000-0000-0000-0000-000000000001', 'a771f809-0771-4590-8598-96bf28bbdbf1', '9bcbdbaa-701d-4d02-8309-3a6d7c0e5472', 1, 10, 0),
  ('00000000-0000-0000-0000-000000000001', '60f0b488-e7d2-4ac9-88e1-16dca9d13d72', 'b53d2173-7e80-472e-8760-74b797a39bee', 1, 91.5, 0),
  ('00000000-0000-0000-0000-000000000001', '60f0b488-e7d2-4ac9-88e1-16dca9d13d72', '050997c5-4963-4b4e-88f1-457b86901b66', 1, 25, 0),
  ('00000000-0000-0000-0000-000000000001', '60f0b488-e7d2-4ac9-88e1-16dca9d13d72', 'c95d8ec9-1ff0-4bcb-8111-f57a371caea1', 1, 25.9, 0),
  ('00000000-0000-0000-0000-000000000001', 'a7cf5d74-e4d8-40a9-8486-853130ebc1cf', '0f44a0d2-3029-4e96-8e35-7cc0fb72eadc', 1, 69, 0),
  ('00000000-0000-0000-0000-000000000001', '70e54850-3d66-43e1-825c-9234382d4880', '50188fe5-5506-4024-86f9-962382179bf8', 2, 70, 0),
  ('00000000-0000-0000-0000-000000000001', 'f3637020-6034-4fef-84a6-134963989c62', 'd54991ce-c6ed-48f8-80a6-6efae9eb2259', 1, 70, 0),
  ('00000000-0000-0000-0000-000000000001', 'd08d026b-7422-4ab5-897e-a95d9acae66c', '59b07322-d889-4f20-825a-bbee2826554b', 1, 19.9, 0),
  ('00000000-0000-0000-0000-000000000001', 'ffbac7a3-b2a8-4e76-891d-4dc8c959698a', '6ab5dcaa-fefd-4cc7-8ea8-8743c8499c6c', 1, 50, 0),
  ('00000000-0000-0000-0000-000000000001', 'ffbac7a3-b2a8-4e76-891d-4dc8c959698a', '6bb89782-6a43-4b29-8500-af47a04a954d', 1, 34.9, 0),
  ('00000000-0000-0000-0000-000000000001', 'ffbac7a3-b2a8-4e76-891d-4dc8c959698a', 'e742d3b7-c66d-4a23-826a-3aa57afb980e', 1, 29.9, 0),
  ('00000000-0000-0000-0000-000000000001', '879c6953-816d-4f9c-87bf-f43907232b80', '729fcd11-c99d-49b1-8083-d108587f4ff9', 5, 15.9, 0),
  ('00000000-0000-0000-0000-000000000001', '879c6953-816d-4f9c-87bf-f43907232b80', '21151d8a-5642-4f89-89b6-36378e4e9801', 10, 11.9, 0),
  ('00000000-0000-0000-0000-000000000001', '8c187ee2-3dce-4bab-8f62-8e1190c4447a', '9427aaee-621d-4a84-8e77-f52ec5427671', 1, 25, 0),
  ('00000000-0000-0000-0000-000000000001', '0fc3d8c1-932e-4667-86a0-418419b85b8f', '9427aaee-621d-4a84-8e77-f52ec5427671', 1, 25, 0),
  ('00000000-0000-0000-0000-000000000001', '7a8da6f8-5531-42f8-8c4e-787a694d9601', 'a1cd77b1-7fc5-4e5d-8906-6ed6aa43023b', 1, 19, 0),
  ('00000000-0000-0000-0000-000000000001', '46002181-93a1-442b-89d5-2ffbcb7a9f3f', 'd65ac690-2dd7-4ffd-8986-bde189be982f', 2, 7, 0),
  ('00000000-0000-0000-0000-000000000001', '9630a34f-4cae-4590-822c-469e6a239127', '1ee370a5-340f-472e-81ad-f3b0257812d9', 1, 15.9, 0),
  ('00000000-0000-0000-0000-000000000001', 'f630b376-4721-48f2-81da-ea767251f03a', '305e47a9-b10b-49e9-8e44-c5844113f0e4', 1, 13.9, 0),
  ('00000000-0000-0000-0000-000000000001', '5ccddd0d-1ffe-49fb-8aff-ba3e4c8e19c1', 'e505e8fa-cbb8-46c4-8873-1c95c8710abb', 1, 42.9, 0),
  ('00000000-0000-0000-0000-000000000001', '1577cc4f-53c3-4e19-80d6-cd31e85886b7', 'a5910168-36eb-41c8-8487-0016ea99efed', 2, 12.9, 0),
  ('00000000-0000-0000-0000-000000000001', '1577cc4f-53c3-4e19-80d6-cd31e85886b7', '19e81800-f880-42f9-8acd-dab9dbfa4367', 1, 16.9, 0);


-- ============================================================
-- ELMANEKO 3D ERP — SCRIPTS DE IMPORTAÇÃO (ETL)
-- TELA / TABELA: 07. VENDAS REALIZADAS
-- Registros a inserir: 8
-- ============================================================

INSERT INTO vendas (id, empresa_id, cliente_id, data, valor_total, forma_pagamento, status, orcamento_origem_id)
VALUES
  ('006a5ae6-4d6d-4448-8f60-df28aabb8c1c', '00000000-0000-0000-0000-000000000001', 'a2f9ac0a-4d80-461a-8cd5-fb498121e630', '2026-06-30', 19.9, 'Pix', 'Pago', 'd08d026b-7422-4ab5-897e-a95d9acae66c'),
  ('bef8117c-ae57-4573-8a5e-7ba12c3f0f57', '00000000-0000-0000-0000-000000000001', '54e2f238-e0ec-492b-8e26-08c7d656ec03', '2026-06-30', 70, 'Pix', 'Pago', 'f3637020-6034-4fef-84a6-134963989c62'),
  ('fe736a69-9592-4243-8fbd-3df486822696', '00000000-0000-0000-0000-000000000001', '07822f20-f4e8-4ecc-82d4-729825fa23b4', '2026-07-03', 79, 'Pix', 'Pago', 'a771f809-0771-4590-8598-96bf28bbdbf1'),
  ('5c6d8d35-9737-4b97-82a6-51596364d8bc', '00000000-0000-0000-0000-000000000001', 'f8a46d5f-b0b1-401a-8ad1-65651fb097bf', '2026-07-08', 69, 'Pix', 'Pago', 'a7cf5d74-e4d8-40a9-8486-853130ebc1cf'),
  ('f972cd27-1e9e-40ae-8a41-880eaef9426c', '00000000-0000-0000-0000-000000000001', 'dfe8f3b4-b172-4db8-8437-705374b0095a', '2026-07-10', 19, 'Dinheiro', 'Pago', '7a8da6f8-5531-42f8-8c4e-787a694d9601'),
  ('f4679abc-fe41-478d-81f7-4186bfccd164', '00000000-0000-0000-0000-000000000001', 'c6c75e5a-96ee-4e8d-8a12-3e7f809cec5e', '2026-07-10', 14, 'Pix', 'Pago', '46002181-93a1-442b-89d5-2ffbcb7a9f3f'),
  ('c783d6e1-cc6e-470b-8a20-c2264608f6ba', '00000000-0000-0000-0000-000000000001', 'db31f0ff-00e6-464f-897e-c0484c388205', '2026-07-14', 13.9, 'Pix', 'Pago', 'f630b376-4721-48f2-81da-ea767251f03a'),
  ('9588c523-18f5-4deb-823f-efd1d14eaaaf', '00000000-0000-0000-0000-000000000001', '1fce49aa-cbd4-447c-883f-7ba243e0ad5c', '2026-07-20', 198.5, 'Pix', 'Pago', '879c6953-816d-4f9c-87bf-f43907232b80')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- ELMANEKO 3D ERP — SCRIPTS DE IMPORTAÇÃO (ETL)
-- TELA / TABELA: 08. COMPRAS DE INSUMOS
-- Registros a inserir: 1
-- ============================================================

INSERT INTO compras (id, empresa_id, data, fornecedor, filamento_id, quantidade_adquirida, valor_pago, nota_fiscal, observacoes)
VALUES
  ('707ee60d-6717-4a99-8b47-b466cfeb4606', '00000000-0000-0000-0000-000000000001', '2026-07-10', 'Mercado Livre', '8d0c89f3-2936-4b63-8321-c2d196123e24', 1000, 124.9, NULL, 'pago com saldo da conta Elmaneko Mercado Pago')
ON CONFLICT (id) DO NOTHING;
