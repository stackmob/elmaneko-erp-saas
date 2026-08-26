export type FilamentType = 'PLA' | 'PETG' | 'ABS' | 'TPU';

export interface User {
  id: string;
  email: string;
  nome: string;
  role: 'Administrador' | 'Operador';
}

export interface Filament {
  id: string;
  nome: string;
  tipo: FilamentType;
  marca: string;
  cor: string;
  pesoTotal: number; // in grams
  quantidadeDisponivel: number; // in grams
  valorCompra: number;
  dataCompra: string;
  fornecedor: string;
  observacoes?: string;
}

export type SupplyUnit = 'g' | 'Kg' | 'un' | 'caixa' | 'rolo' | 'pacote' | 'metro' | 'litro';

export interface SupplyItem {
  id: string;
  nome: string;
  categoria: PurchaseCategory;
  unidadeMedida: SupplyUnit;
  quantidadeEstoque: number;
  estoqueMinimo: number;
  custoUnitarioPadrao: number;
  fornecedorPadrao?: string;
  tipoFilamento?: FilamentType;
  cor?: string;
  filamentoId?: string;
  observacoes?: string;
}

export type PurchaseCategory = 
  | 'Filamento'
  | 'Cola / Adesivo'
  | 'Embalagem / Caixas'
  | 'Acessórios / Componentes'
  | 'Impressoras 3D'
  | 'Peças de Manutenção / Peças de Impressoras'
  | 'Outros Insumos';

export interface Purchase {
  id: string;
  data: string;
  fornecedor: string;
  insumoId?: string;
  categoriaItem?: PurchaseCategory;
  descricaoItem?: string;
  quantidade?: number; // quantity of items/units
  unidadeMedida?: SupplyUnit;
  filamentoId?: string;
  quantidadeAdquirida?: number; // in grams if filament
  valorPago: number;
  notaFiscal?: string;
  observacoes?: string;
}

export interface Printer {
  id: string;
  nome: string;
  marca: string;
  modelo: string;
  potenciaWatts: number;
  status: 'Ativa' | 'Manutenção' | 'Inativa';
}

export interface EnergyTariff {
  id: string;
  dataInicio: string;
  valorKwh: number;
}

export interface BOMItem {
  tipoFilamento: FilamentType;
  filamentoId: string; // ID of filament used or "any"
  quantidadeGrams: number;
}

export interface GlobalPricingConfig {
  margemLucroPadrao: number; // % profit margin default (e.g. 100)
  outrasDespesasPadrao: number; // R$ default (e.g. 0.00)
  valorMaoDeObraPadrao: number; // R$ default (e.g. 30.00)
}

export interface Product {
  id: string;
  nome: string;
  categoria: string;
  descricao?: string;
  imagem?: string; // Base64 or URL
  pdfProjeto?: string; // Base64 Data URL for project PDF file
  pdfProjetoNome?: string; // Original filename of project PDF
  linkProjeto?: string; // External web link (e.g. Printables, Cults3D)
  tempoImpressao: number; // in hours
  impressoraPadraoId: string;
  materials: BOMItem[];
  tempoAcabamento?: number; // in hours
  valorMaoDeObra: number; // Standard labor cost
  outrasDespesas?: number; // Secondary supplies (cola, embalagem, parafusos, acessórios)
  margemLucro?: number; // % profit margin
  overPercent?: number; // % overhead / extra markup
  precoVenda?: number; // Final selling price in R$
  hasCustomMargemLucro?: boolean; // Flag identifying specific product override
  hasCustomMaoDeObra?: boolean; // Flag identifying specific product override
  hasCustomOutrasDespesas?: boolean; // Flag identifying specific product override
  observacoes?: string;
}

export type ProductionStatus = 'Em Produção' | 'Finalizada' | 'Cancelada';

export interface ProductionOrder {
  id: string;
  numero: string; // e.g. PROD-001
  data: string;
  produtoId: string;
  quantidade: number;
  impressoraId: string;
  operador?: string;
  status: ProductionStatus;
  
