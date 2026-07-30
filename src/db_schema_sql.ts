export const SUPABASE_SQL_SCHEMA = `-- ELMANEKO 3D ERP — Migração Completa de Tabelas e RLS
-- Execute este script no SQL Editor do Supabase

-- 1. EMPRESAS (Multi-Tenant & Perfil Emissor)
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cnpj TEXT;
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
ALTER TABLE compras ADD COLUMN IF NOT EXISTS unidade_medida TEXT DEFAULT 'un';

-- 13.5 INSUMOS (MATERIAIS DIVERSOS)
CREATE TABLE IF NOT EXISTS insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Cola / Adesivo',
  unidade_medida TEXT DEFAULT 'un',
  quantidade_estoque NUMERIC DEFAULT 0,
  estoque_minimo NUMERIC DEFAULT 5,
  custo_unitario_padrao NUMERIC DEFAULT 0,
  fornecedor_padrao TEXT,
  tipo_filamento TEXT,
  cor TEXT,
  filamento_id UUID REFERENCES filamentos(id) ON DELETE SET NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE compras ADD COLUMN IF NOT EXISTS insumo_id UUID REFERENCES insumos(id) ON DELETE SET NULL;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;

-- 14. MÓDULO FINANCEIRO
CREATE TABLE IF NOT EXISTS contas_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Conta Bancaria',
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  digito TEXT,
  bandeira TEXT,
  limite NUMERIC DEFAULT 0,
  limite_disponivel NUMERIC DEFAULT 0,
  dia_fechamento INT,
  dia_vencimento INT,
  saldo_inicial NUMERIC DEFAULT 0,
  saldo_atual NUMERIC DEFAULT 0,
  situacao TEXT DEFAULT 'Ativa',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categorias_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Despesa',
  categoria_pai_id UUID REFERENCES categorias_financeiras(id) ON DELETE SET NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS centros_custo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lancamentos_financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  numero_documento TEXT NOT NULL,
  tipo TEXT NOT NULL,
  origem TEXT NOT NULL DEFAULT 'Avulso',
  origem_id UUID,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  fornecedor TEXT,
  data_emissao DATE DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  data_liquidacao DATE,
  valor_bruto NUMERIC NOT NULL DEFAULT 0,
  desconto NUMERIC DEFAULT 0,
  acrescimo NUMERIC DEFAULT 0,
  valor_liquido NUMERIC NOT NULL DEFAULT 0,
  valor_pago NUMERIC DEFAULT 0,
  juros_multa NUMERIC DEFAULT 0,
  forma_pagamento TEXT DEFAULT 'PIX',
  conta_financeira_id UUID REFERENCES contas_financeiras(id) ON DELETE SET NULL,
  categoria_id UUID REFERENCES categorias_financeiras(id) ON DELETE SET NULL,
  centro_custo_id UUID REFERENCES centros_custo(id) ON DELETE SET NULL,
  parcela_atual INT DEFAULT 1,
  total_parcelas INT DEFAULT 1,
  parcela_pai_id UUID REFERENCES lancamentos_financeiros(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Aberto',
  conciliado BOOLEAN DEFAULT false,
  tipo_conciliacao TEXT,
  observacoes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS movimentacoes_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  conta_financeira_id UUID NOT NULL REFERENCES contas_financeiras(id) ON DELETE CASCADE,
  lancamento_id UUID REFERENCES lancamentos_financeiros(id) ON DELETE SET NULL,
  data DATE DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  saldo_anterior NUMERIC DEFAULT 0,
  saldo_posterior NUMERIC DEFAULT 0,
  descricao TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transferencias_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data DATE DEFAULT CURRENT_DATE,
  conta_origem_id UUID NOT NULL REFERENCES contas_financeiras(id) ON DELETE CASCADE,
  conta_destino_id UUID NOT NULL REFERENCES contas_financeiras(id) ON DELETE CASCADE,
  valor NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auditoria_financeira (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data_hora TIMESTAMPTZ DEFAULT now(),
  usuario TEXT NOT NULL,
  ip TEXT,
  operacao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id UUID NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT
);

-- RLS & POLICIES
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
ALTER TABLE contas_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE centros_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE transferencias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_financeira ENABLE ROW LEVEL SECURITY;

-- MIGRAÇÃO DE PRESERVAÇÃO DE DADOS EXISTENTES (Garantir que todos os registros fiquem vinculados à Empresa Padrão)
UPDATE filamentos SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE clientes SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE impressoras SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE tarifas_energia SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE produtos SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE producoes SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE orcamentos SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE vendas SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE compras SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE insumos SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE contas_financeiras SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE categorias_financeiras SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE centros_custo SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE lancamentos_financeiros SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE movimentacoes_financeiras SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE transferencias_financeiras SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;

-- ASSOCIAR USUÁRIO AUTENTICADO ATUAL À EMPRESA PADRÃO
INSERT INTO usuario_empresa (user_id, empresa_id)
SELECT auth.uid(), '00000000-0000-0000-0000-000000000001'
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, empresa_id) DO NOTHING;

-- FUNÇÃO AUXILIAR DE SEGURANÇA MULTI-TENANT
CREATE OR REPLACE FUNCTION get_user_empresa_ids()
RETURNS SETOF UUID AS $$
  SELECT empresa_id FROM usuario_empresa WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- POLÍTICAS RLS ESTRITAS POR TENANT
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'empresas', 'filamentos', 'clientes', 'impressoras', 'tarifas_energia', 
    'produtos', 'produto_materiais', 'producoes', 'orcamentos', 'orcamento_itens', 
    'vendas', 'compras', 'insumos', 'contas_financeiras', 'categorias_financeiras', 
    'centros_custo', 'lancamentos_financeiros', 'movimentacoes_financeiras', 
    'transferencias_financeiras', 'auditoria_financeira'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_%s" ON %I;', tbl, tbl);
    IF tbl = 'empresas' THEN
      EXECUTE format('CREATE POLICY "tenant_isolation_%s" ON %I FOR ALL USING (id IN (SELECT get_user_empresa_ids())) WITH CHECK (id IN (SELECT get_user_empresa_ids()));', tbl, tbl);
    ELSE
      EXECUTE format('CREATE POLICY "tenant_isolation_%s" ON %I FOR ALL USING (empresa_id IN (SELECT get_user_empresa_ids())) WITH CHECK (empresa_id IN (SELECT get_user_empresa_ids()));', tbl, tbl);
    END IF;
  END LOOP;
END $$;

-- STORED PROCEDURES (RPCs ATÔMICAS PARA INTEGRIDADE FINANCEIRA)

-- 1. Liquidar Lançamento Financeiro
CREATE OR REPLACE FUNCTION liquidar_lancamento_financeiro(
  p_lancamento_id UUID,
  p_conta_id UUID,
  p_valor_pago NUMERIC,
  p_data_liquidacao DATE DEFAULT CURRENT_DATE
) RETURNS VOID AS $$
DECLARE
  v_empresa_id UUID;
  v_tipo TEXT;
  v_valor_bruto NUMERIC;
BEGIN
  SELECT empresa_id, tipo, valor_bruto INTO v_empresa_id, v_tipo, v_valor_bruto
  FROM lancamentos_financeiros WHERE id = p_lancamento_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lançamento financeiro não encontrado.';
  END IF;

  -- Atualizar Lançamento
  UPDATE lancamentos_financeiros
  SET status = 'Liquidado',
      data_liquidacao = p_data_liquidacao,
      valor_pago = p_valor_pago,
      conta_financeira_id = p_conta_id
  WHERE id = p_lancamento_id;

  -- Atualizar Saldo da Conta
  IF v_tipo = 'Receita' THEN
    UPDATE contas_financeiras
    SET saldo_atual = saldo_atual + p_valor_pago
    WHERE id = p_conta_id;
  ELSE
    UPDATE contas_financeiras
    SET saldo_atual = saldo_atual - p_valor_pago
    WHERE id = p_conta_id;
  END IF;

  -- Registrar Movimentação
  INSERT INTO movimentacoes_financeiras (
    empresa_id, conta_financeira_id, lancamento_id, data, tipo, valor, descricao
  ) VALUES (
    v_empresa_id, p_conta_id, p_lancamento_id, p_data_liquidacao, v_tipo, p_valor_pago, 'Liquidação de lançamento'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Transferência Entre Contas
CREATE OR REPLACE FUNCTION transferir_saldo_financeiro(
  p_conta_origem_id UUID,
  p_conta_destino_id UUID,
  p_valor NUMERIC,
  p_observacoes TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_empresa_id UUID;
BEGIN
  SELECT empresa_id INTO v_empresa_id FROM contas_financeiras WHERE id = p_conta_origem_id;

  -- Debitar Origem
  UPDATE contas_financeiras SET saldo_atual = saldo_atual - p_valor WHERE id = p_conta_origem_id;
  -- Creditar Destino
  UPDATE contas_financeiras SET saldo_atual = saldo_atual + p_valor WHERE id = p_conta_destino_id;

  -- Registrar Transferência
  INSERT INTO transferencias_financeiras (
    empresa_id, conta_origem_id, conta_destino_id, valor, observacoes
  ) VALUES (
    v_empresa_id, p_conta_origem_id, p_conta_destino_id, p_valor, p_observacoes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Conversão de Orçamento em Venda
CREATE OR REPLACE FUNCTION converter_orcamento_venda(
  p_orcamento_id UUID
) RETURNS UUID AS $$
DECLARE
  v_orc ORCAMENTOS%ROWTYPE;
  v_venda_id UUID;
BEGIN
  SELECT * INTO v_orc FROM orcamentos WHERE id = p_orcamento_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orçamento não encontrado.';
  END IF;

  v_venda_id := gen_random_uuid();

  -- Criar Venda
  INSERT INTO vendas (
    id, empresa_id, cliente_id, data, valor_total, forma_pagamento, status, orcamento_origem_id
  ) VALUES (
    v_venda_id, v_orc.empresa_id, v_orc.cliente_id, CURRENT_DATE, v_orc.valor_total, 'PIX', 'Aprovada', p_orcamento_id
  );

  -- Atualizar Status do Orçamento
  UPDATE orcamentos SET status = 'Aprovado' WHERE id = p_orcamento_id;

  RETURN v_venda_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;
