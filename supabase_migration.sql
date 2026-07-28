-- ============================================================
-- ELMANEKO 3D ERP — Migração Completa de Tabelas e RLS
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. EMPRESAS (Multi-Tenant & Perfil Emissor)
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE empresas ADD COLUMN IF NOT EXISTS razao_social TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS responsavel TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cargo_responsavel TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS pix_chave TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS pix_tipo TEXT DEFAULT 'CNPJ';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS slogan TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS logotipo_url TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Garantir Empresa Demo Padrão
INSERT INTO empresas (id, nome, razao_social, cnpj, email, telefone, whatsapp, endereco, responsavel, cargo_responsavel, pix_chave, slogan)
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'ELMANEKO 3D',
  'ELMANEKO 3D LTDA',
  '12.345.678/0001-99',
  'contato@elmaneko3d.com',
  '(11) 3333-3333',
  '(11) 99999-9999',
  'Rua da Extrusora, 3D - Parque Tecnológico, SP',
  'Guilherme Braga',
  'Gestor Administrativo',
  '12.345.678/0001-99',
  'Impressão 3D de Alta Fidelidade'
)
ON CONFLICT (id) DO NOTHING;

-- 2. USUÁRIO -> EMPRESA
CREATE TABLE IF NOT EXISTS usuario_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, empresa_id)
);

-- 3. FILAMENTOS
CREATE TABLE IF NOT EXISTS filamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  marca TEXT NOT NULL,
  cor TEXT NOT NULL,
  peso_total NUMERIC NOT NULL DEFAULT 1000,
  quantidade_disponivel NUMERIC NOT NULL DEFAULT 1000,
  valor_compra NUMERIC NOT NULL DEFAULT 0,
  data_compra DATE DEFAULT CURRENT_DATE,
  fornecedor TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf_cnpj TEXT,
  telefone TEXT,
  whatsapp TEXT NOT NULL,
  email TEXT,
  endereco TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. IMPRESSORAS
CREATE TABLE IF NOT EXISTS impressoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  potencia_watts NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Ativa',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TARIFAS DE ENERGIA
CREATE TABLE IF NOT EXISTS tarifas_energia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data_inicio_vigencia DATE DEFAULT CURRENT_DATE,
  valor_kwh NUMERIC NOT NULL DEFAULT 0.85,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. PRODUTOS (Catálogo & Ficha Técnica)
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT,
  imagem TEXT,
  tempo_impressao NUMERIC NOT NULL DEFAULT 0,
  impressora_padrao_id UUID REFERENCES impressoras(id) ON DELETE SET NULL,
  tempo_acabamento NUMERIC NOT NULL DEFAULT 0,
  valor_mao_de_obra NUMERIC NOT NULL DEFAULT 0,
  margem_lucro NUMERIC DEFAULT 100,
  over_percent NUMERIC DEFAULT 0,
  preco_venda NUMERIC DEFAULT 0,
  pdf_projeto TEXT,
  pdf_projeto_nome TEXT,
  link_projeto TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE produtos ADD COLUMN IF NOT EXISTS margem_lucro NUMERIC DEFAULT 100;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS over_percent NUMERIC DEFAULT 0;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS preco_venda NUMERIC DEFAULT 0;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS pdf_projeto TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS pdf_projeto_nome TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS link_projeto TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS outras_despesas NUMERIC DEFAULT 0;

-- 8. PRODUTO MATERIAIS (BOM - Bill of Materials)
CREATE TABLE IF NOT EXISTS produto_materiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tipo_filamento TEXT NOT NULL,
  filamento_id TEXT NOT NULL DEFAULT 'any',
  quantidade_grams NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. PRODUÇÕES (Ordens de Produção)
CREATE TABLE IF NOT EXISTS producoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  data DATE DEFAULT CURRENT_DATE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL DEFAULT 1,
  impressora_id UUID NOT NULL REFERENCES impressoras(id) ON DELETE CASCADE,
  operador TEXT,
  status TEXT NOT NULL DEFAULT 'Pendente',
  custo_filamento NUMERIC NOT NULL DEFAULT 0,
  custo_energia NUMERIC NOT NULL DEFAULT 0,
  custo_mao_de_obra NUMERIC NOT NULL DEFAULT 0,
  custo_total NUMERIC NOT NULL DEFAULT 0,
  custo_unitario NUMERIC NOT NULL DEFAULT 0,
  mao_de_obra_escolha TEXT DEFAULT 'unitario',
  mao_de_obra_valor NUMERIC DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. ORÇAMENTOS