  // Realized Costs (frozen at finalization)
  custoFilamento: number;
  custoEnergia: number;
  custoMaoDeObra: number;
  custoTotal: number;
  custoUnitario: number;
  
  // Configs
  maoDeObraEscolha: 'unitario' | 'total';
  maoDeObraValor: number;
  
  observacoes?: string;
}

export interface StockMovement {
  id: string;
  data: string;
  tipo: 'entrada' | 'saida';
  origem: 'compra' | 'producao_consumo' | 'producao_entrada' | 'venda_baixa' | 'ajuste';
  referenciaId: string; // ID of purchase, production, sale
  filamentoId?: string;
  produtoId?: string;
  quantidade: number; // grams for filament, units for product
  descricao: string;
}

export interface ProductStock {
  produtoId: string;
  quantidadeDisponivel: number;
}

export interface BudgetItem {
  produtoId: string;
  quantidade: number;
  valorUnitario: number;
  desconto: number; // value per unit
}

export interface Budget {
  id: string;
  numero: string; // e.g. ORC-001
  clienteId: string;
  dataEmissao: string;
  validade: string;
  previsaoEntrega?: string; // e.g. YYYY-MM-DD
  itens: BudgetItem[];
  descontoGeral: number; // flat discount
  observacoes?: string;
  status: 'Aberto' | 'Enviado' | 'Aprovado' | 'Faturado' | 'Rejeitado' | 'Expirado';
}

export interface SaleItem {
  produtoId: string;
  quantidade: number;
  valorUnitario: number;
  desconto: number;
}

export interface Sale {
  id: string;
  numero: string;
  clienteId: string;
  dataVenda: string;
  itens: SaleItem[];
  valorTotal: number;
  formaPagamento: 'Pix' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Boleto' | 'Dinheiro';
  statusPagamento: 'Pendente' | 'Pago' | 'Cancelado';
  orcamentoOrigemId?: string;
}

export interface BackupLog {
  id: string;
  data: string;
  operacao: string;
  usuario: string;
  ipSimulado: string;
  registrosTabelas: string;
  status: 'Sucesso' | 'Falha';
}

export interface Client {
  id: string;
  nome: string;
  cpfCnpj?: string;    // opcional — não obrigatório para cadastro
  telefone: string;
  whatsapp: string;
  email?: string;      // opcional — não obrigatório para cadastro
  endereco: string;
  observacoes?: string;
}

export interface BackupHistory {
  id: string;
  nome: string;
  data: string;
  hora: string;
  usuario: string;
  tipo: 'Manual' | 'Automático';
  tamanho: string; // e.g. "124 KB"
  status: 'Sucesso' | 'Erro';
  modulos: string[];
}

export interface OperationLog {
  id: string;
  usuario: string;
  data: string;
  hora: string;
  tipoOperacao: 'Backup' | 'Restauração' | 'Exclusão' | 'Erro Sistema' | 'Estoque' | 'Produção';
  descricao: string;
  resultado: 'Sucesso' | 'Erro';
  detalhes?: string;
}

export interface Company {
  id: string;
  nome: string;               // Nome Fantasia
  razaoSocial?: string;       // Razão Social (ex: ELMANEKO 3D LTDA)
  cnpj?: string;              // CNPJ ou CPF da empresa
  inscricaoEstadual?: string; // Inscrição Estadual/Municipal
  telefone?: string;          // Telefone de contato principal
  whatsapp?: string;          // WhatsApp comercial
  email?: string;             // E-mail comercial
  endereco?: string;          // Endereço completo (Rua, Nº, Bairro, Cidade - UF, CEP)
  responsavel?: string;       // Nome do gestor/responsável emissor dos relatórios
  cargoResponsavel?: string;  // Cargo do responsável (ex: Gestor Administrativo)
  pixChave?: string;          // Chave PIX para constar em propostas comerciais
  pixTipo?: string;           // Tipo de Chave PIX (ex: CNPJ, Email, Celular, Chave Aleatória)
  slogan?: string;            // Subtítulo/Slogan da empresa
  logotipoUrl?: string;       // URL ou Base64 da logo
  observacoes?: string;
}

