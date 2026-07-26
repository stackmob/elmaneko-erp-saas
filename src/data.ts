import { Filament, Purchase, Printer, EnergyTariff, Product, ProductionOrder, Client, Budget, Sale, StockMovement, ProductStock } from './types';

export const INITIAL_TARIFFS: EnergyTariff[] = [
  { id: '1', dataInicio: '2025-01-01', valorKwh: 0.75 },
  { id: '2', dataInicio: '2026-01-01', valorKwh: 0.85 }
];

export const INITIAL_FILAMENTS: Filament[] = [
  {
    id: 'fil-1',
    nome: 'PLA Branco Premium',
    tipo: 'PLA',
    marca: '3D Fila',
    cor: 'Branco',
    pesoTotal: 1000,
    quantidadeDisponivel: 800,
    valorCompra: 120.00,
    dataCompra: '2026-06-01',
    fornecedor: '3D Prime',
    observacoes: 'Excelente aderência e brilho'
  },
  {
    id: 'fil-2',
    nome: 'PLA Preto Fosco',
    tipo: 'PLA',
    marca: 'Esun',
    cor: 'Preto',
    pesoTotal: 1000,
    quantidadeDisponivel: 950,
    valorCompra: 130.00,
    dataCompra: '2026-06-15',
    fornecedor: 'Esun Brasil',
    observacoes: 'Ideal para peças de design e decoração'
  },
  {
    id: 'fil-3',
    nome: 'PETG Transparente',
    tipo: 'PETG',
    marca: 'Voolt3D',
    cor: 'Transparente',
    pesoTotal: 1000,
    quantidadeDisponivel: 1000,
    valorCompra: 110.00,
    dataCompra: '2026-05-10',
    fornecedor: 'Voolt3D Store',
    observacoes: 'Alta resistência química e mecânica'
  },
  {
    id: 'fil-4',
    nome: 'ABS Vermelho Carmim',
    tipo: 'ABS',
    marca: 'Plast3D',
    cor: 'Vermelho',
    pesoTotal: 1000,
    quantidadeDisponivel: 150, // LOW STOCK TRIGGER!
    valorCompra: 95.00,
    dataCompra: '2026-04-20',
    fornecedor: 'Plast3D Distribuidora',
    observacoes: 'Necessita câmara fechada para evitar warping'
  },
  {
    id: 'fil-5',
    nome: 'TPU Flexível Preto',
    tipo: 'TPU',
    marca: 'GTMax3D',
    cor: 'Preto',
    pesoTotal: 800,
    quantidadeDisponivel: 650,
    valorCompra: 160.00,
    dataCompra: '2026-03-12',
    fornecedor: 'GTMax3D Equipamentos',
    observacoes: 'Excelente flexibilidade e absorção de impactos'
  }
];

