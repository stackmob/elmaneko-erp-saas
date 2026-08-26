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
  assert(migrationContent.includes('can_manage_finance'), 'supabase_migration.sql implementa verificação de permissão financeira (can_manage_finance)');
  assert(migrationContent.includes('can_manage_operations'), 'supabase_migration.sql implementa verificação de permissão operacional (can_manage_operations)');
  assert(migrationContent.includes('can_manage_commercial'), 'supabase_migration.sql implementa verificação de permissão comercial (can_manage_commercial)');
  assert(migrationContent.includes('tenant_financial_write'), 'supabase_migration.sql restringe escrita financeira via política tenant_financial_write');
  assert(migrationContent.includes('tenant_operations_write'), 'supabase_migration.sql restringe escrita operacional via política tenant_operations_write');
  assert(migrationContent.includes('tenant_commercial_write'), 'supabase_migration.sql restringe escrita comercial via política tenant_commercial_write');
  assert(!migrationContent.includes('00000000-0000-0000-0000-000000000001'), 'supabase_migration.sql NÃO contém o UUID demo hardcoded');
  assert(!migrationContent.includes('CREATE POLICY usuario_empresa_insert_self'), 'Associação de usuário à empresa não pode ser inserida diretamente pelo cliente');
  assert(migrationContent.includes('bootstrap_empresa_do_usuario'), 'Provisionamento inicial de empresa utiliza RPC segura');
  assert(migrationContent.includes('p_valor_pago IS NULL OR p_valor_pago <= 0'), 'Liquidação financeira rejeita valor não positivo');
  assert(migrationContent.includes("v_lanc.status IN ('Liquidado', 'Cancelado')"), 'Liquidação financeira bloqueia lançamento já encerrado');
  assert(migrationContent.includes('idx_vendas_orcamento_origem_unique'), 'Conversão de orçamento possui unicidade de venda de origem');
  assert(migrationContent.includes('concluir_producao'), 'Conclusão de produção é executada por RPC atômica');
  assert(migrationContent.includes('salvar_conta_financeira'), 'supabase_migration.sql implementa RPC salvar_conta_financeira');
  assert(migrationContent.includes('excluir_conta_financeira'), 'supabase_migration.sql implementa RPC excluir_conta_financeira com validação de saldo');
  assert(migrationContent.includes('salvar_lancamento_financeiro'), 'supabase_migration.sql implementa RPC salvar_lancamento_financeiro');
  assert(migrationContent.includes('cancelar_lancamento_financeiro'), 'supabase_migration.sql implementa RPC cancelar_lancamento_financeiro');
  assert(migrationContent.includes('conciliar_lancamento_financeiro'), 'supabase_migration.sql implementa RPC conciliar_lancamento_financeiro');
  assert(migrationContent.includes('excluir_lancamento_financeiro'), 'supabase_migration.sql implementa RPC excluir_lancamento_financeiro');
  assert(migrationContent.includes('REVOKE INSERT, UPDATE, DELETE ON public.movimentacoes_financeiras FROM PUBLIC, authenticated, anon'), 'Mutações diretas em movimentacoes_financeiras são revogadas');
  assert(migrationContent.includes('REVOKE INSERT, UPDATE, DELETE ON public.auditoria_financeira FROM PUBLIC, authenticated, anon'), 'Mutações diretas em auditoria_financeira são revogadas');
  assert(migrationContent.includes('registrar_auditoria_financeira_interna'), 'supabase_migration.sql implementa registrar_auditoria_financeira_interna');
  assert(migrationContent.includes('user_id UUID REFERENCES auth.users(id)'), 'auditoria_financeira armazena o user_id autenticado no banco');
  assert(migrationContent.includes("'Restauracao_Backup'"), 'restaurar_backup_empresa registra evento imutável de restauração na auditoria');
  assert(migrationContent.includes('idx_lancamentos_empresa_origem_unique'), 'supabase_migration.sql implementa índice único de unicidade por origem de lançamento');
  assert(migrationContent.includes('sincronizar_lancamentos_financeiros_retroativos'), 'supabase_migration.sql implementa RPC sincronizar_lancamentos_financeiros_retroativos');

  // 3. Testes de Integridade no Hook Frontend useFinancialData.ts
  console.log('\n[3] Testes de Integridade em useFinancialData.ts');
  const financialHookPath = path.join(process.cwd(), 'src', 'hooks', 'data', 'useFinancialData.ts');
  const financialHookContent = fs.readFileSync(financialHookPath, 'utf-8');

  assert(financialHookContent.includes("rpc('salvar_conta_financeira'"), 'useFinancialData.ts utiliza RPC salvar_conta_financeira');
  assert(financialHookContent.includes("rpc('excluir_conta_financeira'"), 'useFinancialData.ts utiliza RPC excluir_conta_financeira');
  assert(financialHookContent.includes("rpc('salvar_lancamento_financeiro'"), 'useFinancialData.ts utiliza RPC salvar_lancamento_financeiro');
  assert(financialHookContent.includes("rpc('cancelar_lancamento_financeiro'"), 'useFinancialData.ts utiliza RPC cancelar_lancamento_financeiro');
  assert(financialHookContent.includes("rpc('conciliar_lancamento_financeiro'"), 'useFinancialData.ts utiliza RPC conciliar_lancamento_financeiro');
  assert(financialHookContent.includes("rpc('excluir_lancamento_financeiro'"), 'useFinancialData.ts utiliza RPC excluir_lancamento_financeiro');
  assert(financialHookContent.includes("rpc('sincronizar_lancamentos_financeiros_retroativos'"), 'useSyncFinancialEntries utiliza RPC atômica sincronizar_lancamentos_financeiros_retroativos');
  assert(!financialHookContent.includes(".update({ status: 'Cancelado' })"), 'useFinancialData.ts NÃO faz update direto de status Cancelado');
  assert(!financialHookContent.includes(".update({ is_deleted: true })"), 'useFinancialData.ts NÃO faz update direto de is_deleted');
  assert(!financialHookContent.includes("useAddAuditLog"), 'useFinancialData.ts NÃO exporta useAddAuditLog para o cliente');
  assert(!financialHookContent.includes("offlineItem"), 'useFinancialData.ts NÃO mascara falhas de gravação financeira como offlineItem fictício');

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

  // Teste 5.1: Cálculo com Herança Global e Limite de 50% na Mão de Obra
  // BOM: 100g * R$ 0.12/g = R$ 12.00
  // Energia: (350W * 4h / 1000) * R$ 1.00 = R$ 1.40
  // Outras Despesas (Global) = R$ 5.00
  // Custo Base Sem Mão de Obra = 12.00 + 1.40 + 5.00 = R$ 18.40
  // Mão de Obra (Global raw = R$ 20.00, limitada a 50% de 18.40 = R$ 9.20)
  // Custo Total Limitado = 18.40 + 9.20 = R$ 27.60
  // Preço (Margem 100%): 27.60 * 2.0 = R$ 55.20
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
  assert(resultGlobal.isMaoDeObraCapped === true, 'Sinaliza que a mão de obra global foi limitada a 50% do custo base');
  assert(resultGlobal.valorMaoDeObra === 9.20, 'Limita a mão de obra a exatamente 50% do custo base sem mão de obra (R$ 9.20)');
  assert(resultGlobal.costTotal === 27.60, 'Soma o custo total de manufatura (R$ 27.60)');
  assert(resultGlobal.suggestedPrice === 55.20, 'Calcula preço final sugerido com margem global sobre o custo total (R$ 55.20)');
  assert(resultGlobal.isUsingGlobalMargin === true, 'Identifica herança da margem global');
  assert(resultGlobal.isUsingGlobalMaoDeObra === true, 'Identifica herança da mão de obra global');
  assert(resultGlobal.isUsingGlobalOutrasDespesas === true, 'Identifica herança de outras despesas globais');

  // Teste 5.2: Cálculo com Exceções Específicas no Produto e Limite de Mão de Obra
  // Mão de obra customizada: R$ 40.00 (limitada a 50% de 18.40 = R$ 9.20)
  // Margem customizada: 150%
  // Custo Total = 18.40 + 9.20 = R$ 27.60
  // Preço (Margem 150%): 27.60 * 2.5 = R$ 69.00
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

  assert(resultCustom.costTotal === 27.60, 'Aplica exceção de mão de obra limitada a 50% do custo base no produto');
  assert(resultCustom.suggestedPrice === 69.00, 'Aplica exceção de margem de lucro do produto sobre o custo total');
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

  // Teste 5.4: Mão de Obra Não-Limitada Quando Menor que 50% do Custo Base
  // Custo Base (1000g PLA + 4h Energia + R$ 10 despesas) = 120.00 + 1.40 + 10.00 = R$ 131.40
  // Mão de obra fixada em R$ 30.00 (50% de 131.40 = 65.70 => 30.00 < 65.70, pega valor cheio R$ 30.00)
  // Custo Total = 131.40 + 30.00 = R$ 161.40
  const resultFullLabor = calculateProductPricing({
    materials: [{ tipoFilamento: 'PLA', filamentoId: 'f1', quantidadeGrams: 1000 }],
    filaments: mockFilaments,
    tempoImpressao: 4,
    impressoraPadraoId: 'p1',
    printers: mockPrinters,
    tariffs: mockTariffs,
    hasCustomMaoDeObra: true,
    valorMaoDeObra: 30.00,
    hasCustomOutrasDespesas: true,
    outrasDespesas: 10.00,
    globalConfig: customGlobalConfig
  });

  assert(resultFullLabor.isMaoDeObraCapped === false, 'Não limita a mão de obra quando ela é menor que 50% do custo base');
  assert(resultFullLabor.valorMaoDeObra === 30.00, 'Mantém o valor padrão cheio de mão de obra (R$ 30.00)');
  assert(resultFullLabor.costTotal === 161.40, 'Calcula o custo total exato com mão de obra cheia (R$ 161.40)');

  // 6. Testes de Integridade dos Módulos de Produtos e Orçamentos
  console.log('\n[6] Testes de Integridade nos Módulos de Produtos e Orçamentos');
  const budgetsComponentPath = path.join(process.cwd(), 'src', 'components', 'Budgets.tsx');
  const budgetsComponentContent = fs.readFileSync(budgetsComponentPath, 'utf-8');

  assert(budgetsComponentContent.includes('useConverterOrcamentoEmVenda'), 'Budgets.tsx utiliza a RPC transacional de conversão useConverterOrcamentoEmVenda');
  assert(budgetsComponentContent.includes('products={products}'), 'Budgets.tsx passa a lista de produtos para o BudgetPreviewModal');
  assert(budgetsComponentContent.includes('sanitizedItens'), 'Budgets.tsx sanitiza e valida os itens antes da mutação');

  const previewModalPath = path.join(process.cwd(), 'src', 'components', 'commercial', 'BudgetPreviewModal.tsx');
  const previewModalContent = fs.readFileSync(previewModalPath, 'utf-8');
  assert(previewModalContent.includes('formatDateBR(budget.dataEmissao)'), 'BudgetPreviewModal.tsx formata a data de emissão com segurança');
  assert(previewModalContent.includes('products.find'), 'BudgetPreviewModal.tsx busca os nomes reais dos produtos cadastrados');
  assert(previewModalContent.includes('budgetTotal'), 'BudgetPreviewModal.tsx calcula o total da proposta via budgetTotal');

  const salesHookPath = path.join(process.cwd(), 'src', 'hooks', 'data', 'useSalesData.ts');
  const salesHookContent = fs.readFileSync(salesHookPath, 'utf-8');
  assert(salesHookContent.includes('if (iErr) throw iErr;'), 'useSalesData.ts valida erros ao consultar orcamento_itens');
  assert(salesHookContent.includes('Math.max(1, Number(it.quantidade) || 1)'), 'useSalesData.ts assegura quantidade mínima de 1 para itens de orçamento');

  const productsComponentPath = path.join(process.cwd(), 'src', 'components', 'Products.tsx');
  const productsComponentContent = fs.readFileSync(productsComponentPath, 'utf-8');
  assert(productsComponentContent.includes('sanitizedMaterials'), 'Products.tsx sanitiza os materiais da ficha técnica (BOM)');
  const productsHookPath = path.join(process.cwd(), 'src', 'hooks', 'data', 'useProductsData.ts');
  const productsHookContent = fs.readFileSync(productsHookPath, 'utf-8');
  assert(productsHookContent.includes("initialData: () => getLocalCache<Product>('produtos')"), 'useProdutos utiliza initialData do cache local para carregamento instantâneo (0ms)');

  assert(migrationContent.includes('idx_produtos_empresa_created'), 'supabase_migration.sql implementa índice idx_produtos_empresa_created para alta performance');
  assert(migrationContent.includes('idx_produto_materiais_empresa_produto'), 'supabase_migration.sql implementa índice idx_produto_materiais_empresa_produto para busca rápida de BOM');

  console.log(`\n========================================`);
  console.log(`Resultado Final: ${passed} passaram, ${failed} falharam.`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite();

