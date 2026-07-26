export const SUPABASE_SQL_SCHEMA = `-- ELMANEKO 3D 2.0 - Script de Banco de Dados para Supabase PostgreSQL (SaaS / Multi-Tenant)
-- Desenvolvido por Arquiteto de Software Senior Full Stack
-- Compatível com Row Level Security (RLS) isolando dados por empresa (Tenant)

-- ============================================================================
-- 1. EXTENSÕES & SEGURANÇA
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1.5. SAAS: EMPRESAS E USUÁRIOS
-- ============================================================================
CREATE TABLE public.empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.usuario_empresa (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 2. CADASTRO DE CLIENTES
-- ============================================================================
CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(20),
    telefone VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 3. CADASTRO DE FILAMENTOS (INSUMOS)
-- ============================================================================
CREATE TABLE public.filamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('PLA', 'PETG', 'ABS', 'TPU')),
    marca VARCHAR(100) NOT NULL,
    cor VARCHAR(100) NOT NULL,
    peso_total NUMERIC(10,2) NOT NULL CHECK (peso_total > 0),
    quantidade_disponivel NUMERIC(10,2) NOT NULL CHECK (quantidade_disponivel >= 0),
    valor_compra NUMERIC(10,2) NOT NULL CHECK (valor_compra >= 0),
    data_compra DATE NOT NULL,
    fornecedor VARCHAR(255) NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 4. CONTROLE DE COMPRAS
-- ============================================================================
CREATE TABLE public.compras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    fornecedor VARCHAR(255) NOT NULL,
    filamento_id UUID NOT NULL REFERENCES public.filamentos(id) ON DELETE RESTRICT,
    quantidade_adquirida NUMERIC(10,2) NOT NULL CHECK (quantidade_adquirida > 0),
    valor_pago NUMERIC(10,2) NOT NULL CHECK (valor_pago >= 0),
    nota_fiscal VARCHAR(100),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 5. CADASTRO DE IMPRESSORAS
-- ============================================================================
CREATE TABLE public.impressoras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    potencia_watts NUMERIC(10,2) NOT NULL CHECK (potencia_watts > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Manutenção', 'Inativa')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 6. TARIFA ENERGÉTICA
-- ============================================================================
CREATE TABLE public.tarifas_energia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    data_inicio_vigencia DATE NOT NULL,
    valor_kwh NUMERIC(10,4) NOT NULL CHECK (valor_kwh >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 7. CADASTRO DE PRODUTOS E FICHA TÉCNICA (BOM)
-- ============================================================================
CREATE TABLE public.produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    descricao TEXT,
    imagem TEXT,
    tempo_impressao NUMERIC(10,2) NOT NULL CHECK (tempo_impressao >= 0),
    impressora_padrao_id UUID REFERENCES public.impressoras(id) ON DELETE SET NULL,
    tempo_acabamento NUMERIC(10,2) DEFAULT 0 CHECK (tempo_acabamento >= 0),
    valor_mao_de_obra NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (valor_mao_de_obra >= 0),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.ficha_tecnica_produto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    tipo_filamento VARCHAR(50) NOT NULL CHECK (tipo_filamento IN ('PLA', 'PETG', 'ABS', 'TPU')),
    filamento_padrao_id UUID REFERENCES public.filamentos(id) ON DELETE SET NULL,
    quantidade_gramas NUMERIC(10,2) NOT NULL CHECK (quantidade_gramas > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.estoque_produto (
    produto_id UUID PRIMARY KEY REFERENCES public.produtos(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    quantidade_disponivel INTEGER NOT NULL DEFAULT 0 CHECK (quantidade_disponivel >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 8. ORÇAMENTOS E ITENS
-- ============================================================================
CREATE TABLE public.orcamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    validade DATE NOT NULL,
    desconto_geral NUMERIC(10,2) DEFAULT 0 CHECK (desconto_geral >= 0),
    observacoes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Enviado', 'Aprovado', 'Rejeitado', 'Expirado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(empresa_id, numero)
);

CREATE TABLE public.orcamento_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    valor_unitario NUMERIC(10,2) NOT NULL CHECK (valor_unitario >= 0),
    desconto NUMERIC(10,2) DEFAULT 0 CHECK (desconto >= 0)
);

-- ============================================================================
-- 9. VENDAS E ITENS
-- ============================================================================
CREATE TABLE public.vendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    valor_total NUMERIC(10,2) NOT NULL CHECK (valor_total >= 0),
    forma_pagamento VARCHAR(50) NOT NULL CHECK (forma_pagamento IN ('Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto', 'Dinheiro')),
    status VARCHAR(50) NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Pago', 'Cancelado')),
    orcamento_origem_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.venda_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    valor_unitario NUMERIC(10,2) NOT NULL CHECK (valor_unitario >= 0)
);

-- ============================================================================
-- 10. MÓDULO PRODUÇÃO
-- ============================================================================
CREATE TABLE public.producoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    impressora_id UUID NOT NULL REFERENCES public.impressoras(id) ON DELETE RESTRICT,
    operador VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'Em Produção' CHECK (status IN ('Em Produção', 'Finalizada', 'Cancelada')),
    
    custo_filamento NUMERIC(10,2) NOT NULL DEFAULT 0,
    custo_energia NUMERIC(10,2) NOT NULL DEFAULT 0,
    custo_mao_de_obra NUMERIC(10,2) NOT NULL DEFAULT 0,
    custo_total NUMERIC(10,2) NOT NULL DEFAULT 0,
    custo_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
    
    mao_de_obra_escolha VARCHAR(50) NOT NULL DEFAULT 'unitario' CHECK (mao_de_obra_escolha IN ('unitario', 'total')),
    mao_de_obra_valor NUMERIC(10,2) NOT NULL DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(empresa_id, numero)
);

-- ============================================================================
-- 11. MOVIMENTAÇÃO DE ESTOQUE
-- ============================================================================
CREATE TABLE public.movimentacao_estoque (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    data TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    origem VARCHAR(50) NOT NULL CHECK (origem IN ('compra', 'producao_consumo', 'producao_entrada', 'venda_baixa', 'ajuste')),
    referencia_id UUID NOT NULL,
    filamento_id UUID REFERENCES public.filamentos(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE,
    quantidade NUMERIC(10,2) NOT NULL CHECK (quantidade > 0),
    descricao TEXT NOT NULL
);

-- ============================================================================
-- 12. AUDITORIA E BACKUP LOGS
-- ============================================================================
CREATE TABLE public.backup_historico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    hora TIME NOT NULL DEFAULT CURRENT_TIME,
    usuario VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Manual', 'Automático')),
    tamanho VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Sucesso', 'Erro')),
    modulos TEXT[] NOT NULL
);

CREATE TABLE public.restore_historico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    backup_id UUID REFERENCES public.backup_historico(id) ON DELETE SET NULL,
    data TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    usuario VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    resultado VARCHAR(20) NOT NULL CHECK (resultado IN ('Sucesso', 'Erro')),
    detalhes TEXT
);

-- ============================================================================
-- 13. TRIGGERS E FUNÇÕES AUTOMÁTICAS
-- ============================================================================

-- A) Gatilho para atualizar a quantidade_disponivel de FILAMENTO ao salvar COMPRA
CREATE OR REPLACE FUNCTION public.proc_atualiza_estoque_por_compra()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.filamentos
    SET quantidade_disponivel = quantidade_disponivel + NEW.quantidade_adquirida,
        updated_at = now()
    WHERE id = NEW.filamento_id AND empresa_id = NEW.empresa_id;

    INSERT INTO public.movimentacao_estoque (empresa_id, tipo, origem, referencia_id, filamento_id, quantidade, descricao)
    VALUES (
        NEW.empresa_id,
        'entrada', 
        'compra', 
        NEW.id, 
        NEW.filamento_id, 
        NEW.quantidade_adquirida, 
        'Entrada de estoque via compra. Fornecedor: ' || NEW.fornecedor
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tg_compra_atualiza_estoque
AFTER INSERT ON public.compras
FOR EACH ROW EXECUTE FUNCTION public.proc_atualiza_estoque_por_compra();

-- B) Função para buscar a Tarifa Energética mais recente (usando tenant_id)
CREATE OR REPLACE FUNCTION public.fn_obter_tarifa_recente(p_empresa_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_tarifa NUMERIC;
BEGIN
    SELECT valor_kwh INTO v_tarifa
    FROM public.tarifas_energia
    WHERE empresa_id = p_empresa_id AND data_inicio_vigencia <= CURRENT_DATE
    ORDER BY data_inicio_vigencia DESC, created_at DESC
    LIMIT 1;
    
    IF v_tarifa IS NULL THEN
        v_tarifa := 0.85;
    END IF;
    
    RETURN v_tarifa;
END;
$$ LANGUAGE plpgsql STABLE;

-- C) Função para inicializar estoque do produto recém cadastrado
CREATE OR REPLACE FUNCTION public.proc_inicializa_estoque_produto()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.estoque_produto (produto_id, empresa_id, quantidade_disponivel)
    VALUES (NEW.id, NEW.empresa_id, 0)
    ON CONFLICT (produto_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tg_produto_inicializa_estoque
AFTER INSERT ON public.produtos
FOR EACH ROW EXECUTE FUNCTION public.proc_inicializa_estoque_produto();

-- ============================================================================
-- 14. POLÍTICAS DE SEGURANÇA (RLS - ROW LEVEL SECURITY - MULTI-TENANT)
-- ============================================================================

-- Ativando RLS em todas as tabelas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impressoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarifas_energia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ficha_tecnica_produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venda_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacao_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_historico ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para RLS (retorna a empresa do usuário logado)
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS UUID AS $$
    SELECT empresa_id FROM public.usuario_empresa WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Políticas
CREATE POLICY "Empresas Isolamento" ON public.empresas FOR ALL TO authenticated USING (id = public.get_user_empresa_id());
CREATE POLICY "Usuario Empresa Isolamento" ON public.usuario_empresa FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Tenant Isolamento Clientes" ON public.clientes FOR ALL TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant Isolamento Filamentos" ON public.filamentos FOR ALL TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant Isolamento Compras" ON public.compras FOR ALL TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant Isolamento Impressoras" ON public.impressoras FOR ALL TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant Isolamento Tarifas" ON public.tarifas_energia FOR ALL TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant Isolamento Produtos" ON public.produtos FOR ALL TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant Isolamento FichaTecnica" ON public.ficha_tecnica_produto FOR ALL TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant Isolamento EstoqueProd" ON public.estoque_produto FOR ALL TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant Isolamento Orcamentos" ON public.orcamentos FOR ALL TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant Isolamento OrcamentoItens" ON public.orcamento_itens FOR ALL TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant Isolamento Vendas" ON public.vendas FOR ALL TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant Isolamento VendaItens" ON public.venda_itens FOR ALL TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant Isolamento Producoes" ON public.producoes FOR ALL TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant Isolamento Movimentacoes" ON public.movimentacao_estoque FOR ALL TO authenticated USING (empresa_id = public.get_user_empresa_id());
CREATE POLICY "Tenant Isolamento Backups" ON public.backup_historico FOR ALL TO authenticated USING (empresa_id = public.get_user_empresa_id());

-- ============================================================================
-- 15. ÍNDICES DE PERFORMANCE
-- ============================================================================
CREATE INDEX idx_usuario_empresa_user ON public.usuario_empresa(user_id);
CREATE INDEX idx_filamentos_empresa ON public.filamentos(empresa_id);
CREATE INDEX idx_clientes_empresa ON public.clientes(empresa_id);
CREATE INDEX idx_vendas_empresa ON public.vendas(empresa_id);
CREATE INDEX idx_produtos_empresa ON public.produtos(empresa_id);
CREATE INDEX idx_orcamentos_empresa ON public.orcamentos(empresa_id);
CREATE INDEX idx_producoes_empresa ON public.producoes(empresa_id);
\`;