export const INITIAL_PRINTERS: Printer[] = [
  {
    id: 'prt-1',
    nome: 'Ender 3 V2 Core',
    marca: 'Creality',
    modelo: 'Ender 3 V2',
    potenciaWatts: 350,
    status: 'Ativa'
  },
  {
    id: 'prt-2',
    nome: 'Prusa i3 Workhorse',
    marca: 'Original Prusa',
    modelo: 'i3 MK3S+',
    potenciaWatts: 320,
    status: 'Ativa'
  },
  {
    id: 'prt-3',
    nome: 'K1 Speed Demon',
    marca: 'Creality',
    modelo: 'K1 Max',
    potenciaWatts: 1000,
    status: 'Manutenção'
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    nome: 'Carlos Eduardo Oliveira',
    cpfCnpj: '123.456.789-00',
    telefone: '(11) 99999-1111',
    whatsapp: '(11) 99999-1111',
    email: 'carlos@email.com',
    endereco: 'Av. Paulista, 1000, Apto 52 - Bela Vista, São Paulo - SP',
    observacoes: 'Cliente recorrente de vasos e peças de design'
  },
  {
    id: 'cli-2',
    nome: 'Mariana Silva de Souza',
    cpfCnpj: '987.654.321-11',
    telefone: '(21) 98888-2222',
    whatsapp: '(21) 98888-2222',
    email: 'mariana@email.com',
    endereco: 'Rua Copacabana, 200, Bloco B - Copacabana, Rio de Janeiro - RJ',
    observacoes: 'Solicita orçamentos frequentes de brindes corporativos'
  },
  {
    id: 'cli-3',
    nome: 'Mecânica AeroTech LTDA',
    cpfCnpj: '12.345.678/0001-90',
    telefone: '(31) 3444-5555',
    whatsapp: '(31) 97777-6666',
    email: 'compras@aerotech.com.br',
    endereco: 'Rodovia MG-010, KM 22 - Vespasiano - MG',
    observacoes: 'Peças industriais em PETG e ABS sob demanda'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    nome: 'Vaso Espiral Orgânico',
    categoria: 'Decoração',
    descricao: 'Vaso decorativo com geometria orgânica espiralada e textura fosca elegante',
    tempoImpressao: 6, // hours
    impressoraPadraoId: 'prt-1',
    materials: [
      { tipoFilamento: 'PLA', filamentoId: 'fil-2', quantidadeGrams: 120 }
    ],
    tempoAcabamento: 0.5,
    valorMaoDeObra: 20.00,
    observacoes: 'Imprimir em modo vaso (spiralize outer contour) para melhor acabamento'
  },
  {
    id: 'prod-2',
    nome: 'Suporte de Notebook Articulado',
    categoria: 'Escritório',
    descricao: 'Suporte ajustável em múltiplos ângulos com encaixe reforçado para laptops pesados',
    tempoImpressao: 12, // hours
    impressoraPadraoId: 'prt-2',
    materials: [
      { tipoFilamento: 'PETG', filamentoId: 'fil-3', quantidadeGrams: 280 }
    ],
    tempoAcabamento: 1.0,
    valorMaoDeObra: 45.00,
    observacoes: 'Preenchimento de 30% giroidal para maior rigidez'
  },
  {
    id: 'prod-3',
    nome: 'Action Figure Dragão Articulado',
    categoria: 'Colecionáveis',
    descricao: 'Dragão articulado com alto nível de detalhamento e juntas perfeitamente móveis',
    tempoImpressao: 8, // hours
    impressoraPadraoId: 'prt-1',
    materials: [
      { tipoFilamento: 'PLA', filamentoId: 'fil-1', quantidadeGrams: 150 },
      { tipoFilamento: 'ABS', filamentoId: 'fil-4', quantidadeGrams: 30 }
    ],
    tempoAcabamento: 1.5,
    valorMaoDeObra: 60.00,
    observacoes: 'Suportes em árvore facilitam a remoção e dão melhor acabamento nas articulações'
  }
];

export const INITIAL_PRODUCT_STOCKS: ProductStock[] = [
  { produtoId: 'prod-1', quantidadeDisponivel: 4 },
  { produtoId: 'prod-2', quantidadeDisponivel: 2 },
  { produtoId: 'prod-3', quantidadeDisponivel: 1 }
];

export const INITIAL_PURCHASES: Purchase[] = [
  {
    id: 'pur-1',
    data: '2026-06-01',
    fornecedor: '3D Prime',
    filamentoId: 'fil-1',
    quantidadeAdquirida: 1000,
    valorPago: 120.00,
    notaFiscal: 'NF-3490',
    observacoes: 'Estoque inicial de PLA Branco'
  },
  {
    id: 'pur-2',
    data: '2026-06-15',
    fornecedor: 'Esun Brasil',
    filamentoId: 'fil-2',
    quantidadeAdquirida: 1000,
    valorPago: 130.00,
    notaFiscal: 'NF-1283',
    observacoes: 'PLA Preto Fosco profissional'
  },
  {
    id: 'pur-3',
    data: '2026-05-10',
    fornecedor: 'Voolt3D Store',
    filamentoId: 'fil-3',
    quantidadeAdquirida: 1000,
    valorPago: 110.00,
    notaFiscal: 'NF-9821',
    observacoes: 'Rolo novo de PETG Transparente'
  }
];

