import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Filament, Purchase, Printer, EnergyTariff, Product, ProductionOrder, Budget, Sale, Client, Company } from '../types';

const DEFAULT_DEMO_EMPRESA_ID = "00000000-0000-0000-0000-000000000001";

const getFallbackEmpresaId = (): string => {
  try {
    return localStorage.getItem('elmaneko_empresa_id') || DEFAULT_DEMO_EMPRESA_ID;
  } catch (e) {
    return DEFAULT_DEMO_EMPRESA_ID;
  }
};

// Helper para validar UUID v4 do PostgreSQL
const isValidUuid = (id?: string): boolean => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

const DEFAULT_COMPANY_DATA: Company = {
  id: DEFAULT_DEMO_EMPRESA_ID,
  nome: 'ELMANEKO 3D',
  razaoSocial: 'ELMANEKO 3D LTDA',
  cnpj: '12.345.678/0001-99',
  inscricaoEstadual: 'ISENTO',
  telefone: '(11) 3333-3333',
  whatsapp: '(11) 99999-9999',
  email: 'contato@elmaneko3d.com',
  endereco: 'Rua da Extrusora, 3D - Parque Tecnológico, SP',
  responsavel: 'Guilherme Braga',
  cargoResponsavel: 'Gestor Administrativo',
  pixChave: '12.345.678/0001-99',
  pixTipo: 'CNPJ',
  slogan: 'Impressão 3D de Alta Fidelidade',
  observacoes: 'Documentos e propostas emitidos via ELMANEKO 3D ERP HUD'
};

const mapEmpresaFromDB = (row: any): Company => ({
  id: row.id,
  nome: row.nome || 'ELMANEKO 3D',
  razaoSocial: row.razao_social || row.nome || 'ELMANEKO 3D LTDA',
  cnpj: row.cnpj || '',
  inscricaoEstadual: row.inscricao_estadual || '',
  telefone: row.telefone || '',
  whatsapp: row.whatsapp || '',
  email: row.email || '',
  endereco: row.endereco || '',
  responsavel: row.responsavel || '',
  cargoResponsavel: row.cargo_responsavel || '',
  pixChave: row.pix_chave || '',
  pixTipo: row.pix_tipo || 'CNPJ',
  slogan: row.slogan || '',
  logotipoUrl: row.logotipo_url || '',
  observacoes: row.observacoes || ''
});

const mapEmpresaToDB = (comp: Partial<Company>) => ({
  nome: comp.nome,
  razao_social: comp.razaoSocial,
  cnpj: comp.cnpj,
  inscricao_estadual: comp.inscricaoEstadual,
  telefone: comp.telefone,
  whatsapp: comp.whatsapp,
  email: comp.email,
  endereco: comp.endereco,
  responsavel: comp.responsavel,
  cargo_responsavel: comp.cargoResponsavel,
  pix_chave: comp.pixChave,
  pix_tipo: comp.pixTipo,
  slogan: comp.slogan,
  logotipo_url: comp.logotipoUrl,
  observacoes: comp.observacoes
});


