import { formatDateBR } from '../utils/formatters.js';
import { getActiveTenantId } from '../utils/storage.js';
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

  console.log(`\n========================================`);
  console.log(`Resultado Final: ${passed} passaram, ${failed} falharam.`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite();
