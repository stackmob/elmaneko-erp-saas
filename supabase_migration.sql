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

-- 2. USUÁRIO -> EMPRESA
CREATE TABLE IF NOT EXISTS usuario_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, empresa_id)
);

ALTER TABLE usuario_empresa ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin';

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

-- Compatibility columns used by the application and by the conversion RPC.
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS numero TEXT;

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

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  filamento_id UUID NOT NULL REFERENCES filamentos(id) ON DELETE RESTRICT,
  producao_id UUID REFERENCES producoes(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Entrada', 'Saida')),
  quantidade NUMERIC NOT NULL CHECK (quantidade > 0),
  saldo_anterior NUMERIC NOT NULL,
  saldo_posterior NUMERIC NOT NULL,
  descricao TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE compras ADD COLUMN IF NOT EXISTS insumo_id UUID REFERENCES insumos(id) ON DELETE SET NULL;

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

-- ============================================================
-- HABILITAR RLS NAS 20 TABELAS DO SISTEMA
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
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE centros_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE transferencias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_financeira ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SEGURANÇA MULTI-TENANT (POLÍTICAS ESTRITAS VIA HAS_ACCESS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_empresa_member(target_empresa_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuario_empresa ue
    WHERE ue.empresa_id = target_empresa_id AND ue.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_empresa_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_empresa_member(UUID) TO authenticated;

-- Políticas Específicas para Empresas e Usuario_Empresa
DROP POLICY IF EXISTS empresas_select_member ON empresas;
DROP POLICY IF EXISTS empresas_insert_authenticated ON empresas;
DROP POLICY IF EXISTS empresas_update_member ON empresas;
CREATE POLICY empresas_select_member ON empresas FOR SELECT TO authenticated USING (public.is_empresa_member(id));
CREATE POLICY empresas_update_member ON empresas FOR UPDATE TO authenticated USING (public.is_empresa_member(id)) WITH CHECK (public.is_empresa_member(id));

DROP POLICY IF EXISTS usuario_empresa_select_self ON usuario_empresa;
DROP POLICY IF EXISTS usuario_empresa_insert_self ON usuario_empresa;
CREATE POLICY usuario_empresa_select_self ON usuario_empresa FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Membership is managed exclusively by server-side functions.  Allowing an
-- authenticated user to insert its own row here would let it join any tenant
-- whose UUID became known.
REVOKE INSERT, UPDATE, DELETE ON public.usuario_empresa FROM authenticated;

CREATE OR REPLACE FUNCTION public.bootstrap_empresa_do_usuario()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_empresa_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória.';
  END IF;

  -- Serializes first-login provisioning for a user, including React StrictMode
  -- and duplicated auth callbacks.
  PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text));

  SELECT empresa_id INTO v_empresa_id
  FROM public.usuario_empresa
  WHERE user_id = v_user_id
  ORDER BY created_at
  LIMIT 1;

  IF v_empresa_id IS NOT NULL THEN
    RETURN v_empresa_id;
  END IF;

  INSERT INTO public.empresas (nome)
  VALUES ('Empresa Principal')
  RETURNING id INTO v_empresa_id;

  INSERT INTO public.usuario_empresa (user_id, empresa_id, role)
  VALUES (v_user_id, v_empresa_id, 'admin');

  RETURN v_empresa_id;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_empresa_do_usuario() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_empresa_do_usuario() TO authenticated;

-- Aplicação Única e Estrita das Políticas Multi-Tenant em TODAS as Tabelas Operacionais e Financeiras
DO $$
DECLARE tenant_table TEXT;
BEGIN
  FOREACH tenant_table IN ARRAY ARRAY[
    'filamentos', 'clientes', 'impressoras', 'tarifas_energia', 'produtos',
    'produto_materiais', 'producoes', 'orcamentos', 'orcamento_itens', 'vendas',
    'compras', 'insumos', 'contas_financeiras', 'categorias_financeiras',
    'centros_custo', 'lancamentos_financeiros', 'movimentacoes_financeiras',
    'transferencias_financeiras', 'auditoria_financeira', 'movimentacoes_estoque'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tenant_table || '_policy', tenant_table);
    EXECUTE format('DROP POLICY IF EXISTS tenant_access ON public.%I', tenant_table);
    EXECUTE format('CREATE POLICY tenant_access ON public.%I FOR ALL TO authenticated USING (public.is_empresa_member(empresa_id)) WITH CHECK (public.is_empresa_member(empresa_id))', tenant_table);
  END LOOP;
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
CREATE INDEX IF NOT EXISTS idx_contas_financeiras_empresa ON contas_financeiras(empresa_id);
CREATE INDEX IF NOT EXISTS idx_categorias_financeiras_empresa ON categorias_financeiras(empresa_id);
CREATE INDEX IF NOT EXISTS idx_centros_custo_empresa ON centros_custo(empresa_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_financeiros_empresa ON lancamentos_financeiros(empresa_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_financeiras_conta ON movimentacoes_financeiras(conta_financeira_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_filamento ON movimentacoes_estoque(filamento_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendas_orcamento_origem_unique
  ON vendas(orcamento_origem_id) WHERE orcamento_origem_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_producoes_empresa_numero_unique
  ON producoes(empresa_id, numero);

-- ============================================================
-- PROCEDURES / RPCs ATÔMICAS FINANCEIRAS
-- ============================================================

CREATE OR REPLACE FUNCTION public.liquidar_lancamento_financeiro(
  p_lancamento_id UUID,
  p_conta_id UUID,
  p_valor_pago NUMERIC,
  p_data_liquidacao DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lanc RECORD;
  v_conta RECORD;
  v_saldo_ant NUMERIC;
  v_saldo_post NUMERIC;
  v_tipo_mov TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória.';
  END IF;

  IF p_valor_pago IS NULL OR p_valor_pago <= 0 THEN
    RAISE EXCEPTION 'O valor de liquidação deve ser positivo.';
  END IF;

  -- 1. Busca e valida lançamento
  SELECT * INTO v_lanc FROM lancamentos_financeiros WHERE id = p_lancamento_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lançamento financeiro não encontrado.';
  END IF;

  -- Verifica tenant
  IF NOT public.is_empresa_member(v_lanc.empresa_id) THEN
    RAISE EXCEPTION 'Acesso negado para a empresa correspondente.';
  END IF;

  IF v_lanc.status IN ('Liquidado', 'Cancelado') OR v_lanc.is_deleted THEN
    RAISE EXCEPTION 'O lançamento não pode ser liquidado no estado atual.';
  END IF;

  IF p_valor_pago > (COALESCE(v_lanc.valor_liquido, 0) - COALESCE(v_lanc.valor_pago, 0)) THEN
    RAISE EXCEPTION 'O valor de liquidação excede o saldo em aberto.';
  END IF;

  -- 2. Busca e valida conta
  SELECT * INTO v_conta FROM contas_financeiras WHERE id = p_conta_id AND empresa_id = v_lanc.empresa_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta financeira não encontrada ou não pertence à mesma empresa.';
  END IF;

  v_saldo_ant := COALESCE(v_conta.saldo_atual, 0);

  IF v_lanc.tipo = 'Receita' THEN
    v_saldo_post := v_saldo_ant + p_valor_pago;
    v_tipo_mov := 'Entrada';
  ELSE
    v_saldo_post := v_saldo_ant - p_valor_pago;
    v_tipo_mov := 'Saida';
  END IF;

  -- 3. Atualiza conta
  UPDATE contas_financeiras 
  SET saldo_atual = v_saldo_post 
  WHERE id = p_conta_id;

  -- 4. Atualiza lançamento
  UPDATE lancamentos_financeiros
  SET status = CASE
        WHEN p_valor_pago + COALESCE(v_lanc.valor_pago, 0) >= COALESCE(v_lanc.valor_liquido, 0)
          THEN 'Liquidado'
        ELSE 'Pendente'
      END,
      conta_financeira_id = p_conta_id,
      valor_pago = COALESCE(v_lanc.valor_pago, 0) + p_valor_pago,
      data_liquidacao = p_data_liquidacao
  WHERE id = p_lancamento_id;

  -- 5. Registra movimentação
  INSERT INTO movimentacoes_financeiras (
    empresa_id,
    conta_financeira_id,
    lancamento_id,
    data,
    tipo,
    valor,
    saldo_anterior,
    saldo_posterior,
    descricao
  ) VALUES (
    v_lanc.empresa_id,
    p_conta_id,
    p_lancamento_id,
    p_data_liquidacao,
    v_tipo_mov,
    p_valor_pago,
    v_saldo_ant,
    v_saldo_post,
    'Baixa de ' || v_lanc.tipo || ' ' || COALESCE(v_lanc.numero_documento, '')
  );

  RETURN jsonb_build_object(
    'success', true,
    'lancamento_id', p_lancamento_id,
    'saldo_anterior', v_saldo_ant,
    'saldo_posterior', v_saldo_post
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.liquidar_lancamento_financeiro(UUID, UUID, NUMERIC, DATE) TO authenticated;

CREATE OR REPLACE FUNCTION public.transferir_saldo_financeiro(
  p_conta_origem_id UUID,
  p_conta_destino_id UUID,
  p_valor NUMERIC,
  p_data DATE DEFAULT CURRENT_DATE,
  p_observacoes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_c_orig RECORD;
  v_c_dest RECORD;
  v_saldo_orig_post NUMERIC;
  v_saldo_dest_post NUMERIC;
  v_trans_id UUID;
BEGIN
  IF p_valor <= 0 THEN
    RAISE EXCEPTION 'O valor da transferência deve ser positivo.';
  END IF;

  IF p_conta_origem_id = p_conta_destino_id THEN
    RAISE EXCEPTION 'A conta de origem e destino devem ser diferentes.';
  END IF;

  -- 1. Lock e valida conta origem
  SELECT * INTO v_c_orig FROM contas_financeiras WHERE id = p_conta_origem_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta de origem não encontrada.';
  END IF;

  IF NOT public.is_empresa_member(v_c_orig.empresa_id) THEN
    RAISE EXCEPTION 'Acesso negado para a conta de origem.';
  END IF;

  -- 2. Lock e valida conta destino
  SELECT * INTO v_c_dest FROM contas_financeiras WHERE id = p_conta_destino_id AND empresa_id = v_c_orig.empresa_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta de destino não encontrada ou pertence a outra empresa.';
  END IF;

  v_saldo_orig_post := COALESCE(v_c_orig.saldo_atual, 0) - p_valor;
  v_saldo_dest_post := COALESCE(v_c_dest.saldo_atual, 0) + p_valor;

  -- 3. Atualiza saldos das duas contas
  UPDATE contas_financeiras SET saldo_atual = v_saldo_orig_post WHERE id = p_conta_origem_id;
  UPDATE contas_financeiras SET saldo_atual = v_saldo_dest_post WHERE id = p_conta_destino_id;

  -- 4. Registra a transferência
  INSERT INTO transferencias_financeiras (
    empresa_id,
    data,
    conta_origem_id,
    conta_destino_id,
    valor,
    observacoes
  ) VALUES (
    v_c_orig.empresa_id,
    p_data,
    p_conta_origem_id,
    p_conta_destino_id,
    p_valor,
    p_observacoes
  ) RETURNING id INTO v_trans_id;

  -- 5. Registra movimentações em ambas as contas
  INSERT INTO movimentacoes_financeiras (
    empresa_id, conta_financeira_id, data, tipo, valor, saldo_anterior, saldo_posterior, descricao
  ) VALUES
  (
    v_c_orig.empresa_id, p_conta_origem_id, p_data, 'Transferencia_Debito', p_valor, COALESCE(v_c_orig.saldo_atual, 0), v_saldo_orig_post,
    'Transferência enviada para ' || v_c_dest.nome
  ),
  (
    v_c_orig.empresa_id, p_conta_destino_id, p_data, 'Transferencia_Credito', p_valor, COALESCE(v_c_dest.saldo_atual, 0), v_saldo_dest_post,
    'Transferência recebida de ' || v_c_orig.nome
  );

  RETURN jsonb_build_object(
    'success', true,
    'transferencia_id', v_trans_id,
    'saldo_origem', v_saldo_orig_post,
    'saldo_destino', v_saldo_dest_post
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.transferir_saldo_financeiro(UUID, UUID, NUMERIC, DATE, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.converter_orcamento_em_venda(
  p_orcamento_id UUID,
  p_forma_pagamento TEXT DEFAULT 'Pix'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orc RECORD;
  v_num_venda TEXT;
  v_venda_id UUID;
  v_total NUMERIC := 0;
BEGIN
  -- 1. Busca e valida o orçamento
  SELECT * INTO v_orc FROM orcamentos WHERE id = p_orcamento_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orçamento não encontrado.';
  END IF;

  IF NOT public.is_empresa_member(v_orc.empresa_id) THEN
    RAISE EXCEPTION 'Acesso negado ao orçamento.';
  END IF;

  SELECT id, numero INTO v_venda_id, v_num_venda
  FROM vendas
  WHERE orcamento_origem_id = p_orcamento_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_converted', true,
      'venda_id', v_venda_id,
      'numero_venda', v_num_venda
    );
  END IF;

  IF v_orc.status IN ('Cancelado', 'Reprovado') THEN
    RAISE EXCEPTION 'Orçamento não pode ser convertido no estado atual.';
  END IF;

  -- 2. Gera número da venda
  v_num_venda := 'VND-' || SUBSTRING(p_orcamento_id::text FROM 1 FOR 8);

  -- 3. Calcula total a partir dos itens do orçamento
  SELECT COALESCE(SUM((valor_unitario - desconto) * quantidade), 0) INTO v_total
  FROM orcamento_itens WHERE orcamento_id = p_orcamento_id;

  v_total := GREATEST(0, v_total - COALESCE(v_orc.desconto_geral, 0));

  -- 4. Cria a Venda
  INSERT INTO vendas (
    empresa_id,
    numero,
    cliente_id,
    data,
    valor_total,
    forma_pagamento,
    status,
    orcamento_origem_id
  ) VALUES (
    v_orc.empresa_id,
    v_num_venda,
    v_orc.cliente_id,
    CURRENT_DATE,
    v_total,
    p_forma_pagamento,
    'Pendente',
    p_orcamento_id
  ) RETURNING id INTO v_venda_id;

  -- 5. Atualiza o orçamento para Aprovado
  UPDATE orcamentos SET status = 'Aprovado' WHERE id = p_orcamento_id;

  -- 6. Cria o lançamento financeiro a receber (Aberto)
  INSERT INTO lancamentos_financeiros (
    empresa_id,
    numero_documento,
    tipo,
    origem,
    origem_id,
    cliente_id,
    data_emissao,
    data_vencimento,
    valor_bruto,
    valor_liquido,
    forma_pagamento,
    status,
    conciliado
  ) VALUES (
    v_orc.empresa_id,
    v_num_venda,
    'Receita',
    'Venda',
    v_venda_id,
    v_orc.cliente_id,
    CURRENT_DATE,
    (CURRENT_DATE + INTERVAL '30 days')::DATE,
    v_total,
    v_total,
    p_forma_pagamento,
    'Aberto',
    false
  );

  RETURN jsonb_build_object(
    'success', true,
    'venda_id', v_venda_id,
    'numero_venda', v_num_venda,
    'valor_total', v_total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.converter_orcamento_em_venda(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.criar_venda_com_lancamento(
  p_empresa_id UUID,
  p_cliente_id UUID,
  p_data DATE,
  p_valor_total NUMERIC,
  p_forma_pagamento TEXT,
  p_orcamento_origem_id UUID DEFAULT NULL,
  p_numero TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_venda_id UUID;
  v_numero TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_empresa_member(p_empresa_id) THEN
    RAISE EXCEPTION 'Acesso negado para a empresa correspondente.';
  END IF;
  IF p_valor_total IS NULL OR p_valor_total < 0 THEN
    RAISE EXCEPTION 'O valor total da venda é inválido.';
  END IF;

  v_numero := COALESCE(NULLIF(trim(p_numero), ''), 'VND-' || substring(gen_random_uuid()::text from 1 for 8));

  INSERT INTO public.vendas (
    empresa_id, numero, cliente_id, data, valor_total, forma_pagamento, status, orcamento_origem_id
  ) VALUES (
    p_empresa_id, v_numero, p_cliente_id, COALESCE(p_data, CURRENT_DATE), p_valor_total,
    p_forma_pagamento, 'Pendente', p_orcamento_origem_id
  ) RETURNING id INTO v_venda_id;

  INSERT INTO public.lancamentos_financeiros (
    empresa_id, numero_documento, tipo, origem, origem_id, cliente_id,
    data_emissao, data_vencimento, valor_bruto, valor_liquido, forma_pagamento, status
  ) VALUES (
    p_empresa_id, v_numero, 'Receita', 'Venda', v_venda_id, p_cliente_id,
    COALESCE(p_data, CURRENT_DATE), COALESCE(p_data, CURRENT_DATE), p_valor_total,
    p_valor_total, p_forma_pagamento, 'Aberto'
  );

  RETURN jsonb_build_object('id', v_venda_id, 'numero', v_numero);
END;
$$;

REVOKE ALL ON FUNCTION public.criar_venda_com_lancamento(UUID, UUID, DATE, NUMERIC, TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.criar_venda_com_lancamento(UUID, UUID, DATE, NUMERIC, TEXT, UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.concluir_producao(
  p_producao_id UUID,
  p_filamento_id UUID,
  p_quantidade_gramas NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_producao RECORD;
  v_filamento RECORD;
  v_saldo_posterior NUMERIC;
BEGIN
  IF p_quantidade_gramas IS NULL OR p_quantidade_gramas <= 0 THEN
    RAISE EXCEPTION 'A quantidade consumida deve ser positiva.';
  END IF;

  SELECT * INTO v_producao FROM public.producoes WHERE id = p_producao_id FOR UPDATE;
  IF NOT FOUND OR NOT public.is_empresa_member(v_producao.empresa_id) THEN
    RAISE EXCEPTION 'Ordem de produção não encontrada ou acesso negado.';
  END IF;
  IF v_producao.status = 'Finalizada' THEN
    RAISE EXCEPTION 'A ordem de produção já foi concluída.';
  END IF;

  SELECT * INTO v_filamento
  FROM public.filamentos
  WHERE id = p_filamento_id AND empresa_id = v_producao.empresa_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Filamento não encontrado para esta empresa.';
  END IF;
  IF v_filamento.quantidade_disponivel < p_quantidade_gramas THEN
    RAISE EXCEPTION 'Estoque de filamento insuficiente.';
  END IF;

  v_saldo_posterior := v_filamento.quantidade_disponivel - p_quantidade_gramas;
  UPDATE public.filamentos SET quantidade_disponivel = v_saldo_posterior WHERE id = p_filamento_id;
  UPDATE public.producoes SET status = 'Finalizada' WHERE id = p_producao_id;

  INSERT INTO public.movimentacoes_estoque (
    empresa_id, filamento_id, producao_id, tipo, quantidade, saldo_anterior, saldo_posterior, descricao
  ) VALUES (
    v_producao.empresa_id, p_filamento_id, p_producao_id, 'Saida', p_quantidade_gramas,
    v_filamento.quantidade_disponivel, v_saldo_posterior,
    'Consumo da produção ' || v_producao.numero
  );

  RETURN jsonb_build_object('producao_id', p_producao_id, 'filamento_id', p_filamento_id, 'saldo_posterior', v_saldo_posterior);
END;
$$;

REVOKE ALL ON FUNCTION public.concluir_producao(UUID, UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.concluir_producao(UUID, UUID, NUMERIC) TO authenticated;

CREATE OR REPLACE FUNCTION public.criar_compra_com_despesa(
  p_empresa_id UUID,
  p_compra JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_compra_id UUID;
  v_valor NUMERIC := COALESCE((p_compra->>'valorPago')::NUMERIC, 0);
  v_data DATE := COALESCE(NULLIF(p_compra->>'data', '')::DATE, CURRENT_DATE);
  v_numero_documento TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_empresa_member(p_empresa_id) THEN
    RAISE EXCEPTION 'Acesso negado para a empresa correspondente.';
  END IF;
  IF COALESCE(trim(p_compra->>'fornecedor'), '') = '' OR v_valor < 0 THEN
    RAISE EXCEPTION 'Fornecedor e valor da compra são obrigatórios.';
  END IF;

  IF NULLIF(p_compra->>'filamentoId', '') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM filamentos WHERE id = (p_compra->>'filamentoId')::UUID AND empresa_id = p_empresa_id
  ) THEN
    RAISE EXCEPTION 'Filamento inválido para esta empresa.';
  END IF;
  IF NULLIF(p_compra->>'insumoId', '') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM insumos WHERE id = (p_compra->>'insumoId')::UUID AND empresa_id = p_empresa_id
  ) THEN
    RAISE EXCEPTION 'Insumo inválido para esta empresa.';
  END IF;

  INSERT INTO compras (
    empresa_id, data, fornecedor, categoria_item, descricao_item, quantidade,
    unidade_medida, filamento_id, insumo_id, quantidade_adquirida, valor_pago, nota_fiscal, observacoes
  ) VALUES (
    p_empresa_id, v_data, p_compra->>'fornecedor', COALESCE(p_compra->>'categoriaItem', 'Filamento'),
    p_compra->>'descricaoItem', COALESCE((p_compra->>'quantidade')::NUMERIC, 1),
    COALESCE(p_compra->>'unidadeMedida', 'un'), NULLIF(p_compra->>'filamentoId', '')::UUID,
    NULLIF(p_compra->>'insumoId', '')::UUID, COALESCE((p_compra->>'quantidadeAdquirida')::NUMERIC, 0),
    v_valor, p_compra->>'notaFiscal', p_compra->>'observacoes'
  ) RETURNING id INTO v_compra_id;

  v_numero_documento := COALESCE(NULLIF(trim(p_compra->>'notaFiscal'), ''), 'COMP-' || substring(v_compra_id::text from 1 for 8));
  INSERT INTO lancamentos_financeiros (
    empresa_id, numero_documento, tipo, origem, origem_id, fornecedor,
    data_emissao, data_vencimento, valor_bruto, valor_liquido, forma_pagamento, status
  ) VALUES (
    p_empresa_id, v_numero_documento, 'Despesa', 'Compra', v_compra_id, p_compra->>'fornecedor',
    v_data, v_data, v_valor, v_valor, 'PIX', 'Aberto'
  );

  RETURN jsonb_build_object('id', v_compra_id, 'numero_documento', v_numero_documento);
END;
$$;

CREATE OR REPLACE FUNCTION public.salvar_orcamento_com_itens(
  p_empresa_id UUID,
  p_orcamento JSONB,
  p_itens JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orcamento_id UUID := NULLIF(p_orcamento->>'id', '')::UUID;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_empresa_member(p_empresa_id) THEN
    RAISE EXCEPTION 'Acesso negado para a empresa correspondente.';
  END IF;
  IF jsonb_typeof(p_itens) <> 'array' OR jsonb_array_length(p_itens) = 0 THEN
    RAISE EXCEPTION 'Um orçamento deve conter ao menos um item.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM clientes WHERE id = (p_orcamento->>'clienteId')::UUID AND empresa_id = p_empresa_id) THEN
    RAISE EXCEPTION 'Cliente inválido para esta empresa.';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_itens) AS item
    LEFT JOIN produtos p ON p.id = (item->>'produtoId')::UUID AND p.empresa_id = p_empresa_id
    WHERE p.id IS NULL OR COALESCE((item->>'quantidade')::NUMERIC, 0) <= 0 OR COALESCE((item->>'valorUnitario')::NUMERIC, -1) < 0
  ) THEN
    RAISE EXCEPTION 'Itens de orçamento inválidos.';
  END IF;

  IF v_orcamento_id IS NULL THEN
    INSERT INTO orcamentos (empresa_id, numero, cliente_id, data_emissao, validade, previsao_entrega, desconto_geral, observacoes, status)
    VALUES (
      p_empresa_id, p_orcamento->>'numero', (p_orcamento->>'clienteId')::UUID,
      COALESCE(NULLIF(p_orcamento->>'dataEmissao', '')::DATE, CURRENT_DATE), NULLIF(p_orcamento->>'validade', '')::DATE,
      NULLIF(p_orcamento->>'previsaoEntrega', '')::DATE, COALESCE((p_orcamento->>'descontoGeral')::NUMERIC, 0),
      p_orcamento->>'observacoes', COALESCE(p_orcamento->>'status', 'Aberto')
    ) RETURNING id INTO v_orcamento_id;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM orcamentos WHERE id = v_orcamento_id AND empresa_id = p_empresa_id AND status NOT IN ('Cancelado')) THEN
      RAISE EXCEPTION 'Orçamento não encontrado ou não pode ser alterado.';
    END IF;
    UPDATE orcamentos SET
      cliente_id = (p_orcamento->>'clienteId')::UUID,
      data_emissao = COALESCE(NULLIF(p_orcamento->>'dataEmissao', '')::DATE, CURRENT_DATE),
      validade = NULLIF(p_orcamento->>'validade', '')::DATE,
      previsao_entrega = NULLIF(p_orcamento->>'previsaoEntrega', '')::DATE,
      desconto_geral = COALESCE((p_orcamento->>'descontoGeral')::NUMERIC, 0),
      observacoes = p_orcamento->>'observacoes', status = COALESCE(p_orcamento->>'status', status)
    WHERE id = v_orcamento_id;
    DELETE FROM orcamento_itens WHERE orcamento_id = v_orcamento_id;
  END IF;

  INSERT INTO orcamento_itens (empresa_id, orcamento_id, produto_id, quantidade, valor_unitario, desconto)
  SELECT p_empresa_id, v_orcamento_id, (item->>'produtoId')::UUID, (item->>'quantidade')::NUMERIC,
    (item->>'valorUnitario')::NUMERIC, COALESCE((item->>'desconto')::NUMERIC, 0)
  FROM jsonb_array_elements(p_itens) AS item;

  RETURN jsonb_build_object('id', v_orcamento_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.salvar_produto_com_bom(
  p_empresa_id UUID,
  p_produto JSONB,
  p_materiais JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_produto_id UUID := NULLIF(p_produto->>'id', '')::UUID;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_empresa_member(p_empresa_id) THEN
    RAISE EXCEPTION 'Acesso negado para a empresa correspondente.';
  END IF;
  IF COALESCE(trim(p_produto->>'nome'), '') = '' OR COALESCE(trim(p_produto->>'categoria'), '') = '' THEN
    RAISE EXCEPTION 'Nome e categoria do produto são obrigatórios.';
  END IF;
  IF NULLIF(p_produto->>'impressoraPadraoId', '') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM impressoras WHERE id = (p_produto->>'impressoraPadraoId')::UUID AND empresa_id = p_empresa_id
  ) THEN
    RAISE EXCEPTION 'Impressora inválida para esta empresa.';
  END IF;
  IF jsonb_typeof(COALESCE(p_materiais, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Materiais inválidos.';
  END IF;

  IF v_produto_id IS NULL THEN
    INSERT INTO produtos (empresa_id, nome, categoria, descricao, imagem, tempo_impressao, impressora_padrao_id, tempo_acabamento, valor_mao_de_obra, margem_lucro, over_percent, preco_venda, pdf_projeto, pdf_projeto_nome, link_projeto, outras_despesas, observacoes)
    VALUES (p_empresa_id, p_produto->>'nome', p_produto->>'categoria', p_produto->>'descricao', p_produto->>'imagem', COALESCE((p_produto->>'tempoImpressao')::NUMERIC, 0), NULLIF(p_produto->>'impressoraPadraoId', '')::UUID, COALESCE((p_produto->>'tempoAcabamento')::NUMERIC, 0), COALESCE((p_produto->>'valorMaoDeObra')::NUMERIC, 0), COALESCE((p_produto->>'margemLucro')::NUMERIC, 100), COALESCE((p_produto->>'overPercent')::NUMERIC, 0), COALESCE((p_produto->>'precoVenda')::NUMERIC, 0), p_produto->>'pdfProjeto', p_produto->>'pdfProjetoNome', p_produto->>'linkProjeto', COALESCE((p_produto->>'outrasDespesas')::NUMERIC, 0), p_produto->>'observacoes') RETURNING id INTO v_produto_id;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM produtos WHERE id = v_produto_id AND empresa_id = p_empresa_id) THEN
      RAISE EXCEPTION 'Produto não encontrado.';
    END IF;
    UPDATE produtos SET nome = p_produto->>'nome', categoria = p_produto->>'categoria', descricao = p_produto->>'descricao', imagem = p_produto->>'imagem', tempo_impressao = COALESCE((p_produto->>'tempoImpressao')::NUMERIC, 0), impressora_padrao_id = NULLIF(p_produto->>'impressoraPadraoId', '')::UUID, tempo_acabamento = COALESCE((p_produto->>'tempoAcabamento')::NUMERIC, 0), valor_mao_de_obra = COALESCE((p_produto->>'valorMaoDeObra')::NUMERIC, 0), margem_lucro = COALESCE((p_produto->>'margemLucro')::NUMERIC, 100), over_percent = COALESCE((p_produto->>'overPercent')::NUMERIC, 0), preco_venda = COALESCE((p_produto->>'precoVenda')::NUMERIC, 0), pdf_projeto = p_produto->>'pdfProjeto', pdf_projeto_nome = p_produto->>'pdfProjetoNome', link_projeto = p_produto->>'linkProjeto', outras_despesas = COALESCE((p_produto->>'outrasDespesas')::NUMERIC, 0), observacoes = p_produto->>'observacoes' WHERE id = v_produto_id;
    DELETE FROM produto_materiais WHERE produto_id = v_produto_id;
  END IF;

  INSERT INTO produto_materiais (empresa_id, produto_id, tipo_filamento, filamento_id, quantidade_grams)
  SELECT p_empresa_id, v_produto_id, item->>'tipoFilamento', COALESCE(NULLIF(item->>'filamentoId', ''), 'any'), (item->>'quantidadeGrams')::NUMERIC
  FROM jsonb_array_elements(COALESCE(p_materiais, '[]'::jsonb)) AS item
  WHERE COALESCE((item->>'quantidadeGrams')::NUMERIC, 0) > 0;

  RETURN jsonb_build_object('id', v_produto_id);
END;
$$;

REVOKE ALL ON FUNCTION public.criar_compra_com_despesa(UUID, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.salvar_orcamento_com_itens(UUID, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.salvar_produto_com_bom(UUID, JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.criar_compra_com_despesa(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.salvar_orcamento_com_itens(UUID, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.salvar_produto_com_bom(UUID, JSONB, JSONB) TO authenticated;

CREATE TABLE IF NOT EXISTS convites_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'financeiro', 'operador', 'leitura')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '7 days',
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE convites_empresa ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_empresa_admin(target_empresa_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM usuario_empresa WHERE empresa_id = target_empresa_id AND user_id = auth.uid() AND role = 'admin');
$$;

DROP POLICY IF EXISTS convites_empresa_admin_access ON convites_empresa;
CREATE POLICY convites_empresa_admin_access ON convites_empresa FOR ALL TO authenticated
USING (public.is_empresa_admin(empresa_id)) WITH CHECK (public.is_empresa_admin(empresa_id));

CREATE OR REPLACE FUNCTION public.criar_convite_empresa(p_empresa_id UUID, p_email TEXT, p_role TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_token TEXT := encode(gen_random_bytes(32), 'hex');
BEGIN
  IF NOT public.is_empresa_admin(p_empresa_id) THEN RAISE EXCEPTION 'Apenas administradores podem convidar membros.'; END IF;
  IF p_role NOT IN ('admin', 'financeiro', 'operador', 'leitura') THEN RAISE EXCEPTION 'Papel inválido.'; END IF;
  INSERT INTO convites_empresa (empresa_id, email, role, token_hash, created_by)
  VALUES (p_empresa_id, lower(trim(p_email)), p_role, encode(digest(v_token, 'sha256'), 'hex'), auth.uid());
  RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.aceitar_convite_empresa(p_token TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_convite convites_empresa%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação obrigatória.'; END IF;
  SELECT * INTO v_convite FROM convites_empresa
  WHERE token_hash = encode(digest(p_token, 'sha256'), 'hex') AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now()
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Convite inválido ou expirado.'; END IF;
  IF lower(coalesce(auth.jwt() ->> 'email', '')) <> v_convite.email THEN RAISE EXCEPTION 'O convite pertence a outro e-mail.'; END IF;
  INSERT INTO usuario_empresa (user_id, empresa_id, role) VALUES (auth.uid(), v_convite.empresa_id, v_convite.role)
  ON CONFLICT (user_id, empresa_id) DO NOTHING;
  UPDATE convites_empresa SET accepted_at = now() WHERE id = v_convite.id;
  RETURN v_convite.empresa_id;
END;
$$;

REVOKE ALL ON FUNCTION public.criar_convite_empresa(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aceitar_convite_empresa(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.criar_convite_empresa(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aceitar_convite_empresa(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.atualizar_compra_com_despesa(
  p_empresa_id UUID,
  p_compra_id UUID,
  p_compra JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_lancamento lancamentos_financeiros%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_empresa_member(p_empresa_id) THEN
    RAISE EXCEPTION 'Acesso negado para a empresa correspondente.';
  END IF;
  PERFORM 1 FROM compras WHERE id = p_compra_id AND empresa_id = p_empresa_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Compra não encontrada.'; END IF;
  SELECT * INTO v_lancamento FROM lancamentos_financeiros
  WHERE empresa_id = p_empresa_id AND origem = 'Compra' AND origem_id = p_compra_id FOR UPDATE;
  IF FOUND AND v_lancamento.status IN ('Liquidado', 'Cancelado') THEN
    RAISE EXCEPTION 'Não é possível alterar uma compra com lançamento financeiro encerrado.';
  END IF;
  UPDATE compras SET
    data = COALESCE(NULLIF(p_compra->>'data', '')::DATE, data), fornecedor = p_compra->>'fornecedor',
    categoria_item = COALESCE(p_compra->>'categoriaItem', categoria_item), descricao_item = p_compra->>'descricaoItem',
    quantidade = COALESCE((p_compra->>'quantidade')::NUMERIC, quantidade), unidade_medida = COALESCE(p_compra->>'unidadeMedida', unidade_medida),
    filamento_id = NULLIF(p_compra->>'filamentoId', '')::UUID, insumo_id = NULLIF(p_compra->>'insumoId', '')::UUID,
    quantidade_adquirida = COALESCE((p_compra->>'quantidadeAdquirida')::NUMERIC, quantidade_adquirida),
    valor_pago = COALESCE((p_compra->>'valorPago')::NUMERIC, valor_pago), nota_fiscal = p_compra->>'notaFiscal', observacoes = p_compra->>'observacoes'
  WHERE id = p_compra_id;
  IF FOUND THEN
    UPDATE lancamentos_financeiros SET fornecedor = p_compra->>'fornecedor', data_emissao = COALESCE(NULLIF(p_compra->>'data', '')::DATE, CURRENT_DATE),
      data_vencimento = COALESCE(NULLIF(p_compra->>'data', '')::DATE, CURRENT_DATE), valor_bruto = COALESCE((p_compra->>'valorPago')::NUMERIC, 0),
      valor_liquido = COALESCE((p_compra->>'valorPago')::NUMERIC, 0), numero_documento = COALESCE(NULLIF(p_compra->>'notaFiscal', ''), 'COMP-' || substring(p_compra_id::text from 1 for 8))
    WHERE id = v_lancamento.id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.excluir_compra_com_despesa(p_empresa_id UUID, p_compra_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_lancamento lancamentos_financeiros%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_empresa_member(p_empresa_id) THEN RAISE EXCEPTION 'Acesso negado para a empresa correspondente.'; END IF;
  PERFORM 1 FROM compras WHERE id = p_compra_id AND empresa_id = p_empresa_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Compra não encontrada.'; END IF;
  SELECT * INTO v_lancamento FROM lancamentos_financeiros WHERE empresa_id = p_empresa_id AND origem = 'Compra' AND origem_id = p_compra_id FOR UPDATE;
  IF FOUND AND v_lancamento.status = 'Liquidado' THEN RAISE EXCEPTION 'Não é possível excluir compra com lançamento liquidado.'; END IF;
  DELETE FROM lancamentos_financeiros WHERE id = v_lancamento.id;
  DELETE FROM compras WHERE id = p_compra_id;
END;
$$;

REVOKE ALL ON FUNCTION public.atualizar_compra_com_despesa(UUID, UUID, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.excluir_compra_com_despesa(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.atualizar_compra_com_despesa(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.excluir_compra_com_despesa(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.revogar_convite_empresa(p_convite_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_empresa_id UUID;
BEGIN
  SELECT empresa_id INTO v_empresa_id FROM convites_empresa WHERE id = p_convite_id FOR UPDATE;
  IF NOT FOUND OR NOT public.is_empresa_admin(v_empresa_id) THEN RAISE EXCEPTION 'Convite não encontrado ou acesso negado.'; END IF;
  UPDATE convites_empresa SET revoked_at = now() WHERE id = p_convite_id AND accepted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.remover_membro_empresa(p_empresa_id UUID, p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_role TEXT;
BEGIN
  IF NOT public.is_empresa_admin(p_empresa_id) THEN RAISE EXCEPTION 'Apenas administradores podem remover membros.'; END IF;
  SELECT role INTO v_role FROM usuario_empresa WHERE empresa_id = p_empresa_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Membro não encontrado.'; END IF;
  IF v_role = 'admin' AND (SELECT count(*) FROM usuario_empresa WHERE empresa_id = p_empresa_id AND role = 'admin') <= 1 THEN
    RAISE EXCEPTION 'Não é permitido remover o último administrador.';
  END IF;
  DELETE FROM usuario_empresa WHERE empresa_id = p_empresa_id AND user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.revogar_convite_empresa(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.remover_membro_empresa(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revogar_convite_empresa(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remover_membro_empresa(UUID, UUID) TO authenticated;

-- ============================================================
-- SCRIPT DE VINCULAÇÃO E BACKFILL DE DADOS EXISTENTES À EMPRESA
-- ============================================================
/* Legacy automatic backfill intentionally disabled. Use a separately reviewed migration with explicit tenant mapping.
DO $$
DECLARE
  v_target_empresa_id UUID;
  v_table TEXT;
BEGIN
  -- 1. Garante a existência de ao menos uma empresa cadastrada
  SELECT id INTO v_target_empresa_id FROM empresas ORDER BY created_at ASC LIMIT 1;

  IF v_target_empresa_id IS NULL THEN
    INSERT INTO empresas (nome)
    VALUES ('Empresa Principal')
    RETURNING id INTO v_target_empresa_id;
  END IF;

  -- 2. Vincula todos os usuários autenticados sem empresa vinculada a esta empresa principal
  INSERT INTO usuario_empresa (user_id, empresa_id, role)
  SELECT u.id, v_target_empresa_id, 'admin'
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM usuario_empresa ue WHERE ue.user_id = u.id
  );

  -- 3. Atualiza registros órfãos (empresa_id nulo) em todas as tabelas do sistema
  FOREACH v_table IN ARRAY ARRAY[
    'filamentos', 'clientes', 'impressoras', 'tarifas_energia', 'produtos',
    'produto_materiais', 'producoes', 'orcamentos', 'orcamento_itens', 'vendas',
    'compras', 'insumos', 'contas_financeiras', 'categorias_financeiras',
    'centros_custo', 'lancamentos_financeiros', 'movimentacoes_financeiras',
    'transferencias_financeiras', 'auditoria_financeira'
  ] LOOP
    EXECUTE format('
      UPDATE public.%I 
      SET empresa_id = %L 
      WHERE empresa_id IS NULL
    ', v_table, v_target_empresa_id);
  END LOOP;
END $$;
*/