// ============================================================================
// MÓDULO FINANCEIRO (FINANCIAL MODULE ENTITIES)
// ============================================================================

export type FinancialAccountType = 'Conta Bancaria' | 'Cartao Credito' | 'Carteira Digital' | 'Caixa Fisico';

export interface FinancialAccount {
  id: string;
  nome: string;               // Ex: "Itaú Conta Corrente", "Cartão Santander Corp", "Caixa Principal"
  tipo: FinancialAccountType;
  banco?: string;             // Itaú, Bradesco, Nubank, Inter
  agencia?: string;
  conta?: string;
  digito?: string;
  bandeira?: string;          // Visa, Mastercard, Elo
  limite?: number;            // Limite total para cartões
  limiteDisponivel?: number;
  diaFechamento?: number;
  diaVencimento?: number;
  saldoInicial: number;
  saldoAtual: number;
  situacao: 'Ativa' | 'Inativa';
  observacoes?: string;
}

export type FinancialCategoryType = 'Receita' | 'Despesa';

export interface FinancialCategory {
  id: string;
  nome: string;               // Ex: "Venda de Produtos 3D", "Energia Elétrica", "Insumos"
  tipo: FinancialCategoryType;
  categoriaPaiId?: string;    // Suporte a subcategorias / árvore hierárquica
  descricao?: string;
}

export interface CostCenter {
  id: string;
  codigo: string;             // Ex: "CC-01"
  nome: string;               // Ex: "Produção 3D", "Administrativo", "Comercial / Mkt"
  descricao?: string;
}

export type FinancialEntryStatus = 'Aberto' | 'Pendente' | 'Liquidado' | 'Conciliado' | 'Cancelado';

export interface FinancialEntry {
  id: string;
  numeroDocumento: string;    // Ex: "REC-2026-001", "PAG-2026-042"
  tipo: 'Receita' | 'Despesa';
  origem: 'Venda' | 'Compra' | 'Avulso' | 'Transferencia';
  origemId?: string;          // ID da Venda ou Compra vinculada
  clienteId?: string;
  fornecedor?: string;
  dataEmissao: string;
  dataVencimento: string;
  dataLiquidacao?: string;
  valorBruto: number;
  desconto: number;
  acrescimo: number;
  valorLiquido: number;
  valorPago?: number;
  jurosMulta?: number;
  formaPagamento: string;     // Dinheiro, PIX, Cartão Crédito, Boleto, etc.
  contaFinanceiraId?: string;
  categoriaId?: string;
  centroCustoId?: string;
  parcelaAtual?: number;
  totalParcelas?: number;
  parcelaPaiId?: string;
  status: FinancialEntryStatus;
  conciliado: boolean;
  tipoConciliacao?: string;   // Extrato, PIX, TED, DOC, Cartão, Dinheiro
  observacoes?: string;
  isDeleted?: boolean;        // Soft Delete audit
}

export type FinancialMovementType = 
  | 'Entrada' 
  | 'Saida' 
  | 'Transferencia_Debito' 
  | 'Transferencia_Credito' 
  | 'Estorno' 
  | 'Ajuste';

export interface FinancialMovement {
  id: string;
  contaFinanceiraId: string;
  lancamentoId?: string;
  data: string;
  tipo: FinancialMovementType;
  valor: number;
  saldoAnterior: number;
  saldoPosterior: number;
  descricao: string;
}

export interface FinancialTransfer {
  id: string;
  data: string;
  contaOrigemId: string;
  contaDestinoId: string;
  valor: number;
  observacoes?: string;
}

export interface FinancialAuditLog {
  id: string;
  dataHora: string;
  usuario: string;
  ip: string;
  operacao: string;          // "Criou Lançamento", "Liquidou", "Conciliou", "Cancelou", "Transferiu"
  entidade: string;          // "FinancialEntry", "FinancialAccount", "FinancialTransfer"
  entidadeId: string;
  valorAnterior?: string;
  valorNovo?: string;
}

