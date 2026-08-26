import { formatDateBR } from '../utils/formatters.js';
import { getActiveTenantId } from '../utils/storage.js';
import { calculateProductPricing, DEFAULT_GLOBAL_PRICING_CONFIG } from '../utils/businessCalculations.js';
import { Filament, Printer, EnergyTariff } from '../types.js';
import fs from 'fs';
import path from 'path';

function runSuite() {
  console.log('🧪 Executando Bateria de Testes Automatizados - ELMANEKO 3D ERP...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(` ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(` ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Testes de Formatação de Data
  console.log('[1] Testes do Utilitário de Datas (DD/MM/YYYY)');
  assert(formatDateBR('2026-07-30') === '30/07/2026', 'Formata data ISO YYYY-MM-DD para DD/MM/YYYY');
  assert(formatDateBR('2026-12-01') === '01/12/2026', 'Formata data com dia de um dígito');
  assert(formatDateBR('') === '—', 'Retorna travessão para data em branco');
  assert(formatDateBR(null as any) === '—', 'Retorna travessão para null');

  // 2. Testes de Segurança RLS Multi-tenant no DDL
  console.log('\n[2] Testes de Auditoria RLS Multi-Tenant no SQL');
  const migrationPath = path.join(process.cwd(), 'supabase_migration.sql');
  const migrationContent = fs.readFileSync(migrationPath, 'utf-8');

  assert(!migrationContent.includes('USING (true)'), 'supabase_migration.sql NÃO contém nenhuma política permissiva USING (true)');
  assert(migrationContent.includes('is_empresa_member'), 'supabase_migration.sql utiliza a função is_empresa_member');
  assert(!migrationContent.includes('00000000-0000-0000-0000-000000000001'), 'supabase_migration.sql NÃO contém o UUID demo hardcoded');
  assert(!migrationContent.includes('CREATE POLICY usuario_empresa_insert_self'), 'Associação de usuário à empresa não pode ser inserida diretamente pelo cliente');
  assert(migrationContent.includes('bootstrap_empresa_do_usuario'), 'Provisionamento inicial de empresa utiliza RPC segura');
  assert(migrationContent.includes('p_valor_pago IS NULL OR p_valor_pago <= 0'), 'Liquidação financeira rejeita valor não positivo');
  assert(migrationContent.includes("v_lanc.status IN ('Liquidado', 'Cancelado')"), 'Liquidação financeira bloqueia lançamento já encerrado');
  assert(migrationContent.includes('idx_vendas_orcamento_origem_unique'), 'Conversão de orçamento possui unicidade de venda de origem');
  assert(migrationContent.includes('concluir_producao'), 'Conclusão de produção é executada por RPC atômica');

  // 4. Teste de Resolução de Tenant
  console.log('\n[4] Teste de Resolução de Tenant (getActiveTenantId)');
  let throwsWithoutTenant = false;
  try {
    getActiveTenantId();
  } catch (e: any) {
    throwsWithoutTenant = e.message.includes('Nenhuma empresa ativa');
  }
  assert(throwsWithoutTenant, 'getActiveTenantId lança exceção explícita se nenhuma empresa estiver selecionada');

  // 5. Testes da Rotina Centralizada de Cálculo de Precificação
  console.log('\n[5] Testes da Rotina Centralizada de Cálculo de Precificação');
  const mockFilaments: Filament[] = [
    {
      id: 'f1',
      nome: 'PLA Premium Preto',
      tipo: 'PLA',
      marca: 'Esun',
      cor: 'Preto',
      pesoTotal: 1000,
      quantidadeDisponivel: 1000,
      valorCompra: 120, // R$ 0.12 / g
      dataCompra: '2026-01-01',
      fornecedor: 'Filamentos BR'
    }
  ];

  const mockPrinters: Printer[] = [
    {
      id: 'p1',
      nome: 'Bambu Lab X1C',
      marca: 'Bambu Lab',
      modelo: 'X1C',
      potenciaWatts: 350,
      status: 'Ativa'
    }
  ];

  const mockTariffs: EnergyTariff[] = [
    {
      id: 't1',
      dataInicio: '2026-01-01',
      valorKwh: 1.00 // R$ 1.00 / kWh
    }
  ];

  const customGlobalConfig = {
    margemLucroPadrao: 100, // 100%
    outrasDespesasPadrao: 5.00,
    valorMaoDeObraPadrao: 20.00
  };

  // Teste 5.1: Cálculo com Herança Global Padrão
  // BOM: 100g * R$ 0.12/g = R$ 12.00
  // Energia: (350W * 4h / 1000) * R$ 1.00 = R$ 1.40
  // Mão de Obra (Global): R$ 20.00
  // Outras Despesas (Global): R$ 5.00
  // Custo Total = 12.00 + 1.40 + 20.00 + 5.00 = R$ 38.40
  // Preço (Margem 100%): 38.40 * 2.0 = R$ 76.80
  const resultGlobal = calculateProductPricing({
    materials: [{ tipoFilamento: 'PLA', filamentoId: 'f1', quantidadeGrams: 100 }],
    filaments: mockFilaments,
    tempoImpressao: 4,
    impressoraPadraoId: 'p1',
    printers: mockPrinters,
    tariffs: mockTariffs,
    globalConfig: customGlobalConfig
  });

  assert(resultGlobal.costBOM === 12.00, 'Calcula custo dos materiais (BOM) corretamente');
  assert(resultGlobal.costEnergy === 1.40, 'Calcula custo de energia elétrica corretamente');
  assert(resultGlobal.costTotal === 38.40, 'Soma o custo total de manufatura (BOM + Energia + Mão de Obra + Outras Despesas)');
  assert(resultGlobal.suggestedPrice === 76.80, 'Calcula preço final sugerido com margem global de 100%');
  assert(resultGlobal.isUsingGlobalMargin === true, 'Identifica herança da margem global');
  assert(resultGlobal.isUsingGlobalMaoDeObra === true, 'Identifica herança da mão de obra global');
  assert(resultGlobal.isUsingGlobalOutrasDespesas === true, 'Identifica herança de outras despesas globais');

  // Teste 5.2: Cálculo com Exceções Específicas no Produto
  // Mão de obra customizada: R$ 40.00
  // Margem customizada: 150%
  // Custo Total = 12.00 + 1.40 + 40.00 + 5.00 = R$ 58.40
  // Preço (Margem 150%): 58.40 * 2.5 = R$ 146.00
  const resultCustom = calculateProductPricing({
    materials: [{ tipoFilamento: 'PLA', filamentoId: 'f1', quantidadeGrams: 100 }],
    filaments: mockFilaments,
    tempoImpressao: 4,
    impressoraPadraoId: 'p1',
    printers: mockPrinters,
    tariffs: mockTariffs,
    hasCustomMargemLucro: true,
    margemLucro: 150,
    hasCustomMaoDeObra: true,
    valorMaoDeObra: 40.00,
    globalConfig: customGlobalConfig
  });

  assert(resultCustom.costTotal === 58.40, 'Aplica exceção de mão de obra do produto no custo total');
  assert(resultCustom.suggestedPrice === 146.00, 'Aplica exceção de margem de lucro do produto sobre o custo total');
  assert(resultCustom.isUsingGlobalMargin === false, 'Reconhece exceção de margem de lucro');
  assert(resultCustom.isUsingGlobalMaoDeObra === false, 'Reconhece exceção de mão de obra');
  assert(resultCustom.isUsingGlobalOutrasDespesas === true, 'Mantém herança global para campo não sobrescrito');

  // Teste 5.3: Arredondamento Monetário e Não-Negatividade
  const resultNegative = calculateProductPricing({
    materials: [{ tipoFilamento: 'PLA', filamentoId: 'f1', quantidadeGrams: 33.33 }],
    filaments: mockFilaments,
    tempoImpressao: -5, // Inválido
    impressoraPadraoId: 'p1',
    printers: mockPrinters,
    tariffs: mockTariffs,
    margemLucro: -50, // Inválido
    valorMaoDeObra: -10, // Inválido
    hasCustomMargemLucro: true,
    hasCustomMaoDeObra: true,
    globalConfig: customGlobalConfig
  });

  assert(resultNegative.costEnergy >= 0, 'Rejeita tempo de impressão negativo');
  assert(resultNegative.margemLucro >= 0, 'Rejeita margem de lucro negativa');
  assert(resultNegative.valorMaoDeObra >= 0, 'Rejeita mão de obra negativa');
  assert(Number.isInteger(Math.round(resultNegative.suggestedPrice * 100)), 'Garante arredondamento exato em 2 casas decimais');

  // Teste 5.4: Preservação de Valores de Mão de Obra e Outras Despesas
  // Custo Direto (100g PLA + 4h Energia) = R$ 13.40
  // Mão de obra fixada em R$ 50.00, Outras Despesas em R$ 10.00
  // Custo Total = 13.40 + 50.00 + 10.00 = R$ 73.40
  const resultPreserved = calculateProductPricing({
    materials: [{ tipoFilamento: 'PLA', filamentoId: 'f1', quantidadeGrams: 100 }],
    filaments: mockFilaments,
    tempoImpressao: 4,
    impressoraPadraoId: 'p1',
    printers: mockPrinters,
    tariffs: mockTariffs,
    hasCustomMaoDeObra: true,
    valorMaoDeObra: 50.00,
    hasCustomOutrasDespesas: true,
    outrasDespesas: 10.00,
    globalConfig: customGlobalConfig
  });

  assert(resultPreserved.valorMaoDeObra === 50.00, 'Preserva exatamente o valor de mão de obra atribuído (R$ 50.00)');
  assert(resultPreserved.outrasDespesas === 10.00, 'Preserva exatamente o valor de outras despesas atribuído (R$ 10.00)');
  assert(resultPreserved.costTotal === 73.40, 'Calcula o custo total exato (R$ 73.40)');

  console.log(`\n========================================`);
  console.log(`Resultado Final: ${passed} passaram, ${failed} falharam.`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite();