CREATE TABLE IF NOT EXISTS orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  data_emissao DATE DEFAULT CURRENT_DATE,
  validade DATE,
  previsao_entrega DATE,
  desconto_geral NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'Aberto',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS previsao_entrega DATE;

-- 11. ORÇAMENTO ITENS
CREATE TABLE IF NOT EXISTS orcamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  orcamento_id UUID NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario NUMERIC NOT NULL DEFAULT 0,
  desconto NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. VENDAS
CREATE TABLE IF NOT EXISTS vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  data DATE DEFAULT CURRENT_DATE,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  forma_pagamento TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pago',
  orcamento_origem_id UUID REFERENCES orcamentos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. COMPRAS
CREATE TABLE IF NOT EXISTS compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data DATE DEFAULT CURRENT_DATE,
  fornecedor TEXT NOT NULL,
  categoria_item TEXT DEFAULT 'Filamento',
  descricao_item TEXT,
  quantidade NUMERIC DEFAULT 1,
  filamento_id UUID REFERENCES filamentos(id) ON DELETE SET NULL,
  quantidade_adquirida NUMERIC NOT NULL DEFAULT 0,
  valor_pago NUMERIC NOT NULL DEFAULT 0,
  nota_fiscal TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE compras ADD COLUMN IF NOT EXISTS categoria_item TEXT DEFAULT 'Filamento';
ALTER TABLE compras ADD COLUMN IF NOT EXISTS descricao_item TEXT;
ALTER TABLE compras ADD COLUMN IF NOT EXISTS quantidade NUMERIC DEFAULT 1;

-- ============================================================
-- SEGURANÇA: HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE filamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE impressoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarifas_energia ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE producoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLÍTICAS DE ACESSO (RLS PERMISSIVO DEMO / MULTI-TENANT)
-- ============================================================
DO $$ 
BEGIN
  -- Permissões gerais baseadas na empresa_id ou modo demo
  DROP POLICY IF EXISTS "filamentos_policy" ON filamentos;
  CREATE POLICY "filamentos_policy" ON filamentos FOR ALL USING (true);

  DROP POLICY IF EXISTS "clientes_policy" ON clientes;
  CREATE POLICY "clientes_policy" ON clientes FOR ALL USING (true);

  DROP POLICY IF EXISTS "impressoras_policy" ON impressoras;
  CREATE POLICY "impressoras_policy" ON impressoras FOR ALL USING (true);

  DROP POLICY IF EXISTS "tarifas_energia_policy" ON tarifas_energia;
  CREATE POLICY "tarifas_energia_policy" ON tarifas_energia FOR ALL USING (true);

  DROP POLICY IF EXISTS "produtos_policy" ON produtos;
  CREATE POLICY "produtos_policy" ON produtos FOR ALL USING (true);

  DROP POLICY IF EXISTS "produto_materiais_policy" ON produto_materiais;
  CREATE POLICY "produto_materiais_policy" ON produto_materiais FOR ALL USING (true);

  DROP POLICY IF EXISTS "producoes_policy" ON producoes;
  CREATE POLICY "producoes_policy" ON producoes FOR ALL USING (true);

  DROP POLICY IF EXISTS "orcamentos_policy" ON orcamentos;
  CREATE POLICY "orcamentos_policy" ON orcamentos FOR ALL USING (true);

  DROP POLICY IF EXISTS "orcamento_itens_policy" ON orcamento_itens;
  CREATE POLICY "orcamento_itens_policy" ON orcamento_itens FOR ALL USING (true);

  DROP POLICY IF EXISTS "vendas_policy" ON vendas;
  CREATE POLICY "vendas_policy" ON vendas FOR ALL USING (true);

  DROP POLICY IF EXISTS "compras_policy" ON compras;
  CREATE POLICY "compras_policy" ON compras FOR ALL USING (true);
END $$;

-- ============================================================
-- ÍNDICES DE PERFORMANCE DE CONSULTA
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_filamentos_empresa ON filamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_impressoras_empresa ON impressoras(empresa_id);
CREATE INDEX IF NOT EXISTS idx_produtos_empresa ON produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_produto_materiais_produto ON produto_materiais(produto_id);
CREATE INDEX IF NOT EXISTS idx_producoes_empresa ON producoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_empresa ON orcamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_orcamento ON orcamento_itens(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_vendas_empresa ON vendas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_compras_empresa ON compras(empresa_id);