// ============================================================================
// LOCAL STORAGE CACHE HELPERS (Resiliência & Fallback Offline/RLS)
// ============================================================================
const getLocalCache = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(`elmaneko_cache_${key}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const setLocalCache = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(`elmaneko_cache_${key}`, JSON.stringify(data));
  } catch (e) {}
};

const addToLocalCache = <T extends { id: string }>(key: string, item: T): void => {
  const current = getLocalCache<T>(key);
  const exists = current.findIndex(i => i.id === item.id);
  let updated: T[];
  if (exists >= 0) {
    updated = [...current];
    updated[exists] = item;
  } else {
    updated = [item, ...current];
  }
  setLocalCache(key, updated);
};

const removeFromLocalCache = <T extends { id: string }>(key: string, id: string): void => {
  const current = getLocalCache<T>(key);
  const updated = current.filter(i => i.id !== id);
  setLocalCache(key, updated);
};

// ============================================================================
// MAPPERS: Frontend (camelCase) <-> Supabase PostgreSQL (snake_case)
// ============================================================================

// 1. FILAMENTOS
const mapFilamentoFromDB = (row: any): Filament => ({
  id: row.id,
  nome: row.nome,
  tipo: row.tipo,
  marca: row.marca,
  cor: row.cor,
  pesoTotal: Number(row.peso_total || 0),
  quantidadeDisponivel: Number(row.quantidade_disponivel || 0),
  valorCompra: Number(row.valor_compra || 0),
  dataCompra: row.data_compra || '',
  fornecedor: row.fornecedor || '',
  observacoes: row.observacoes || ''
});

const mapFilamentoToDB = (f: Partial<Filament>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    nome: f.nome,
    tipo: f.tipo,
    marca: f.marca,
    cor: f.cor,
    peso_total: Number(f.pesoTotal),
    quantidade_disponivel: Number(f.quantidadeDisponivel),
    valor_compra: Number(f.valorCompra),
    data_compra: f.dataCompra,
    fornecedor: f.fornecedor,
    observacoes: f.observacoes || null
  };
  if (isValidUuid(f.id)) {
    payload.id = f.id;
  }
  return payload;
};

// 2. CLIENTES
const mapClienteFromDB = (row: any): Client => ({
  id: row.id,
  nome: row.nome,
  cpfCnpj: row.cpf_cnpj || '',
  telefone: row.telefone || '',
  whatsapp: row.whatsapp || '',
  email: row.email || '',
  endereco: row.endereco || '',
  observacoes: row.observacoes || ''
});

const mapClienteToDB = (c: Partial<Client>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    nome: c.nome,
    cpf_cnpj: c.cpfCnpj || null,
    telefone: c.telefone || c.whatsapp || null,
    whatsapp: c.whatsapp || null,
    email: c.email || null,
    endereco: c.endereco || null,
    observacoes: c.observacoes || null
  };
  if (isValidUuid(c.id)) {
    payload.id = c.id;
  }
  return payload;
};

// 3. COMPRAS
const mapCompraFromDB = (row: any): Purchase => ({
  id: row.id,
  data: row.data,
  fornecedor: row.fornecedor,
  insumoId: row.insumo_id || '',
  categoriaItem: row.categoria_item || 'Filamento',
  descricaoItem: row.descricao_item || '',
  quantidade: Number(row.quantidade || 1),
  unidadeMedida: row.unidade_medida || (row.categoria_item === 'Filamento' ? 'g' : 'un'),
  filamentoId: row.filamento_id || '',
  quantidadeAdquirida: Number(row.quantidade_adquirida || 0),
  valorPago: Number(row.valor_pago || 0),
  notaFiscal: row.nota_fiscal || '',
  observacoes: row.observacoes || ''
});

const mapCompraToDB = (p: Partial<Purchase>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    data: p.data,
    fornecedor: p.fornecedor,
    insumo_id: isValidUuid(p.insumoId) ? p.insumoId : null,
    categoria_item: p.categoriaItem || 'Filamento',
    descricao_item: p.descricaoItem || null,
    quantidade: Number(p.quantidade || 1),
    unidade_medida: p.unidadeMedida || (p.categoriaItem === 'Filamento' ? 'g' : 'un'),
    filamento_id: isValidUuid(p.filamentoId) ? p.filamentoId : null,
    quantidade_adquirida: Number(p.quantidadeAdquirida || 0),
    valor_pago: Number(p.valorPago),
    nota_fiscal: p.notaFiscal || null,
    observacoes: p.observacoes || null
  };
  if (isValidUuid(p.id)) {
    payload.id = p.id;
  }
  return payload;
};

// 3.5 INSUMOS
const mapInsumoFromDB = (row: any): SupplyItem => ({
  id: row.id,
  nome: row.nome,
  categoria: row.categoria,
  unidadeMedida: row.unidade_medida || 'un',
  quantidadeEstoque: Number(row.quantidade_estoque || 0),
  estoqueMinimo: Number(row.estoque_minimo || 0),
  custoUnitarioPadrao: Number(row.custo_unitario_padrao || 0),
  fornecedorPadrao: row.fornecedor_padrao || '',
  tipoFilamento: row.tipo_filamento || undefined,
  cor: row.cor || '',
  filamentoId: row.filamento_id || '',
  observacoes: row.observacoes || ''
});

const mapInsumoToDB = (s: Partial<SupplyItem>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    nome: s.nome,
    categoria: s.categoria,
    unidade_medida: s.unidadeMedida || 'un',
    quantidade_estoque: Number(s.quantidadeEstoque || 0),
    estoque_minimo: Number(s.estoqueMinimo || 0),
    custo_unitario_padrao: Number(s.custoUnitarioPadrao || 0),
    fornecedor_padrao: s.fornecedorPadrao || null,
    tipo_filamento: s.tipoFilamento || null,
    cor: s.cor || null,
    filamento_id: isValidUuid(s.filamentoId) ? s.filamentoId : null,
    observacoes: s.observacoes || null
  };
  if (isValidUuid(s.id)) {
    payload.id = s.id;
  }
  return payload;
};

// 4. IMPRESSORAS
const mapPrinterFromDB = (row: any): Printer => ({
  id: row.id,
  nome: row.nome,
  marca: row.marca,
  modelo: row.modelo,
  potenciaWatts: Number(row.potencia_watts || 0),
  status: row.status
});

const mapPrinterToDB = (p: Partial<Printer>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    nome: p.nome,
    marca: p.marca,
    modelo: p.modelo,
    potencia_watts: Number(p.potenciaWatts),
    status: p.status
  };
  if (isValidUuid(p.id)) {
    payload.id = p.id;
  }
  return payload;
};

// 5. TARIFAS
const mapTariffFromDB = (row: any): EnergyTariff => ({
  id: row.id,
  dataInicio: row.data_inicio_vigencia || row.data_inicio || '',
  valorKwh: Number(row.valor_kwh || 0)
});

const mapTariffToDB = (t: Partial<EnergyTariff>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    data_inicio_vigencia: t.dataInicio,
    valor_kwh: Number(t.valorKwh)
  };
  if (isValidUuid(t.id)) {
    payload.id = t.id;
  }
  return payload;
};

// 5.5 MÓDULO FINANCEIRO MAPPERS
const mapFinancialAccountFromDB = (row: any): FinancialAccount => ({
  id: row.id,
  nome: row.nome,
  tipo: row.tipo || 'Conta Bancaria',
  banco: row.banco || '',
  agencia: row.agencia || '',
  conta: row.conta || '',
  digito: row.digito || '',
  bandeira: row.bandeira || '',
  limite: Number(row.limite || 0),
  limiteDisponivel: Number(row.limite_disponivel || 0),
  diaFechamento: row.dia_fechamento ? Number(row.dia_fechamento) : undefined,
  diaVencimento: row.dia_vencimento ? Number(row.dia_vencimento) : undefined,
  saldoInicial: Number(row.saldo_inicial || 0),
  saldoAtual: Number(row.saldo_atual || 0),
  situacao: row.situacao || 'Ativa',
  observacoes: row.observacoes || ''
});

const mapFinancialAccountToDB = (a: Partial<FinancialAccount>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    nome: a.nome,
    tipo: a.tipo,
    banco: a.banco || null,
    agencia: a.agencia || null,
    conta: a.conta || null,
    digito: a.digito || null,
    bandeira: a.bandeira || null,
    limite: Number(a.limite || 0),
    limite_disponivel: Number(a.limiteDisponivel || 0),
    dia_fechamento: a.diaFechamento || null,
    dia_vencimento: a.diaVencimento || null,
    saldo_inicial: Number(a.saldoInicial || 0),
    saldo_atual: Number(a.saldoAtual || 0),
    situacao: a.situacao || 'Ativa',
    observacoes: a.observacoes || null
  };
  if (isValidUuid(a.id)) payload.id = a.id;
  return payload;
};

const mapFinancialCategoryFromDB = (row: any): FinancialCategory => ({
  id: row.id,
  nome: row.nome,
  tipo: row.tipo || 'Despesa',
  categoriaPaiId: row.categoria_pai_id || '',
  descricao: row.descricao || ''
});

const mapFinancialCategoryToDB = (c: Partial<FinancialCategory>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    nome: c.nome,
    tipo: c.tipo,
    categoria_pai_id: isValidUuid(c.categoriaPaiId) ? c.categoriaPaiId : null,
    descricao: c.descricao || null
  };
  if (isValidUuid(c.id)) payload.id = c.id;
  return payload;
};

const mapCostCenterFromDB = (row: any): CostCenter => ({
  id: row.id,
  codigo: row.codigo,
  nome: row.nome,
  descricao: row.descricao || ''
});

const mapCostCenterToDB = (cc: Partial<CostCenter>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    codigo: cc.codigo,
    nome: cc.nome,
    descricao: cc.descricao || null
  };
  if (isValidUuid(cc.id)) payload.id = cc.id;
  return payload;
};

const mapFinancialEntryFromDB = (row: any): FinancialEntry => ({
  id: row.id,
  numeroDocumento: row.numero_documento,
  tipo: row.tipo,
  origem: row.origem || 'Avulso',
  origemId: row.origem_id || '',
  clienteId: row.cliente_id || '',
  fornecedor: row.fornecedor || '',
  dataEmissao: row.data_emissao || '',
  dataVencimento: row.data_vencimento || '',
  dataLiquidacao: row.data_liquidacao || '',
  valorBruto: Number(row.valor_bruto || 0),
  desconto: Number(row.desconto || 0),
  acrescimo: Number(row.acrescimo || 0),
  valorLiquido: Number(row.valor_liquido || 0),
  valorPago: Number(row.valor_pago || 0),
  jurosMulta: Number(row.juros_multa || 0),
  formaPagamento: row.forma_pagamento || 'PIX',
  contaFinanceiraId: row.conta_financeira_id || '',
  categoriaId: row.categoria_id || '',
  centroCustoId: row.centro_custo_id || '',
  parcelaAtual: Number(row.parcela_atual || 1),
  totalParcelas: Number(row.total_parcelas || 1),
  parcelaPaiId: row.parcela_pai_id || '',
  status: row.status || 'Aberto',
  conciliado: !!row.conciliado,
  tipoConciliacao: row.tipo_conciliacao || '',
  observacoes: row.observacoes || '',
  isDeleted: !!row.is_deleted
});

const mapFinancialEntryToDB = (e: Partial<FinancialEntry>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    numero_documento: e.numeroDocumento,
    tipo: e.tipo,
    origem: e.origem || 'Avulso',
    origem_id: isValidUuid(e.origemId) ? e.origemId : null,
    cliente_id: isValidUuid(e.clienteId) ? e.clienteId : null,
    fornecedor: e.fornecedor || null,
    data_emissao: e.dataEmissao || new Date().toISOString().split('T')[0],
    data_vencimento: e.dataVencimento,
    data_liquidacao: e.dataLiquidacao || null,
    valor_bruto: Number(e.valorBruto || 0),
    desconto: Number(e.desconto || 0),
    acrescimo: Number(e.acrescimo || 0),
    valor_liquido: Number(e.valorLiquido || 0),
    valor_pago: Number(e.valorPago || 0),
    juros_multa: Number(e.jurosMulta || 0),
    forma_pagamento: e.formaPagamento || 'PIX',
    conta_financeira_id: isValidUuid(e.contaFinanceiraId) ? e.contaFinanceiraId : null,
    categoria_id: isValidUuid(e.categoriaId) ? e.categoriaId : null,
    centro_custo_id: isValidUuid(e.centroCustoId) ? e.centroCustoId : null,
    parcela_atual: Number(e.parcelaAtual || 1),
    total_parcelas: Number(e.totalParcelas || 1),
    parcela_pai_id: isValidUuid(e.parcelaPaiId) ? e.parcelaPaiId : null,
    status: e.status || 'Aberto',
    conciliado: !!e.conciliado,
    tipo_conciliacao: e.tipoConciliacao || null,
    observacoes: e.observacoes || null,
    is_deleted: !!e.isDeleted
  };
  if (isValidUuid(e.id)) payload.id = e.id;
  return payload;
};

// 6. PRODUTOS — CR-03: materials carregados via JOIN com produto_materiais
const mapProductFromDB = (row: any): Product => ({
  id: row.id,
  nome: row.nome,
  categoria: row.categoria,
  descricao: row.descricao || '',
  imagem: row.imagem || '',
  pdfProjeto: row.pdf_projeto || '',
  pdfProjetoNome: row.pdf_projeto_nome || '',
  linkProjeto: row.link_projeto || '',
  tempoImpressao: Number(row.tempo_impressao || 0),
  impressoraPadraoId: row.impressora_padrao_id || '',
  tempoAcabamento: Number(row.tempo_acabamento || 0),
  valorMaoDeObra: Number(row.valor_mao_de_obra || 0),
  outrasDespesas: Number(row.outras_despesas || 0),
  margemLucro: Number(row.margem_lucro !== undefined && row.margem_lucro !== null ? row.margem_lucro : 100),
  overPercent: Number(row.over_percent !== undefined && row.over_percent !== null ? row.over_percent : 0),
  precoVenda: Number(row.preco_venda || 0),
  observacoes: row.observacoes || '',
  // Carregado via JOIN com tabela produto_materiais
  materials: Array.isArray(row.produto_materiais)
    ? row.produto_materiais.map((m: any) => ({
        tipoFilamento: m.tipo_filamento,
        filamentoId: m.filamento_id,
        quantidadeGrams: Number(m.quantidade_grams || 0)
      }))
    : (Array.isArray(row.materials) ? row.materials : [])
});

const mapProductToDB = (p: Partial<Product>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    nome: p.nome,
    categoria: p.categoria,
    descricao: p.descricao || null,
    imagem: p.imagem || null,
    pdf_projeto: p.pdfProjeto || null,
    pdf_projeto_nome: p.pdfProjetoNome || null,
    link_projeto: p.linkProjeto || null,
    tempo_impressao: Number(p.tempoImpressao || 0),
    impressora_padrao_id: isValidUuid(p.impressoraPadraoId) ? p.impressoraPadraoId : null,
    tempo_acabamento: Number(p.tempoAcabamento || 0),
    valor_mao_de_obra: Number(p.valorMaoDeObra || 0),
    outras_despesas: Number(p.outrasDespesas || 0),
    margem_lucro: Number(p.margemLucro !== undefined ? p.margemLucro : 100),
    over_percent: Number(p.overPercent !== undefined ? p.overPercent : 0),
    preco_venda: Number(p.precoVenda || 0),
    observacoes: p.observacoes || null
  };
  if (isValidUuid(p.id)) {
    payload.id = p.id;
  }
  return payload;
};

// 7. VENDAS
const mapSaleFromDB = (row: any): Sale => ({
  id: row.id,
  numero: row.id,
  clienteId: row.cliente_id,
  dataVenda: row.data,
  itens: [],
  valorTotal: Number(row.valor_total || 0),
  formaPagamento: row.forma_pagamento,
  statusPagamento: row.status,
  orcamentoOrigemId: row.orcamento_origem_id
});

const mapSaleToDB = (s: Partial<Sale>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    cliente_id: s.clienteId,
    data: s.dataVenda,
    valor_total: Number(s.valorTotal),
    forma_pagamento: s.formaPagamento,
    status: s.statusPagamento,
    orcamento_origem_id: isValidUuid(s.orcamentoOrigemId) ? s.orcamentoOrigemId : null
  };
  if (isValidUuid(s.id)) {
    payload.id = s.id;
  }
  return payload;
};

// 8. PRODUÇÕES
const mapProductionFromDB = (row: any): ProductionOrder => ({
  id: row.id,
  numero: row.numero,
  data: row.data,
  produtoId: row.produto_id,
  quantidade: Number(row.quantidade || 0),
  impressoraId: row.impressora_id,
  operador: row.operador || '',
  status: row.status,
  custoFilamento: Number(row.custo_filamento || 0),
  custoEnergia: Number(row.custo_energia || 0),
  custoMaoDeObra: Number(row.custo_mao_de_obra || 0),
  custoTotal: Number(row.custo_total || 0),
  custoUnitario: Number(row.custo_unitario || 0),
  maoDeObraEscolha: row.mao_de_obra_escolha || 'unitario',
  maoDeObraValor: Number(row.mao_de_obra_valor || 0),
  observacoes: row.observacoes || ''
});

const mapProductionToDB = (p: Partial<ProductionOrder>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    numero: p.numero,
    data: p.data,
    produto_id: isValidUuid(p.produtoId) ? p.produtoId : null,
    quantidade: Number(p.quantidade),
    impressora_id: isValidUuid(p.impressoraId) ? p.impressoraId : null,
    operador: p.operador || null,
    status: p.status,
    custo_filamento: Number(p.custoFilamento || 0),
    custo_energia: Number(p.custoEnergia || 0),
    custo_mao_de_obra: Number(p.custoMaoDeObra || 0),
    custo_total: Number(p.custoTotal || 0),
    custo_unitario: Number(p.custoUnitario || 0),
    mao_de_obra_escolha: p.maoDeObraEscolha || 'unitario',
    mao_de_obra_valor: Number(p.maoDeObraValor || 0),
    observacoes: p.observacoes || null
  };
  if (isValidUuid(p.id)) {
    payload.id = p.id;
  }
  return payload;
};

// 9. ORÇAMENTOS — CR-04: itens carregados via JOIN com orcamento_itens
const mapBudgetFromDB = (row: any): Budget => ({
  id: row.id,
  numero: row.numero,
  clienteId: row.cliente_id,
  dataEmissao: row.data_emissao,
  validade: row.validade,
  previsaoEntrega: row.previsao_entrega || '',
  descontoGeral: Number(row.desconto_geral || 0),
  observacoes: row.observacoes || '',
  status: row.status,
  // Carregado via JOIN com tabela orcamento_itens
  itens: (row.orcamento_itens || []).map((item: any) => ({
    produtoId: item.produto_id,
    quantidade: Number(item.quantidade || 1),
    valorUnitario: Number(item.valor_unitario || 0),
    desconto: Number(item.desconto || 0)
  }))
});

const mapBudgetToDB = (b: Partial<Budget>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    numero: b.numero,
    cliente_id: isValidUuid(b.clienteId) ? b.clienteId : null,
    data_emissao: b.dataEmissao,
    validade: b.validade || null,
    previsao_entrega: b.previsaoEntrega || null,
    desconto_geral: Number(b.descontoGeral || 0),
    observacoes: b.observacoes || null,
    status: b.status
  };
  if (isValidUuid(b.id)) {
    payload.id = b.id;
  }
  return payload;
};

// ============================================================================
// REACT QUERY HOOKS DA APLICAÇÃO
// ============================================================================

export const useData = () => {
  const { empresaId } = useAuth();
  const queryClient = useQueryClient();
  const activeTenant = empresaId || getFallbackEmpresaId();

  // --- FILAMENTOS ---
  const useFilamentos = () => useQuery({
    queryKey: ['filamentos', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('filamentos').select('*').eq('empresa_id', activeTenant);
        if (!error && data) {
          const dbItems = data.map(mapFilamentoFromDB);
          const localItems = getLocalCache<Filament>('filamentos');
          const mergedMap = new Map<string, Filament>();
          localItems.forEach(item => mergedMap.set(item.id, item));
          dbItems.forEach(item => mergedMap.set(item.id, item));
          const merged = Array.from(mergedMap.values());
          setLocalCache('filamentos', merged);
          return merged;
        }
      } catch (err) {
        console.warn('[useData] Usando cache local de filamentos:', err);
      }
      return getLocalCache<Filament>('filamentos');
    },
    enabled: true,
  });

  const useAddFilamento = () => useMutation({
    mutationFn: async (newFilamento: Filament) => {
      const payload = mapFilamentoToDB(newFilamento, activeTenant);
      let itemSalvo: Filament;

      try {
        const { data, error } = await supabase.from('filamentos').insert([payload]).select().single();
        if (!error && data) {
          itemSalvo = mapFilamentoFromDB(data);
        } else {
          console.warn('[useData] Gravação Supabase bloqueada, persistindo localmente:', error?.message);
          itemSalvo = { ...newFilamento, id: isValidUuid(newFilamento.id) ? newFilamento.id : crypto.randomUUID() };
        }
      } catch (err) {
        console.error('[useData] Exceção ao salvar filamento:', err);
        itemSalvo = { ...newFilamento, id: isValidUuid(newFilamento.id) ? newFilamento.id : crypto.randomUUID() };
      }

      addToLocalCache('filamentos', itemSalvo);
      queryClient.setQueryData(['filamentos', activeTenant], (old: Filament[] = []) => [itemSalvo, ...old.filter(f => f.id !== itemSalvo.id)]);
      return itemSalvo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filamentos', activeTenant] });
    },
  });

  const useUpdateFilamento = () => useMutation({
    mutationFn: async (filamento: Filament) => {
      const payload = mapFilamentoToDB(filamento, activeTenant);
      delete payload.empresa_id;
      let itemAtualizado: Filament = filamento;

      try {
        const { data, error } = await supabase.from('filamentos').update(payload).eq('id', filamento.id).select().single();
        if (!error && data) {
          itemAtualizado = mapFilamentoFromDB(data);
        } else {
          console.error('[useData] Erro ao atualizar filamento:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao atualizar filamento:', err);
      }

      addToLocalCache('filamentos', itemAtualizado);
      queryClient.setQueryData(['filamentos', activeTenant], (old: Filament[] = []) => old.map(f => f.id === itemAtualizado.id ? itemAtualizado : f));
      return itemAtualizado;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filamentos', activeTenant] });
    },
  });

  const useDeleteFilamento = () => useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('filamentos').delete().eq('id', id);
      } catch (err) {
        console.error('[useData] Exceção ao excluir filamento:', err);
      }
      removeFromLocalCache('filamentos', id);
      queryClient.setQueryData(['filamentos', activeTenant], (old: Filament[] = []) => old.filter(f => f.id !== id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filamentos', activeTenant] });
    },
  });

  // --- CLIENTES ---
  const useClientes = () => useQuery({
    queryKey: ['clientes', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('clientes').select('*').eq('empresa_id', activeTenant);
        if (!error && data) {
          const dbItems = data.map(mapClienteFromDB);
          const localItems = getLocalCache<Client>('clientes');
          const mergedMap = new Map<string, Client>();
          localItems.forEach(item => mergedMap.set(item.id, item));
          dbItems.forEach(item => mergedMap.set(item.id, item));
          const merged = Array.from(mergedMap.values());
          setLocalCache('clientes', merged);
          return merged;
        }
      } catch (err) {
        console.warn('[useData] Usando cache local de clientes:', err);
      }
      return getLocalCache<Client>('clientes');
    },
    enabled: true,
  });

  const useAddCliente = () => useMutation({
    mutationFn: async (client: Client) => {
      const payload = mapClienteToDB(client, activeTenant);
      let clienteSalvo: Client;

      try {
        const { data, error } = await supabase.from('clientes').insert([payload]).select().single();
        if (!error && data) {
          clienteSalvo = mapClienteFromDB(data);
        } else {
          console.warn('[useData] Gravação Supabase bloqueada, persistindo cliente localmente:', error?.message);
          clienteSalvo = { ...client, id: isValidUuid(client.id) ? client.id : crypto.randomUUID() };
        }
      } catch (err) {
        console.error('[useData] Exceção ao salvar cliente:', err);
        clienteSalvo = { ...client, id: isValidUuid(client.id) ? client.id : crypto.randomUUID() };
      }

      addToLocalCache('clientes', clienteSalvo);
      queryClient.setQueryData(['clientes', activeTenant], (old: Client[] = []) => [clienteSalvo, ...old.filter(c => c.id !== clienteSalvo.id)]);
      return clienteSalvo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', activeTenant] });
    },
  });

  const useUpdateCliente = () => useMutation({
    mutationFn: async (client: Client) => {
      const payload = mapClienteToDB(client, activeTenant);
      delete payload.empresa_id;
      let clienteAtualizado: Client = client;

      try {
        const { data, error } = await supabase.from('clientes').update(payload).eq('id', client.id).select().single();
        if (!error && data) {
          clienteAtualizado = mapClienteFromDB(data);
        } else {
          console.error('[useData] Erro ao atualizar cliente:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao atualizar cliente:', err);
      }

      addToLocalCache('clientes', clienteAtualizado);
      queryClient.setQueryData(['clientes', activeTenant], (old: Client[] = []) => old.map(c => c.id === clienteAtualizado.id ? clienteAtualizado : c));
      return clienteAtualizado;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', activeTenant] });
    },
  });

  const useDeleteCliente = () => useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('clientes').delete().eq('id', id);
      } catch (err) {
        console.error('[useData] Exceção ao excluir cliente:', err);
      }
      removeFromLocalCache('clientes', id);
      queryClient.setQueryData(['clientes', activeTenant], (old: Client[] = []) => old.filter(c => c.id !== id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', activeTenant] });
    },
  });

  // --- COMPRAS ---
  const useCompras = () => useQuery({
    queryKey: ['compras', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('compras').select('*').eq('empresa_id', activeTenant);
        if (!error && data) {
          return data.map(mapCompraFromDB);
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar compras:', err);
      }
      return getLocalCache<Purchase>('compras');
    },
    enabled: true,
  });

  const useAddCompra = () => useMutation({
    mutationFn: async (newCompra: Purchase) => {
      const payload = mapCompraToDB(newCompra, activeTenant);
      let itemSalvo: Purchase = newCompra;
      try {
        const { data, error } = await supabase.from('compras').insert([payload]).select().single();
        if (!error && data) {
          itemSalvo = mapCompraFromDB(data);
        } else {
          console.error('[useData] Erro ao salvar compra:', error?.message);
        }

        // Incrementar estoque do insumo se vinculado
        if (newCompra.insumoId) {
          const qty = Number(newCompra.quantidade || 1);
          const { data: insRow } = await supabase.from('insumos').select('quantidade_estoque').eq('id', newCompra.insumoId).single();
          if (insRow) {
            const currentStock = Number(insRow.quantidade_estoque || 0);
            await supabase.from('insumos').update({ quantidade_estoque: currentStock + qty }).eq('id', newCompra.insumoId);
          }
          const cachedInsumos = getLocalCache<SupplyItem>('insumos');
          const updated = cachedInsumos.map(item => 
            item.id === newCompra.insumoId ? { ...item, quantidadeEstoque: item.quantidadeEstoque + qty } : item
          );
          setLocalCache('insumos', updated);
        }

        // INTEGRAR AO FINANCEIRO: Gerar automaticamente Título a Pagar (Despesa)
        try {
          const docNum = newCompra.notaFiscal ? `NF-${newCompra.notaFiscal}` : `COMP-${newCompra.data.replace(/-/g, '')}`;
          const financialEntry: FinancialEntry = {
            id: crypto.randomUUID(),
            numeroDocumento: docNum,
            tipo: 'Despesa',
            origem: 'Compra',
            origemId: itemSalvo.id,
            fornecedor: itemSalvo.fornecedor,
            dataEmissao: itemSalvo.data || new Date().toISOString().split('T')[0],
            dataVencimento: itemSalvo.data || new Date().toISOString().split('T')[0],
            valorBruto: itemSalvo.valorPago,
            desconto: 0,
            acrescimo: 0,
            valorLiquido: itemSalvo.valorPago,
            formaPagamento: 'PIX',
            status: 'Aberto',
            conciliado: false,
            observacoes: `Lançamento automático de despesa da Compra: ${itemSalvo.descricaoItem || 'Insumo/Filamento'}`
          };

          const payloadFin = mapFinancialEntryToDB(financialEntry, activeTenant);
          await supabase.from('lancamentos_financeiros').insert([payloadFin]);
          addToLocalCache('lancamentos_financeiros', financialEntry);
        } catch (finErr) {
          console.error('[useData] Erro ao gerar título financeiro para compra:', finErr);
        }

      } catch (err) {
        console.error('[useData] Exceção ao salvar compra:', err);
      }
      addToLocalCache('compras', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras', activeTenant] });
      queryClient.invalidateQueries({ queryKey: ['filamentos', activeTenant] });
      queryClient.invalidateQueries({ queryKey: ['insumos', activeTenant] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros', activeTenant] });
    },
  });

  // --- INSUMOS ---
  const useInsumos = () => useQuery({
    queryKey: ['insumos', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('insumos').select('*').eq('empresa_id', activeTenant);
        if (!error && data) {
          const mapped = data.map(mapInsumoFromDB);
          setLocalCache('insumos', mapped);
          return mapped;
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar insumos:', err);
      }
      return getLocalCache<SupplyItem>('insumos');
    },
    enabled: true,
  });

  const useAddInsumo = () => useMutation({
    mutationFn: async (insumo: SupplyItem) => {
      const payload = mapInsumoToDB(insumo, activeTenant);
      let itemSalvo: SupplyItem = insumo;
      try {
        const { data, error } = await supabase.from('insumos').insert([payload]).select().single();
        if (!error && data) {
          itemSalvo = mapInsumoFromDB(data);
        } else {
          console.error('[useData] Erro ao salvar insumo:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao salvar insumo:', err);
      }
      addToLocalCache('insumos', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insumos', activeTenant] }),
  });

  const useUpdateInsumo = () => useMutation({
    mutationFn: async (insumo: SupplyItem) => {
      const payload = mapInsumoToDB(insumo, activeTenant);
      delete payload.empresa_id;
      let itemSalvo: SupplyItem = insumo;
      try {
        const { data, error } = await supabase.from('insumos').update(payload).eq('id', insumo.id).select().single();
        if (!error && data) {
          itemSalvo = mapInsumoFromDB(data);
        } else {
          console.error('[useData] Erro ao atualizar insumo:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao atualizar insumo:', err);
      }
      addToLocalCache('insumos', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insumos', activeTenant] }),
  });

  const useDeleteInsumo = () => useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('insumos').delete().eq('id', id);
      } catch (err) {
        console.error('[useData] Exceção ao excluir insumo:', err);
      }
      removeFromLocalCache('insumos', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insumos', activeTenant] }),
  });

  // --- IMPRESSORAS ---
  const useImpressoras = () => useQuery({
    queryKey: ['impressoras', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('impressoras').select('*').eq('empresa_id', activeTenant);
        if (!error && data) {
          const mapped = data.map(mapPrinterFromDB);
          setLocalCache('impressoras', mapped);
          return mapped;
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar impressoras:', err);
      }
      return getLocalCache<Printer>('impressoras');
    },
    enabled: true,
  });

  const useAddImpressora = () => useMutation({
    mutationFn: async (printer: Printer) => {
      const payload = mapPrinterToDB(printer, activeTenant);
      let itemSalvo: Printer = printer;
      try {
        const { data, error } = await supabase.from('impressoras').insert([payload]).select().single();
        if (!error && data) {
          itemSalvo = mapPrinterFromDB(data);
        } else {
          console.error('[useData] Erro ao salvar impressora:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao salvar impressora:', err);
      }
      addToLocalCache('impressoras', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impressoras', activeTenant] }),
  });

  const useUpdateImpressora = () => useMutation({
    mutationFn: async (printer: Printer) => {
      const payload = mapPrinterToDB(printer, activeTenant);
      delete payload.empresa_id;
      let itemSalvo: Printer = printer;
      try {
        const { data, error } = await supabase.from('impressoras').update(payload).eq('id', printer.id).select().single();
        if (!error && data) {
          itemSalvo = mapPrinterFromDB(data);
        } else {
          console.error('[useData] Erro ao atualizar impressora:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao atualizar impressora:', err);
      }
      addToLocalCache('impressoras', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impressoras', activeTenant] }),
  });

  const useDeleteImpressora = () => useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('impressoras').delete().eq('id', id);
      } catch (err) {
        console.error('[useData] Exceção ao excluir impressora:', err);
      }
      removeFromLocalCache('impressoras', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impressoras', activeTenant] }),
  });

  // --- TARIFAS ---
  const useTarifas = () => useQuery({
    queryKey: ['tarifas', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('tarifas_energia').select('*').eq('empresa_id', activeTenant);
        if (!error && data) {
          return data.map(mapTariffFromDB);
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar tarifas:', err);
      }
      return getLocalCache<EnergyTariff>('tarifas');
    },
    enabled: true,
  });

  const useAddTarifa = () => useMutation({
    mutationFn: async (tarifa: EnergyTariff) => {
      const payload = mapTariffToDB(tarifa, activeTenant);
      let itemSalvo: EnergyTariff = tarifa;
      try {
        const { data, error } = await supabase.from('tarifas_energia').insert([payload]).select().single();
        if (!error && data) {
          itemSalvo = mapTariffFromDB(data);
        } else {
          console.error('[useData] Erro ao salvar tarifa:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao salvar tarifa:', err);
      }
      addToLocalCache('tarifas', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tarifas', activeTenant] }),
  });

  // --- PRODUTOS — CR-03: Query com JOIN em produto_materiais ---
  const useProdutos = () => useQuery({
    queryKey: ['produtos', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('produtos')
          .select('*, produto_materiais(*)')
          .eq('empresa_id', activeTenant);
        if (!error && data) {
          const mapped = data.map(mapProductFromDB);
          setLocalCache('produtos', mapped);
          return mapped;
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar produtos:', err);
      }
      return getLocalCache<Product>('produtos');
    },
    enabled: true,
  });

  const useAddProduto = () => useMutation({
    mutationFn: async (produto: Product) => {
      const payload = mapProductToDB(produto, activeTenant);
      let itemSalvo: Product = produto;
      try {
        const { data, error } = await supabase.from('produtos').insert([payload]).select().single();
        if (!error && data) {
          // Inserir materiais da BOM na tabela relacional
          if (produto.materials && produto.materials.length > 0) {
            const materialsPayload = produto.materials.map(m => ({
              empresa_id: activeTenant,
              produto_id: data.id,
              tipo_filamento: m.tipoFilamento,
              filamento_id: m.filamentoId,
              quantidade_grams: m.quantidadeGrams
            }));
            const { error: matErr } = await supabase.from('produto_materiais').insert(materialsPayload);
            if (matErr) console.error('[useData] Erro ao inserir BOM:', matErr.message);
          }
          itemSalvo = { ...mapProductFromDB(data), materials: produto.materials };
        } else {
          console.error('[useData] Erro ao salvar produto:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao salvar produto:', err);
      }
      addToLocalCache('produtos', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos', activeTenant] }),
  });

  const useUpdateProduto = () => useMutation({
    mutationFn: async (produto: Product) => {
      const payload = mapProductToDB(produto, activeTenant);
      delete payload.empresa_id;
      let itemSalvo: Product = produto;
      try {
        const { data, error } = await supabase.from('produtos').update(payload).eq('id', produto.id).select().single();
        if (!error && data) {
          // Deletar BOM antiga e reinserir
          await supabase.from('produto_materiais').delete().eq('produto_id', produto.id);
          if (produto.materials && produto.materials.length > 0) {
            const materialsPayload = produto.materials.map(m => ({
              empresa_id: activeTenant,
              produto_id: produto.id,
              tipo_filamento: m.tipoFilamento,
              filamento_id: m.filamentoId,
              quantidade_grams: m.quantidadeGrams
            }));
            const { error: matErr } = await supabase.from('produto_materiais').insert(materialsPayload);
            if (matErr) console.error('[useData] Erro ao atualizar BOM:', matErr.message);
          }
          itemSalvo = { ...mapProductFromDB(data), materials: produto.materials };
        } else {
          console.error('[useData] Erro ao atualizar produto:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao atualizar produto:', err);
      }
      addToLocalCache('produtos', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos', activeTenant] }),
  });

  const useDeleteProduto = () => useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('produtos').delete().eq('id', id);
      } catch (err) {
        console.error('[useData] Exceção ao excluir produto:', err);
      }
      removeFromLocalCache('produtos', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos', activeTenant] }),
  });

  // --- VENDAS ---
  const useVendas = () => useQuery({
    queryKey: ['vendas', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('vendas').select('*').eq('empresa_id', activeTenant);
        if (!error && data) {
          return data.map(mapSaleFromDB);
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar vendas:', err);
      }
      return getLocalCache<Sale>('vendas');
    },
    enabled: true,
  });

  const useAddVenda = () => useMutation({
    mutationFn: async (venda: Sale) => {
      const payload = mapSaleToDB(venda, activeTenant);
      let itemSalvo: Sale = venda;
      try {
        const { data, error } = await supabase.from('vendas').insert([payload]).select().single();
        if (!error && data) {
          itemSalvo = mapSaleFromDB(data);
        } else {
          console.error('[useData] Erro ao salvar venda:', error?.message);
        }

        // INTEGRAR AO FINANCEIRO: Gerar automaticamente Título a Receber (Receita)
        try {
          const docNum = itemSalvo.numero ? `VENDA-#${itemSalvo.numero}` : `VENDA-${itemSalvo.id.slice(0, 6)}`;
          const financialEntry: FinancialEntry = {
            id: crypto.randomUUID(),
            numeroDocumento: docNum,
            tipo: 'Receita',
            origem: 'Venda',
            origemId: itemSalvo.id,
            clienteId: itemSalvo.clienteId,
            dataEmissao: itemSalvo.data || new Date().toISOString().split('T')[0],
            dataVencimento: itemSalvo.data || new Date().toISOString().split('T')[0],
            valorBruto: itemSalvo.valorTotal,
            desconto: 0,
            acrescimo: 0,
            valorLiquido: itemSalvo.valorTotal,
            formaPagamento: itemSalvo.formaPagamento || 'PIX',
            status: 'Aberto',
            conciliado: false,
            observacoes: `Faturamento automático da Venda #${itemSalvo.numero || ''}`
          };

          const payloadFin = mapFinancialEntryToDB(financialEntry, activeTenant);
          await supabase.from('lancamentos_financeiros').insert([payloadFin]);
          addToLocalCache('lancamentos_financeiros', financialEntry);
        } catch (finErr) {
          console.error('[useData] Erro ao gerar título financeiro para venda:', finErr);
        }

      } catch (err) {
        console.error('[useData] Exceção ao salvar venda:', err);
      }
      addToLocalCache('vendas', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas', activeTenant] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros', activeTenant] });
    },
  });

  const useUpdateVenda = () => useMutation({
    mutationFn: async (venda: Sale) => {
      const payload = mapSaleToDB(venda, activeTenant);
      delete payload.empresa_id;
      let itemSalvo: Sale = venda;
      try {
        const { data, error } = await supabase.from('vendas').update(payload).eq('id', venda.id).select().single();
        if (!error && data) {
          itemSalvo = mapSaleFromDB(data);
        } else {
          console.error('[useData] Erro ao atualizar venda:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao atualizar venda:', err);
      }
      addToLocalCache('vendas', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendas', activeTenant] }),
  });

  const useDeleteVenda = () => useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('vendas').delete().eq('id', id);
      } catch (err) {
        console.error('[useData] Exceção ao excluir venda:', err);
      }

      // INTEGRAR AO FINANCEIRO: Cancelar automaticamente o lançamento financeiro correspondente
      try {
        await supabase
          .from('lancamentos_financeiros')
          .update({ status: 'Cancelado' })
          .eq('origem_id', id)
          .eq('origem', 'Venda');
      } catch (finErr) {
        console.error('[useData] Erro ao cancelar título financeiro da venda:', finErr);
      }

      const cachedEntries = getLocalCache<FinancialEntry>('lancamentos_financeiros');
      const updatedEntries = cachedEntries.map(e => (e.origemId === id && e.origem === 'Venda') ? { ...e, status: 'Cancelado' as const } : e);
      setLocalCache('lancamentos_financeiros', updatedEntries);

      removeFromLocalCache('vendas', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas', activeTenant] });
      queryClient.invalidateQueries({ queryKey: ['orcamentos', activeTenant] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros', activeTenant] });
    },
  });

  // --- PRODUÇÕES ---
  const useProducoes = () => useQuery({
    queryKey: ['producoes', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('producoes').select('*').eq('empresa_id', activeTenant);
        if (!error && data) {
          return data.map(mapProductionFromDB);
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar produções:', err);
      }
      return getLocalCache<ProductionOrder>('producoes');
    },
    enabled: true,
  });

  const useAddProducao = () => useMutation({
    mutationFn: async (producao: ProductionOrder) => {
      const payload = mapProductionToDB(producao, activeTenant);
      let itemSalvo: ProductionOrder = producao;
      try {
        const { data, error } = await supabase.from('producoes').insert([payload]).select().single();
        if (!error && data) {
          itemSalvo = mapProductionFromDB(data);
        } else {
          console.error('[useData] Erro ao salvar produção:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao salvar produção:', err);
      }
      addToLocalCache('producoes', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['producoes', activeTenant] }),
  });

  const useUpdateProducao = () => useMutation({
    mutationFn: async (producao: ProductionOrder) => {
      const payload = mapProductionToDB(producao, activeTenant);
      delete payload.empresa_id;
      let itemSalvo: ProductionOrder = producao;
      try {
        const { data, error } = await supabase.from('producoes').update(payload).eq('id', producao.id).select().single();
        if (!error && data) {
          itemSalvo = mapProductionFromDB(data);
        } else {
          console.error('[useData] Erro ao atualizar produção:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao atualizar produção:', err);
      }
      addToLocalCache('producoes', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['producoes', activeTenant] }),
  });

  // --- ORÇAMENTOS — CR-04: Query com JOIN em orcamento_itens ---
  const useOrcamentos = () => useQuery({
    queryKey: ['orcamentos', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('orcamentos')
          .select('*, orcamento_itens(*)')
          .eq('empresa_id', activeTenant);
        if (!error && data) {
          return data.map(mapBudgetFromDB);
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar orçamentos:', err);
      }
      return getLocalCache<Budget>('orcamentos');
    },
    enabled: true,
  });

  const useAddOrcamento = () => useMutation({
    mutationFn: async (orcamento: Budget) => {
      const payload = mapBudgetToDB(orcamento, activeTenant);
      let itemSalvo: Budget = orcamento;
      try {
        const { data, error } = await supabase.from('orcamentos').insert([payload]).select().single();
        if (!error && data) {
          // Inserir itens do orçamento na tabela relacional
          if (orcamento.itens && orcamento.itens.length > 0) {
            const itemsPayload = orcamento.itens.map(it => ({
              empresa_id: activeTenant,
              orcamento_id: data.id,
              produto_id: it.produtoId,
              quantidade: it.quantidade,
              valor_unitario: it.valorUnitario,
              desconto: it.desconto
            }));
            const { error: itemErr } = await supabase.from('orcamento_itens').insert(itemsPayload);
            if (itemErr) console.error('[useData] Erro ao inserir itens do orçamento:', itemErr.message);
          }
          itemSalvo = { ...mapBudgetFromDB(data), itens: orcamento.itens };
        } else {
          console.error('[useData] Erro ao salvar orçamento:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao salvar orçamento:', err);
      }
      addToLocalCache('orcamentos', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orcamentos', activeTenant] }),
  });

  const useUpdateOrcamento = () => useMutation({
    mutationFn: async (orcamento: Budget) => {
      const payload = mapBudgetToDB(orcamento, activeTenant);
      delete payload.empresa_id;
      let itemSalvo: Budget = orcamento;
      try {
        const { data, error } = await supabase.from('orcamentos').update(payload).eq('id', orcamento.id).select().single();
        if (!error && data) {
          // Deletar itens antigos e reinserir
          await supabase.from('orcamento_itens').delete().eq('orcamento_id', orcamento.id);
          if (orcamento.itens && orcamento.itens.length > 0) {
            const itemsPayload = orcamento.itens.map(it => ({
              empresa_id: activeTenant,
              orcamento_id: orcamento.id,
              produto_id: it.produtoId,
              quantidade: it.quantidade,
              valor_unitario: it.valorUnitario,
              desconto: it.desconto
            }));
            const { error: itemErr } = await supabase.from('orcamento_itens').insert(itemsPayload);
            if (itemErr) console.error('[useData] Erro ao atualizar itens do orçamento:', itemErr.message);
          }
          itemSalvo = { ...mapBudgetFromDB(data), itens: orcamento.itens };
        } else {
          console.error('[useData] Erro ao atualizar orçamento:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao atualizar orçamento:', err);
      }
      addToLocalCache('orcamentos', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orcamentos', activeTenant] }),
  });

  const useDeleteOrcamento = () => useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('orcamentos').delete().eq('id', id);
      } catch (err) {
        console.error('[useData] Exceção ao excluir orçamento:', err);
      }
      removeFromLocalCache('orcamentos', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orcamentos', activeTenant] }),
  });

  // ============================================================================
  // MÓDULO FINANCEIRO (HOOKS & AUTOMAÇÕES DE INTEGRAÇÃO)
  // ============================================================================

  // --- 1. CONTAS FINANCEIRAS ---
  const useContasFinanceiras = () => useQuery({
    queryKey: ['contas_financeiras', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('contas_financeiras').select('*').eq('empresa_id', activeTenant);
        if (!error && data && data.length > 0) {
          const mapped = data.map(mapFinancialAccountFromDB);
          setLocalCache('contas_financeiras', mapped);
          return mapped;
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar contas financeiras:', err);
      }
      const cached = getLocalCache<FinancialAccount>('contas_financeiras');
      if (cached.length > 0) return cached;

      // Seed inicial
      const defaultAccounts = DEFAULT_ACCOUNTS.map(a => ({ ...a, id: a.id }));
      setLocalCache('contas_financeiras', defaultAccounts);
      return defaultAccounts;
    },
    enabled: true,
  });

  const useAddContaFinanceira = () => useMutation({
    mutationFn: async (account: FinancialAccount) => {
      const payload = mapFinancialAccountToDB(account, activeTenant);
      let itemSalvo: FinancialAccount = account;
      try {
        const { data, error } = await supabase.from('contas_financeiras').insert([payload]).select().single();
        if (!error && data) itemSalvo = mapFinancialAccountFromDB(data);
      } catch (err) {
        console.error('[useData] Exceção ao salvar conta financeira:', err);
      }
      addToLocalCache('contas_financeiras', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contas_financeiras', activeTenant] }),
  });

  const useUpdateContaFinanceira = () => useMutation({
    mutationFn: async (account: FinancialAccount) => {
      const payload = mapFinancialAccountToDB(account, activeTenant);
      delete payload.empresa_id;
      let itemSalvo: FinancialAccount = account;
      try {
        const { data, error } = await supabase.from('contas_financeiras').update(payload).eq('id', account.id).select().single();
        if (!error && data) itemSalvo = mapFinancialAccountFromDB(data);
      } catch (err) {
        console.error('[useData] Exceção ao atualizar conta financeira:', err);
      }
      addToLocalCache('contas_financeiras', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contas_financeiras', activeTenant] }),
  });

  const useDeleteContaFinanceira = () => useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('contas_financeiras').delete().eq('id', id);
      } catch (err) {
        console.error('[useData] Exceção ao excluir conta financeira:', err);
      }
      removeFromLocalCache('contas_financeiras', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contas_financeiras', activeTenant] }),
  });

  // --- 2. CATEGORIAS FINANCEIRAS (PLANO DE CONTAS) ---
  const useCategoriasFinanceiras = () => useQuery({
    queryKey: ['categorias_financeiras', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('categorias_financeiras').select('*').eq('empresa_id', activeTenant);
        if (!error && data && data.length > 0) {
          const mapped = data.map(mapFinancialCategoryFromDB);
          setLocalCache('categorias_financeiras', mapped);
          return mapped;
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar categorias financeiras:', err);
      }
      const cached = getLocalCache<FinancialCategory>('categorias_financeiras');
      if (cached.length > 0) return cached;

      const defaultCats = DEFAULT_CATEGORIES.map(c => ({ ...c }));
      setLocalCache('categorias_financeiras', defaultCats);
      return defaultCats;
    },
    enabled: true,
  });

  const useAddCategoriaFinanceira = () => useMutation({
    mutationFn: async (cat: FinancialCategory) => {
      const payload = mapFinancialCategoryToDB(cat, activeTenant);
      let itemSalvo: FinancialCategory = cat;
      try {
        const { data, error } = await supabase.from('categorias_financeiras').insert([payload]).select().single();
        if (!error && data) itemSalvo = mapFinancialCategoryFromDB(data);
      } catch (err) {
        console.error('[useData] Exceção ao salvar categoria financeira:', err);
      }
      addToLocalCache('categorias_financeiras', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias_financeiras', activeTenant] }),
  });

  const useUpdateCategoriaFinanceira = () => useMutation({
    mutationFn: async (cat: FinancialCategory) => {
      const payload = mapFinancialCategoryToDB(cat, activeTenant);
      delete payload.empresa_id;
      let itemSalvo: FinancialCategory = cat;
      try {
        const { data, error } = await supabase.from('categorias_financeiras').update(payload).eq('id', cat.id).select().single();
        if (!error && data) itemSalvo = mapFinancialCategoryFromDB(data);
      } catch (err) {
        console.error('[useData] Exceção ao atualizar categoria financeira:', err);
      }
      addToLocalCache('categorias_financeiras', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias_financeiras', activeTenant] }),
  });

  const useDeleteCategoriaFinanceira = () => useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('categorias_financeiras').delete().eq('id', id);
      } catch (err) {
        console.error('[useData] Exceção ao excluir categoria financeira:', err);
      }
      removeFromLocalCache('categorias_financeiras', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias_financeiras', activeTenant] }),
  });

  // --- 3. CENTROS DE CUSTO ---
  const useCentrosCusto = () => useQuery({
    queryKey: ['centros_custo', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('centros_custo').select('*').eq('empresa_id', activeTenant);
        if (!error && data && data.length > 0) {
          const mapped = data.map(mapCostCenterFromDB);
          setLocalCache('centros_custo', mapped);
          return mapped;
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar centros de custo:', err);
      }
      const cached = getLocalCache<CostCenter>('centros_custo');
      if (cached.length > 0) return cached;

      const defaultCCs = DEFAULT_COST_CENTERS.map(cc => ({ ...cc }));
      setLocalCache('centros_custo', defaultCCs);
      return defaultCCs;
    },
    enabled: true,
  });

  const useAddCentroCusto = () => useMutation({
    mutationFn: async (cc: CostCenter) => {
      const payload = mapCostCenterToDB(cc, activeTenant);
      let itemSalvo: CostCenter = cc;
      try {
        const { data, error } = await supabase.from('centros_custo').insert([payload]).select().single();
        if (!error && data) itemSalvo = mapCostCenterFromDB(data);
      } catch (err) {
        console.error('[useData] Exceção ao salvar centro de custo:', err);
      }
      addToLocalCache('centros_custo', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['centros_custo', activeTenant] }),
  });

  const useUpdateCentroCusto = () => useMutation({
    mutationFn: async (cc: CostCenter) => {
      const payload = mapCostCenterToDB(cc, activeTenant);
      delete payload.empresa_id;
      let itemSalvo: CostCenter = cc;
      try {
        const { data, error } = await supabase.from('centros_custo').update(payload).eq('id', cc.id).select().single();
        if (!error && data) itemSalvo = mapCostCenterFromDB(data);
      } catch (err) {
        console.error('[useData] Exceção ao atualizar centro de custo:', err);
      }
      addToLocalCache('centros_custo', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['centros_custo', activeTenant] }),
  });

  const useDeleteCentroCusto = () => useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('centros_custo').delete().eq('id', id);
      } catch (err) {
        console.error('[useData] Exceção ao excluir centro de custo:', err);
      }
      removeFromLocalCache('centros_custo', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['centros_custo', activeTenant] }),
  });

  // --- 4. LANÇAMENTOS FINANCEIROS (TÍTULOS A RECEBER E A PAGAR) ---
  const useLancamentosFinanceiros = () => useQuery({
    queryKey: ['lancamentos_financeiros', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('lancamentos_financeiros').select('*').eq('empresa_id', activeTenant).eq('is_deleted', false);
        if (!error && data) {
          const mapped = data.map(mapFinancialEntryFromDB);
          setLocalCache('lancamentos_financeiros', mapped);
          return mapped;
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar lançamentos financeiros:', err);
      }
      return getLocalCache<FinancialEntry>('lancamentos_financeiros').filter(e => !e.isDeleted);
    },
    enabled: true,
  });

  const useAddLancamentoFinanceiro = () => useMutation({
    mutationFn: async (entry: FinancialEntry) => {
      const payload = mapFinancialEntryToDB(entry, activeTenant);
      let itemSalvo: FinancialEntry = entry;
      try {
        const { data, error } = await supabase.from('lancamentos_financeiros').insert([payload]).select().single();
        if (!error && data) itemSalvo = mapFinancialEntryFromDB(data);
      } catch (err) {
        console.error('[useData] Exceção ao salvar lançamento financeiro:', err);
      }
      addToLocalCache('lancamentos_financeiros', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros', activeTenant] }),
  });

  const useUpdateLancamentoFinanceiro = () => useMutation({
    mutationFn: async (entry: FinancialEntry) => {
      const payload = mapFinancialEntryToDB(entry, activeTenant);
      delete payload.empresa_id;
      let itemSalvo: FinancialEntry = entry;
      try {
        const { data, error } = await supabase.from('lancamentos_financeiros').update(payload).eq('id', entry.id).select().single();
        if (!error && data) itemSalvo = mapFinancialEntryFromDB(data);
      } catch (err) {
        console.error('[useData] Exceção ao atualizar lançamento financeiro:', err);
      }
      addToLocalCache('lancamentos_financeiros', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros', activeTenant] }),
  });

  const useLiquidateLancamento = () => useMutation({
    mutationFn: async ({ entryId, contaId, valorPago, dataLiquidacao, jurosMulta = 0, observacoes = '' }: { entryId: string; contaId: string; valorPago: number; dataLiquidacao: string; jurosMulta?: number; observacoes?: string }) => {
      const cachedEntries = getLocalCache<FinancialEntry>('lancamentos_financeiros');
      const targetEntry = cachedEntries.find(e => e.id === entryId);
      if (!targetEntry) throw new Error('Lançamento não encontrado.');

      const updatedEntry: FinancialEntry = {
        ...targetEntry,
        status: 'Liquidado',
        contaFinanceiraId: contaId,
        valorPago,
        dataLiquidacao,
        jurosMulta,
        observacoes: observacoes ? `${targetEntry.observacoes || ''} | Baixa: ${observacoes}` : targetEntry.observacoes
      };

      // Atualizar Supabase
      try {
        const payload = mapFinancialEntryToDB(updatedEntry, activeTenant);
        await supabase.from('lancamentos_financeiros').update(payload).eq('id', entryId);
      } catch (e) {}

      // Atualizar cache de lançamentos
      addToLocalCache('lancamentos_financeiros', updatedEntry);

      // Atualizar Saldo da Conta Financeira
      const cachedAccounts = getLocalCache<FinancialAccount>('contas_financeiras');
      const targetAccount = cachedAccounts.find(a => a.id === contaId);
      if (targetAccount) {
        const delta = targetEntry.tipo === 'Receita' ? valorPago : -valorPago;
        const newBalance = targetAccount.saldoAtual + delta;
        const updatedAccount: FinancialAccount = {
          ...targetAccount,
          saldoAtual: newBalance,
          limiteDisponivel: targetAccount.tipo === 'Cartao Credito' ? Math.min(targetAccount.limite || 0, targetAccount.limiteDisponivel! - delta) : undefined
        };

        try {
          const accPayload = mapFinancialAccountToDB(updatedAccount, activeTenant);
          await supabase.from('contas_financeiras').update(accPayload).eq('id', contaId);
        } catch (e) {}
        addToLocalCache('contas_financeiras', updatedAccount);

        // Registrar Movimentação no Extrato
        const movement: FinancialMovement = {
          id: crypto.randomUUID(),
          contaFinanceiraId: contaId,
          lancamentoId: entryId,
          data: dataLiquidacao,
          tipo: targetEntry.tipo === 'Receita' ? 'Entrada' : 'Saida',
          valor: valorPago,
          saldoAnterior: targetAccount.saldoAtual,
          saldoPosterior: newBalance,
          descricao: `Baixa de ${targetEntry.tipo}: ${targetEntry.numeroDocumento} (${targetEntry.fornecedor || 'Cliente'})`
        };
        addToLocalCache('movimentacoes_financeiras', movement);
      }

      return updatedEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros', activeTenant] });
      queryClient.invalidateQueries({ queryKey: ['contas_financeiras', activeTenant] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes_financeiras', activeTenant] });
    }
  });

  const useConciliateLancamento = () => useMutation({
    mutationFn: async ({ entryId, tipoConciliacao }: { entryId: string; tipoConciliacao: string }) => {
      const cachedEntries = getLocalCache<FinancialEntry>('lancamentos_financeiros');
      const targetEntry = cachedEntries.find(e => e.id === entryId);
      if (!targetEntry) throw new Error('Lançamento não encontrado');

      const updatedEntry: FinancialEntry = {
        ...targetEntry,
        status: 'Conciliado',
        conciliado: true,
        tipoConciliacao
      };

      try {
        const payload = mapFinancialEntryToDB(updatedEntry, activeTenant);
        await supabase.from('lancamentos_financeiros').update(payload).eq('id', entryId);
      } catch (e) {}

      addToLocalCache('lancamentos_financeiros', updatedEntry);
      return updatedEntry;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros', activeTenant] }),
  });

  const useDeleteLancamentoFinanceiro = () => useMutation({
    mutationFn: async (id: string) => {
      // Soft Delete auditoria
      try {
        await supabase.from('lancamentos_financeiros').update({ is_deleted: true }).eq('id', id);
      } catch (err) {
        console.error('[useData] Exceção ao realizar soft delete do lançamento:', err);
      }
      const cached = getLocalCache<FinancialEntry>('lancamentos_financeiros');
      const updated = cached.map(e => e.id === id ? { ...e, isDeleted: true } : e);
      setLocalCache('lancamentos_financeiros', updated);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros', activeTenant] }),
  });

  // --- 5. MOVIMENTAÇÕES FINANCEIRAS (EXTRATO) ---
  const useMovimentacoesFinanceiras = (contaId?: string) => useQuery({
    queryKey: ['movimentacoes_financeiras', activeTenant, contaId],
    queryFn: async () => {
      try {
        let query = supabase.from('movimentacoes_financeiras').select('*').eq('empresa_id', activeTenant);
        if (contaId) query = query.eq('conta_financeira_id', contaId);
        const { data, error } = await query;
        if (!error && data) {
          return data.map((m: any) => ({
            id: m.id,
            contaFinanceiraId: m.conta_financeira_id,
            lancamentoId: m.lancamento_id,
            data: m.data,
            tipo: m.tipo,
            valor: Number(m.valor || 0),
            saldoAnterior: Number(m.saldo_anterior || 0),
            saldoPosterior: Number(m.saldo_posterior || 0),
            descricao: m.descricao
          }));
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar movimentações financeiras:', err);
      }
      const cached = getLocalCache<FinancialMovement>('movimentacoes_financeiras');
      if (contaId) return cached.filter(m => m.contaFinanceiraId === contaId);
      return cached;
    },
    enabled: true,
  });

  // --- 6. TRANSFERÊNCIAS FINANCEIRAS ---
  const useTransferenciasFinanceiras = () => useQuery({
    queryKey: ['transferencias_financeiras', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('transferencias_financeiras').select('*').eq('empresa_id', activeTenant);
        if (!error && data) {
          return data.map((t: any) => ({
            id: t.id,
            data: t.data,
            contaOrigemId: t.conta_origem_id,
            contaDestinoId: t.conta_destino_id,
            valor: Number(t.valor || 0),
            observacoes: t.observacoes || ''
          }));
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar transferências:', err);
      }
      return getLocalCache<FinancialTransfer>('transferencias_financeiras');
    },
    enabled: true,
  });

  const useAddTransferenciaFinanceira = () => useMutation({
    mutationFn: async (transfer: FinancialTransfer) => {
      const cachedAccounts = getLocalCache<FinancialAccount>('contas_financeiras');
      const originAcc = cachedAccounts.find(a => a.id === transfer.contaOrigemId);
      const destAcc = cachedAccounts.find(a => a.id === transfer.contaDestinoId);

      if (!originAcc || !destAcc) throw new Error('Contas origem/destino não encontradas.');

      const newOriginBal = originAcc.saldoAtual - transfer.valor;
      const newDestBal = destAcc.saldoAtual + transfer.valor;

      // Salvar Transferência
      try {
        await supabase.from('transferencias_financeiras').insert([{
          empresa_id: activeTenant,
          data: transfer.data,
          conta_origem_id: transfer.contaOrigemId,
          conta_destino_id: transfer.contaDestinoId,
          valor: transfer.valor,
          observacoes: transfer.observacoes || null
        }]);
      } catch (e) {}

      // Atualizar Origem
      const updatedOrigin: FinancialAccount = { ...originAcc, saldoAtual: newOriginBal };
      try {
        await supabase.from('contas_financeiras').update(mapFinancialAccountToDB(updatedOrigin, activeTenant)).eq('id', originAcc.id);
      } catch (e) {}
      addToLocalCache('contas_financeiras', updatedOrigin);

      // Atualizar Destino
      const updatedDest: FinancialAccount = { ...destAcc, saldoAtual: newDestBal };
      try {
        await supabase.from('contas_financeiras').update(mapFinancialAccountToDB(updatedDest, activeTenant)).eq('id', destAcc.id);
      } catch (e) {}
      addToLocalCache('contas_financeiras', updatedDest);

      // Registrar Extrato Débito na Origem
      addToLocalCache('movimentacoes_financeiras', {
        id: crypto.randomUUID(),
        contaFinanceiraId: originAcc.id,
        data: transfer.data,
        tipo: 'Transferencia_Debito',
        valor: transfer.valor,
        saldoAnterior: originAcc.saldoAtual,
        saldoPosterior: newOriginBal,
        descricao: `Transferência enviada para ${destAcc.nome}`
      });

      // Registrar Extrato Crédito no Destino
      addToLocalCache('movimentacoes_financeiras', {
        id: crypto.randomUUID(),
        contaFinanceiraId: destAcc.id,
        data: transfer.data,
        tipo: 'Transferencia_Credito',
        valor: transfer.valor,
        saldoAnterior: destAcc.saldoAtual,
        saldoPosterior: newDestBal,
        descricao: `Transferência recebida de ${originAcc.nome}`
      });

      addToLocalCache('transferencias_financeiras', transfer);
      return transfer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias_financeiras', activeTenant] });
      queryClient.invalidateQueries({ queryKey: ['contas_financeiras', activeTenant] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes_financeiras', activeTenant] });
    }
  });

  // --- 7. TRILHA DE AUDITORIA ---
  const useAuditoriaFinanceira = () => useQuery({
    queryKey: ['auditoria_financeira', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('auditoria_financeira').select('*').eq('empresa_id', activeTenant).order('data_hora', { ascending: false });
        if (!error && data) {
          return data.map((a: any) => ({
            id: a.id,
            dataHora: a.data_hora,
            usuario: a.usuario,
            ip: a.ip || '127.0.0.1',
            operacao: a.operacao,
            entidade: a.entidade,
            entidadeId: a.entidade_id,
            valorAnterior: a.valor_anterior || '',
            valorNovo: a.valor_novo || ''
          }));
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar auditoria:', err);
      }
      return getLocalCache<FinancialAuditLog>('auditoria_financeira');
    },
    enabled: true,
  });

  const useAddAuditLog = () => useMutation({
    mutationFn: async (log: FinancialAuditLog) => {
      try {
        await supabase.from('auditoria_financeira').insert([{
          empresa_id: activeTenant,
          usuario: log.usuario,
          ip: log.ip,
          operacao: log.operacao,
          entidade: log.entidade,
          entidade_id: log.entidadeId,
          valor_anterior: log.valorAnterior || null,
          valor_novo: log.valorNovo || null
        }]);
      } catch (e) {}
      addToLocalCache('auditoria_financeira', log);
      return log;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auditoria_financeira', activeTenant] }),
  });

  // ============================================================================
  // CADASTRO E PERFIL DA EMPRESA (MULTI-TENANT & RELATÓRIOS)
  // ============================================================================
  const useEmpresa = () => useQuery({
    queryKey: ['empresa', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('empresas')
          .select('*')
          .eq('id', activeTenant)
          .maybeSingle();

        if (data && !error) {
          const mapped = mapEmpresaFromDB(data);
          localStorage.setItem('elmaneko_cache_empresa', JSON.stringify(mapped));
          return mapped;
        }
      } catch (e) {
        console.warn('[useData] Erro ao buscar empresa no Supabase:', e);
      }
      
      try {
        const cached = localStorage.getItem('elmaneko_cache_empresa');
        if (cached) return JSON.parse(cached) as Company;
      } catch (e) {}

      return { ...DEFAULT_COMPANY_DATA, id: activeTenant };
    }
  });

  const useUpdateEmpresa = () => useMutation({
    mutationFn: async (updatedCompany: Company) => {
      let itemSalvo = { ...updatedCompany };
      try {
        const payload = mapEmpresaToDB(updatedCompany);
        const { data, error } = await supabase
          .from('empresas')
          .update(payload)
          .eq('id', activeTenant)
          .select()
          .single();

        if (data && !error) {
          itemSalvo = mapEmpresaFromDB(data);
        } else {
          // Se a linha ainda não existe, tenta fazer um upsert com id
          const { data: upsertData, error: upsertErr } = await supabase
            .from('empresas')
            .upsert({ id: activeTenant, ...payload })
            .select()
            .single();

          if (upsertData && !upsertErr) {
            itemSalvo = mapEmpresaFromDB(upsertData);
          } else {
            console.warn('[useData] Atualização Supabase falhou, mantendo em cache local:', error?.message || upsertErr?.message);
          }
        }
      } catch (err) {
        console.error('[useData] Exceção ao atualizar empresa:', err);
      }
      localStorage.setItem('elmaneko_cache_empresa', JSON.stringify(itemSalvo));
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['empresa', activeTenant] }),
  });

  return {
    useEmpresa, useUpdateEmpresa,
    useFilamentos, useAddFilamento, useUpdateFilamento, useDeleteFilamento,
    useInsumos, useAddInsumo, useUpdateInsumo, useDeleteInsumo,
    useCompras, useAddCompra,
    useImpressoras, useAddImpressora, useUpdateImpressora, useDeleteImpressora,
    useClientes, useAddCliente, useUpdateCliente, useDeleteCliente,
    useTarifas, useAddTarifa,
    useProdutos, useAddProduto, useUpdateProduto, useDeleteProduto,
    useVendas, useAddVenda, useUpdateVenda, useDeleteVenda,
    useProducoes, useAddProducao, useUpdateProducao,
    useOrcamentos, useAddOrcamento, useUpdateOrcamento, useDeleteOrcamento,
    // Financial Module
    useContasFinanceiras, useAddContaFinanceira, useUpdateContaFinanceira, useDeleteContaFinanceira,
    useCategoriasFinanceiras, useAddCategoriaFinanceira, useUpdateCategoriaFinanceira, useDeleteCategoriaFinanceira,
    useCentrosCusto, useAddCentroCusto, useUpdateCentroCusto, useDeleteCentroCusto,
    useLancamentosFinanceiros, useAddLancamentoFinanceiro, useUpdateLancamentoFinanceiro, useLiquidateLancamento, useConciliateLancamento, useDeleteLancamentoFinanceiro,
    useMovimentacoesFinanceiras, useTransferenciasFinanceiras, useAddTransferenciaFinanceira,
    useAuditoriaFinanceira, useAddAuditLog
  };
};

// Seeds Financeiros Iniciais (Estrutura sem saldos fictícios)
const DEFAULT_ACCOUNTS: FinancialAccount[] = [
  { id: 'acc-01', nome: 'Itaú Conta Corrente', tipo: 'Conta Bancaria', banco: 'Itaú', agencia: '', conta: '', digito: '', saldoInicial: 0, saldoAtual: 0, situacao: 'Ativa' },
  { id: 'acc-02', nome: 'Caixa Físico (Dinheiro)', tipo: 'Caixa Fisico', saldoInicial: 0, saldoAtual: 0, situacao: 'Ativa' },
  { id: 'acc-03', nome: 'Mercado Pago / Carteira Digital', tipo: 'Carteira Digital', banco: 'Mercado Pago', saldoInicial: 0, saldoAtual: 0, situacao: 'Ativa' },
  { id: 'acc-04', nome: 'Cartão Santander Corp', tipo: 'Cartao Credito', banco: 'Santander', bandeira: 'Mastercard', limite: 0, limiteDisponivel: 0, diaFechamento: 15, diaVencimento: 25, saldoInicial: 0, saldoAtual: 0, situacao: 'Ativa' },
];

const DEFAULT_CATEGORIES: FinancialCategory[] = [
  { id: 'cat-01', nome: 'Venda de Produtos 3D', tipo: 'Receita', descricao: 'Faturamento de vendas de peças e protótipos 3D' },
  { id: 'cat-02', nome: 'Serviços de Fatiamento & Modelagem', tipo: 'Receita', descricao: 'Receita com modelagem CAD e fatiamento 3D' },
  { id: 'cat-03', nome: 'Rendimentos & Juros', tipo: 'Receita', descricao: 'Rendimentos de aplicações e juros recebidos' },
  { id: 'cat-04', nome: 'Insumos & Filamentos (BOM)', tipo: 'Despesa', descricao: 'Aquisição de rolos de PLA, PETG, ABS, TPU e insumos' },
  { id: 'cat-05', nome: 'Energia Elétrica', tipo: 'Despesa', descricao: 'Consumo de energia elétrica das impressoras e infraestrutura' },
  { id: 'cat-06', nome: 'Manutenção de Impressoras & Peças', tipo: 'Despesa', descricao: 'Nozzles, extrusoras, mesas PEI, termistores' },
  { id: 'cat-07', nome: 'Embalagens & Logística', tipo: 'Despesa', descricao: 'Caixas de papelão, plástico bolha, fitas e fretes' },
  { id: 'cat-08', nome: 'Marketing & Anúncios', tipo: 'Despesa', descricao: 'Google Ads, Meta Ads, panfletos, site' },
  { id: 'cat-09', nome: 'Salários & Pro-Labore', tipo: 'Despesa', descricao: 'Folha de pagamento e retiradas dos sócios' },
  { id: 'cat-10', nome: 'Impostos & Taxas', tipo: 'Despesa', descricao: 'DAS, MEI, Simples Nacional, taxas bancárias' },
];

const DEFAULT_COST_CENTERS: CostCenter[] = [
  { id: 'cc-01', codigo: 'CC-01', nome: 'Produção & Impressão 3D', descricao: 'Centro de custo operacional do parque de impressoras' },
  { id: 'cc-02', codigo: 'CC-02', nome: 'Comercial & Vendas', descricao: 'Centro de custo das vendas e atendimento ao cliente' },
  { id: 'cc-03', codigo: 'CC-03', nome: 'Administrativo & Infra', descricao: 'Custos fixos administrativos, energia e gestão' },
];