export const INITIAL_PRODUCTION: ProductionOrder[] = [
  {
    id: 'prod-ord-1',
    numero: 'PROD-001',
    data: '2026-07-02',
    produtoId: 'prod-1',
    quantidade: 3,
    impressoraId: 'prt-1',
    operador: 'Eduardo Henrique',
    status: 'Finalizada',
    custoFilamento: 46.80, // calculation based on PLA Max rate (130 / 1000 = 0.13 * 120g * 3 = 46.80)
    custoEnergia: 5.355, // (350 * 6) / 1000 * 0.85 * 3 = 5.355
    custoMaoDeObra: 60.00, // 20 * 3
    custoTotal: 112.155,
    custoUnitario: 37.385,
    maoDeObraEscolha: 'unitario',
    maoDeObraValor: 20.00,
    observacoes: 'Lote finalizado com sucesso'
  },
  {
    id: 'prod-ord-2',
    numero: 'PROD-002',
    data: '2026-07-05',
    produtoId: 'prod-2',
    quantidade: 1,
    impressoraId: 'prt-2',
    operador: 'Eduardo Henrique',
    status: 'Finalizada',
    custoFilamento: 30.80, // 110 / 1000 = 0.11 * 280g = 30.80
    custoEnergia: 3.264, // (320 * 12) / 1000 * 0.85 * 1 = 3.264
    custoMaoDeObra: 45.00,
    custoTotal: 79.064,
    custoUnitario: 79.064,
    maoDeObraEscolha: 'unitario',
    maoDeObraValor: 45.00,
    observacoes: 'Peça saiu perfeita'
  },
  {
    id: 'prod-ord-3',
    numero: 'PROD-003',
    data: '2026-07-14',
    produtoId: 'prod-3',
    quantidade: 1,
    impressoraId: 'prt-1',
    operador: 'Guilherme Braga',
    status: 'Em Produção',
    custoFilamento: 0,
    custoEnergia: 0,
    custoMaoDeObra: 0,
    custoTotal: 0,
    custoUnitario: 0,
    maoDeObraEscolha: 'unitario',
    maoDeObraValor: 60.00,
    observacoes: 'Fabricação iniciada à tarde'
  }
];

export const INITIAL_BUDGETS: Budget[] = [
  {
    id: 'bdg-1',
    numero: 'ORÇ-001',
    clienteId: 'cli-1',
    dataEmissao: '2026-07-01',
    validade: '2026-07-15',
    itens: [
      { produtoId: 'prod-1', quantidade: 2, valorUnitario: 85.00, desconto: 5.00 },
      { produtoId: 'prod-3', quantidade: 1, valorUnitario: 220.00, desconto: 0 }
    ],
    descontoGeral: 10.00,
    observacoes: 'Cliente negociou desconto no vaso. Validade estendida.',
    status: 'Aprovado'
  },
  {
    id: 'bdg-2',
    numero: 'ORÇ-002',
    clienteId: 'cli-2',
    dataEmissao: '2026-07-10',
    validade: '2026-07-25',
    itens: [
      { produtoId: 'prod-2', quantidade: 3, valorUnitario: 180.00, desconto: 0 }
    ],
    descontoGeral: 0,
    observacoes: 'Aguardando aprovação do financeiro',
    status: 'Enviado'
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sal-1',
    numero: 'VND-2026-0001',
    clienteId: 'cli-1',
    dataVenda: '2026-07-02',
    itens: [
      { produtoId: 'prod-1', quantidade: 2, valorUnitario: 85.00, desconto: 5.00 },
      { produtoId: 'prod-3', quantidade: 1, valorUnitario: 220.00, desconto: 0 }
    ],
    valorTotal: 370.00, // (80*2) + 220 - 10 general discount = 370
    formaPagamento: 'Pix',
    statusPagamento: 'Pago',
    orcamentoOrigemId: 'bdg-1'
  }
];

export const INITIAL_MOVEMENTS: StockMovement[] = [
  {
    id: 'mvt-1',
    data: '2026-06-01',
    tipo: 'entrada',
    origem: 'compra',
    referenciaId: 'pur-1',
    filamentoId: 'fil-1',
    quantidade: 1000,
    descricao: 'Compra de PLA Branco Premium'
  },
  {
    id: 'mvt-2',
    data: '2026-06-15',
    tipo: 'entrada',
    origem: 'compra',
    referenciaId: 'pur-2',
    filamentoId: 'fil-2',
    quantidade: 1000,
    descricao: 'Compra de PLA Preto Fosco'
  },
  {
    id: 'mvt-3',
    data: '2026-07-02',
    tipo: 'saida',
    origem: 'producao_consumo',
    referenciaId: 'prod-ord-1',
    filamentoId: 'fil-2',
    quantidade: 360, // 120g * 3
    descricao: 'Consumo de filamento PLA na produção PROD-001'
  },
  {
    id: 'mvt-4',
    data: '2026-07-02',
    tipo: 'entrada',
    origem: 'producao_entrada',
    referenciaId: 'prod-ord-1',
    produtoId: 'prod-1',
    quantidade: 3,
    descricao: 'Entrada de 3x Vaso Espiral Orgânico'
  }
];
