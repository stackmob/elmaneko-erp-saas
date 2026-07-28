import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("❌ ERRO: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidos no .env");
  process.exit(1);
}

const supabase = createClient(url, key);

async function runPersistenceTest() {
  console.log("============== 🧪 INICIANDO TESTE DE PERSISTÊNCIA DAS TABELAS ==============\n");
  console.log(`URL do Supabase: ${url}\n`);

  const results = [];
  const cleanupTasks = [];

  function logResult(tableName, operation, success, details = '', error = null) {
    results.push({
      tabela: tableName,
      operacao: operation,
      status: success ? '✅ PASS' : '❌ FAIL',
      detalhes: details,
      erro: error ? error.message || String(error) : ''
    });
    const statusIcon = success ? '✅' : '❌';
    console.log(`[${statusIcon} ${operation.toUpperCase()}] Tabela: ${tableName} ${details ? `(${details})` : ''}`);
    if (error) {
      console.log(`   └─ Erro: ${error.message || JSON.stringify(error)}`);
    }
  }

  // IDs acumulados para manter as FKs válidas durante os testes
  let empresaId = null;
  let clienteId = null;
  let filamentoId = null;
  let impressoraId = null;
  let produtoId = null;
  let orcamentoId = null;
  let vendaId = null;
  let backupId = null;

  try {
    // 1. TABELA: empresas
    console.log("\n--- 1. Testando Tabela 'empresas' ---");
    const testEmpresaNome = `Empresa Teste ${Date.now()}`;
    const { data: empData, error: empErr } = await supabase
      .from('empresas')
      .insert([{ nome: testEmpresaNome }])
      .select()
      .single();

    if (empErr) {
      logResult('empresas', 'INSERT', false, '', empErr);
    } else {
      empresaId = empData.id;
      cleanupTasks.push(async () => supabase.from('empresas').delete().eq('id', empresaId));
      logResult('empresas', 'INSERT', true, `ID: ${empresaId}`);

      // SELECT
      const { data: empSel, error: empSelErr } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .single();
      logResult('empresas', 'SELECT', !empSelErr && empSel?.nome === testEmpresaNome, '', empSelErr);

      // UPDATE
      const { error: empUpErr } = await supabase
        .from('empresas')
        .update({ nome: `${testEmpresaNome} (Updated)` })
        .eq('id', empresaId);
      logResult('empresas', 'UPDATE', !empUpErr, '', empUpErr);
    }

    if (!empresaId) {
      console.error("\n❌ Falha crítica: Impossível prosseguir sem empresa_id. Verifique se RLS ou permissões do Supabase estão bloqueando INSERT na tabela 'empresas'.");
      return;
    }

    // 2. TABELA: usuario_empresa
    console.log("\n--- 2. Testando Tabela 'usuario_empresa' ---");
    // Tenta obter um user id da sessão ou testa SELECT
    const { data: authUser } = await supabase.auth.getUser();
    const testUserId = authUser?.user?.id;

    if (testUserId) {
      const { data: ueData, error: ueErr } = await supabase
        .from('usuario_empresa')
        .insert([{ user_id: testUserId, empresa_id: empresaId, role: 'admin' }])
        .select()
        .single();

      if (ueErr) {
        logResult('usuario_empresa', 'INSERT', false, '', ueErr);
      } else {
        cleanupTasks.push(async () => supabase.from('usuario_empresa').delete().eq('user_id', testUserId));
        logResult('usuario_empresa', 'INSERT', true, `User ID: ${testUserId}`);
      }
    } else {
      const { data: ueSel, error: ueSelErr } = await supabase.from('usuario_empresa').select('*').limit(1);
      logResult('usuario_empresa', 'SELECT (Anon User)', !ueSelErr, 'Sem usuário autenticado para teste INSERT FK auth.users', ueSelErr);
    }

    // 3. TABELA: clientes
    console.log("\n--- 3. Testando Tabela 'clientes' ---");
    const { data: cliData, error: cliErr } = await supabase
      .from('clientes')
      .insert([{
        empresa_id: empresaId,
        nome: 'Cliente Teste Persistência',
        cpf_cnpj: '000.000.000-00',
        telefone: '11999999999',
        whatsapp: '11999999999',
        email: 'cliente.teste@example.com',
        endereco: 'Rua Teste, 123',
        observacoes: 'Cliente gerado por teste de persistência'
      }])
      .select()
      .single();

    if (cliErr) {
      logResult('clientes', 'INSERT', false, '', cliErr);
    } else {
      clienteId = cliData.id;
      cleanupTasks.push(async () => supabase.from('clientes').delete().eq('id', clienteId));
      logResult('clientes', 'INSERT', true, `ID: ${clienteId}`);

      const { data: cliSel, error: cliSelErr } = await supabase.from('clientes').select('*').eq('id', clienteId).single();
      logResult('clientes', 'SELECT', !cliSelErr && cliSel?.nome === 'Cliente Teste Persistência', '', cliSelErr);

      const { error: cliUpErr } = await supabase.from('clientes').update({ nome: 'Cliente Teste Alterado' }).eq('id', clienteId);
      logResult('clientes', 'UPDATE', !cliUpErr, '', cliUpErr);
    }

    // 4. TABELA: filamentos
    console.log("\n--- 4. Testando Tabela 'filamentos' ---");
    const { data: filData, error: filErr } = await supabase
      .from('filamentos')
      .insert([{
        empresa_id: empresaId,
        nome: 'PLA Premium Preto',
        tipo: 'PLA',
        marca: '3DLab',
        cor: 'Preto',
        peso_total: 1000,
        quantidade_disponivel: 1000,
        valor_compra: 120.00,
        data_compra: '2026-01-01',
        fornecedor: 'Fornecedor Teste',
        observacoes: 'Filamento de teste'
      }])
      .select()
      .single();

    if (filErr) {
      logResult('filamentos', 'INSERT', false, '', filErr);
    } else {
      filamentoId = filData.id;
      cleanupTasks.push(async () => supabase.from('filamentos').delete().eq('id', filamentoId));
      logResult('filamentos', 'INSERT', true, `ID: ${filamentoId}`);

      const { data: filSel, error: filSelErr } = await supabase.from('filamentos').select('*').eq('id', filamentoId).single();
      logResult('filamentos', 'SELECT', !filSelErr && filSel?.tipo === 'PLA', '', filSelErr);

      const { error: filUpErr } = await supabase.from('filamentos').update({ cor: 'Preto Grafite' }).eq('id', filamentoId);
      logResult('filamentos', 'UPDATE', !filUpErr, '', filUpErr);
    }

    // 5. TABELA: compras
    console.log("\n--- 5. Testando Tabela 'compras' ---");
    if (filamentoId) {
      const { data: cmpData, error: cmpErr } = await supabase
        .from('compras')
        .insert([{
          empresa_id: empresaId,
          data: '2026-01-02',
          fornecedor: 'Fornecedor Filamento 3D',
          filamento_id: filamentoId,
          quantidade_adquirida: 2,
          valor_pago: 240.00,
          nota_fiscal: 'NF-12345',
          observacoes: 'Compra teste'
        }])
        .select()
        .single();

      if (cmpErr) {
        logResult('compras', 'INSERT', false, '', cmpErr);
      } else {
        const compraId = cmpData.id;
        cleanupTasks.push(async () => supabase.from('compras').delete().eq('id', compraId));
        logResult('compras', 'INSERT (com Gatilho de Estoque)', true, `ID: ${compraId}`);

        const { data: cmpSel, error: cmpSelErr } = await supabase.from('compras').select('*').eq('id', compraId).single();
        logResult('compras', 'SELECT', !cmpSelErr, '', cmpSelErr);

        const { error: cmpUpErr } = await supabase.from('compras').update({ nota_fiscal: 'NF-99999' }).eq('id', compraId);
        logResult('compras', 'UPDATE', !cmpUpErr, '', cmpUpErr);
      }
    } else {
      logResult('compras', 'INSERT', false, 'Ignorado pois filamentoId não foi criado');
    }

    // 6. TABELA: impressoras
    console.log("\n--- 6. Testando Tabela 'impressoras' ---");
    const { data: impData, error: impErr } = await supabase
      .from('impressoras')
      .insert([{
        empresa_id: empresaId,
        nome: 'Ender 3 V2 - 01',
        marca: 'Creality',
        modelo: 'Ender 3 V2',
        potencia_watts: 350,
        status: 'Ativa'
      }])
      .select()
      .single();

    if (impErr) {
      logResult('impressoras', 'INSERT', false, '', impErr);
    } else {
      impressoraId = impData.id;
      cleanupTasks.push(async () => supabase.from('impressoras').delete().eq('id', impressoraId));
      logResult('impressoras', 'INSERT', true, `ID: ${impressoraId}`);

      const { data: impSel, error: impSelErr } = await supabase.from('impressoras').select('*').eq('id', impressoraId).single();
      logResult('impressoras', 'SELECT', !impSelErr, '', impSelErr);

      const { error: impUpErr } = await supabase.from('impressoras').update({ potencia_watts: 360 }).eq('id', impressoraId);
      logResult('impressoras', 'UPDATE', !impUpErr, '', impUpErr);
    }

    // 7. TABELA: tarifas_energia
    console.log("\n--- 7. Testando Tabela 'tarifas_energia' ---");
    const { data: tarData, error: tarErr } = await supabase
      .from('tarifas_energia')
      .insert([{
        empresa_id: empresaId,
        data_inicio_vigencia: '2026-01-01',
        valor_kwh: 0.85
      }])
      .select()
      .single();

    if (tarErr) {
      logResult('tarifas_energia', 'INSERT', false, '', tarErr);
    } else {
      const tarifaId = tarData.id;
      cleanupTasks.push(async () => supabase.from('tarifas_energia').delete().eq('id', tarifaId));
      logResult('tarifas_energia', 'INSERT', true, `ID: ${tarifaId}`);

      const { data: tarSel, error: tarSelErr } = await supabase.from('tarifas_energia').select('*').eq('id', tarifaId).single();
      logResult('tarifas_energia', 'SELECT', !tarSelErr, '', tarSelErr);

      const { error: tarUpErr } = await supabase.from('tarifas_energia').update({ valor_kwh: 0.90 }).eq('id', tarifaId);
      logResult('tarifas_energia', 'UPDATE', !tarUpErr, '', tarUpErr);
    }

    // 8. TABELA: produtos
    console.log("\n--- 8. Testando Tabela 'produtos' ---");
    const { data: prdData, error: prdErr } = await supabase
      .from('produtos')
      .insert([{
        empresa_id: empresaId,
        nome: 'Suporte Headset Geometrico',
        categoria: 'Acessórios Gamer',
        descricao: 'Suporte de fone de ouvido impresso em 3D',
        tempo_impressao: 5.5,
        impressora_padrao_id: impressoraId,
        tempo_acabamento: 0.5,
        valor_mao_de_obra: 15.00,
        observacoes: 'Produto de teste'
      }])
      .select()
      .single();

    if (prdErr) {
      logResult('produtos', 'INSERT', false, '', prdErr);
    } else {
      produtoId = prdData.id;
      cleanupTasks.push(async () => supabase.from('produtos').delete().eq('id', produtoId));
      logResult('produtos', 'INSERT (com Trigger de Estoque)', true, `ID: ${produtoId}`);

      const { data: prdSel, error: prdSelErr } = await supabase.from('produtos').select('*').eq('id', produtoId).single();
      logResult('produtos', 'SELECT', !prdSelErr, '', prdSelErr);

      const { error: prdUpErr } = await supabase.from('produtos').update({ valor_mao_de_obra: 20.00 }).eq('id', produtoId);
      logResult('produtos', 'UPDATE', !prdUpErr, '', prdUpErr);
    }

    // 9. TABELA: ficha_tecnica_produto
    console.log("\n--- 9. Testando Tabela 'ficha_tecnica_produto' ---");
    if (produtoId && filamentoId) {
      const { data: ftpData, error: ftpErr } = await supabase
        .from('ficha_tecnica_produto')
        .insert([{
          empresa_id: empresaId,
          produto_id: produtoId,
          tipo_filamento: 'PLA',
          filamento_padrao_id: filamentoId,
          quantidade_gramas: 180.50
        }])
        .select()
        .single();

      if (ftpErr) {
        logResult('ficha_tecnica_produto', 'INSERT', false, '', ftpErr);
      } else {
        const ftpId = ftpData.id;
        cleanupTasks.push(async () => supabase.from('ficha_tecnica_produto').delete().eq('id', ftpId));
        logResult('ficha_tecnica_produto', 'INSERT', true, `ID: ${ftpId}`);

        const { data: ftpSel, error: ftpSelErr } = await supabase.from('ficha_tecnica_produto').select('*').eq('id', ftpId).single();
        logResult('ficha_tecnica_produto', 'SELECT', !ftpSelErr, '', ftpSelErr);

        const { error: ftpUpErr } = await supabase.from('ficha_tecnica_produto').update({ quantidade_gramas: 190.00 }).eq('id', ftpId);
        logResult('ficha_tecnica_produto', 'UPDATE', !ftpUpErr, '', ftpUpErr);
      }
    } else {
      logResult('ficha_tecnica_produto', 'INSERT', false, 'Ignorado pois produtoId ou filamentoId não foram criados');
    }

    // 10. TABELA: estoque_produto
    console.log("\n--- 10. Testando Tabela 'estoque_produto' ---");
    if (produtoId) {
      // O produto ao ser inserido executa a trigger 'proc_inicializa_estoque_produto' que cria a linha em estoque_produto
      const { data: estSel, error: estSelErr } = await supabase
        .from('estoque_produto')
        .select('*')
        .eq('produto_id', produtoId)
        .maybeSingle();

      if (estSelErr) {
        logResult('estoque_produto', 'SELECT', false, '', estSelErr);
      } else if (!estSel) {
        // Tenta insert manual caso o gatilho não tenha sido executado
        const { data: estInsData, error: estInsErr } = await supabase
          .from('estoque_produto')
          .insert([{ produto_id: produtoId, empresa_id: empresaId, quantidade_disponivel: 10 }])
          .select()
          .single();
        logResult('estoque_produto', 'INSERT Manual', !estInsErr, '', estInsErr);
      } else {
        logResult('estoque_produto', 'SELECT (Criado via Trigger)', true, `Qtd: ${estSel.quantidade_disponivel}`);

        const { error: estUpErr } = await supabase
          .from('estoque_produto')
          .update({ quantidade_disponivel: 15 })
          .eq('produto_id', produtoId);
        logResult('estoque_produto', 'UPDATE', !estUpErr, '', estUpErr);
      }
    } else {
      logResult('estoque_produto', 'TEST', false, 'Ignorado pois produtoId não foi criado');
    }

    // 11. TABELA: orcamentos
    console.log("\n--- 11. Testando Tabela 'orcamentos' ---");
    if (clienteId) {
      const numOrc = `ORC-${Date.now().toString().slice(-6)}`;
      const { data: orcData, error: orcErr } = await supabase
        .from('orcamentos')
        .insert([{
          empresa_id: empresaId,
          numero: numOrc,
          cliente_id: clienteId,
          data_emissao: '2026-01-01',
          validade: '2026-01-15',
          desconto_geral: 10.00,
          observacoes: 'Orçamento teste',
          status: 'Aberto'
        }])
        .select()
        .single();

      if (orcErr) {
        logResult('orcamentos', 'INSERT', false, '', orcErr);
      } else {
        orcamentoId = orcData.id;
        cleanupTasks.push(async () => supabase.from('orcamentos').delete().eq('id', orcamentoId));
        logResult('orcamentos', 'INSERT', true, `ID: ${orcamentoId}`);

        const { data: orcSel, error: orcSelErr } = await supabase.from('orcamentos').select('*').eq('id', orcamentoId).single();
        logResult('orcamentos', 'SELECT', !orcSelErr, '', orcSelErr);

        const { error: orcUpErr } = await supabase.from('orcamentos').update({ status: 'Enviado' }).eq('id', orcamentoId);
        logResult('orcamentos', 'UPDATE', !orcUpErr, '', orcUpErr);
      }
    } else {
      logResult('orcamentos', 'INSERT', false, 'Ignorado pois clienteId não foi criado');
    }

    // 12. TABELA: orcamento_itens
    console.log("\n--- 12. Testando Tabela 'orcamento_itens' ---");
    if (orcamentoId && produtoId) {
      const { data: oriData, error: oriErr } = await supabase
        .from('orcamento_itens')
        .insert([{
          empresa_id: empresaId,
          orcamento_id: orcamentoId,
          produto_id: produtoId,
          quantidade: 2,
          valor_unitario: 80.00,
          desconto: 5.00
        }])
        .select()
        .single();

      if (oriErr) {
        logResult('orcamento_itens', 'INSERT', false, '', oriErr);
      } else {
        const oriId = oriData.id;
        cleanupTasks.push(async () => supabase.from('orcamento_itens').delete().eq('id', oriId));
        logResult('orcamento_itens', 'INSERT', true, `ID: ${oriId}`);

        const { data: oriSel, error: oriSelErr } = await supabase.from('orcamento_itens').select('*').eq('id', oriId).single();
        logResult('orcamento_itens', 'SELECT', !oriSelErr, '', oriSelErr);

        const { error: oriUpErr } = await supabase.from('orcamento_itens').update({ quantidade: 3 }).eq('id', oriId);
        logResult('orcamento_itens', 'UPDATE', !oriUpErr, '', oriUpErr);
      }
    } else {
      logResult('orcamento_itens', 'INSERT', false, 'Ignorado pois orcamentoId ou produtoId não foram criados');
    }

    // 13. TABELA: vendas
    console.log("\n--- 13. Testando Tabela 'vendas' ---");
    if (clienteId) {
      const { data: vndData, error: vndErr } = await supabase
        .from('vendas')
        .insert([{
          empresa_id: empresaId,
          cliente_id: clienteId,
          data: '2026-01-05',
          valor_total: 160.00,
          forma_pagamento: 'Pix',
          status: 'Pago',
          orcamento_origem_id: orcamentoId
        }])
        .select()
        .single();

      if (vndErr) {
        logResult('vendas', 'INSERT', false, '', vndErr);
      } else {
        vendaId = vndData.id;
        cleanupTasks.push(async () => supabase.from('vendas').delete().eq('id', vendaId));
        logResult('vendas', 'INSERT', true, `ID: ${vendaId}`);

        const { data: vndSel, error: vndSelErr } = await supabase.from('vendas').select('*').eq('id', vendaId).single();
        logResult('vendas', 'SELECT', !vndSelErr, '', vndSelErr);

        const { error: vndUpErr } = await supabase.from('vendas').update({ status: 'Pago' }).eq('id', vendaId);
        logResult('vendas', 'UPDATE', !vndUpErr, '', vndUpErr);
      }
    } else {
      logResult('vendas', 'INSERT', false, 'Ignorado pois clienteId não foi criado');
    }

    // 14. TABELA: venda_itens
    console.log("\n--- 14. Testando Tabela 'venda_itens' ---");
    if (vendaId && produtoId) {
      const { data: vniData, error: vniErr } = await supabase
        .from('venda_itens')
        .insert([{
          empresa_id: empresaId,
          venda_id: vendaId,
          produto_id: produtoId,
          quantidade: 2,
          valor_unitario: 80.00
        }])
        .select()
        .single();

      if (vniErr) {
        logResult('venda_itens', 'INSERT', false, '', vniErr);
      } else {
        const vniId = vniData.id;
        cleanupTasks.push(async () => supabase.from('venda_itens').delete().eq('id', vniId));
        logResult('venda_itens', 'INSERT', true, `ID: ${vniId}`);

        const { data: vniSel, error: vniSelErr } = await supabase.from('venda_itens').select('*').eq('id', vniId).single();
        logResult('venda_itens', 'SELECT', !vniSelErr, '', vniSelErr);

        const { error: vniUpErr } = await supabase.from('venda_itens').update({ quantidade: 3 }).eq('id', vniId);
        logResult('venda_itens', 'UPDATE', !vniUpErr, '', vniUpErr);
      }
    } else {
      logResult('venda_itens', 'INSERT', false, 'Ignorado pois vendaId ou produtoId não foram criados');
    }

    // 15. TABELA: producoes
    console.log("\n--- 15. Testando Tabela 'producoes' ---");
    if (produtoId && impressoraId) {
      const numProd = `ORD-${Date.now().toString().slice(-6)}`;
      const { data: prcData, error: prcErr } = await supabase
        .from('producoes')
        .insert([{
          empresa_id: empresaId,
          numero: numProd,
          data: '2026-01-06',
          produto_id: produtoId,
          quantidade: 3,
          impressora_id: impressoraId,
          operador: 'Operador Teste',
          status: 'Em Produção',
          custo_filamento: 15.00,
          custo_energia: 3.50,
          custo_mao_de_obra: 10.00,
          custo_total: 28.50,
          custo_unitario: 9.50,
          mao_de_obra_escolha: 'unitario',
          mao_de_obra_valor: 10.00,
          observacoes: 'Ordem de produção teste'
        }])
        .select()
        .single();

      if (prcErr) {
        logResult('producoes', 'INSERT', false, '', prcErr);
      } else {
        const producaoId = prcData.id;
        cleanupTasks.push(async () => supabase.from('producoes').delete().eq('id', producaoId));
        logResult('producoes', 'INSERT', true, `ID: ${producaoId}`);

        const { data: prcSel, error: prcSelErr } = await supabase.from('producoes').select('*').eq('id', producaoId).single();
        logResult('producoes', 'SELECT', !prcSelErr, '', prcSelErr);

        const { error: prcUpErr } = await supabase.from('producoes').update({ status: 'Finalizada' }).eq('id', producaoId);
        logResult('producoes', 'UPDATE', !prcUpErr, '', prcUpErr);
      }
    } else {
      logResult('producoes', 'INSERT', false, 'Ignorado pois produtoId ou impressoraId não foram criados');
    }

    // 16. TABELA: movimentacao_estoque
    console.log("\n--- 16. Testando Tabela 'movimentacao_estoque' ---");
    const { data: movData, error: movErr } = await supabase
      .from('movimentacao_estoque')
      .insert([{
        empresa_id: empresaId,
        tipo: 'entrada',
        origem: 'ajuste',
        referencia_id: empresaId,
        filamento_id: filamentoId,
        produto_id: produtoId,
        quantidade: 5,
        descricao: 'Movimentação de ajuste teste'
      }])
      .select()
      .single();

    if (movErr) {
      logResult('movimentacao_estoque', 'INSERT', false, '', movErr);
    } else {
      const movId = movData.id;
      cleanupTasks.push(async () => supabase.from('movimentacao_estoque').delete().eq('id', movId));
      logResult('movimentacao_estoque', 'INSERT', true, `ID: ${movId}`);

      const { data: movSel, error: movSelErr } = await supabase.from('movimentacao_estoque').select('*').eq('id', movId).single();
      logResult('movimentacao_estoque', 'SELECT', !movSelErr, '', movSelErr);

      const { error: movUpErr } = await supabase.from('movimentacao_estoque').update({ descricao: 'Descrição Atualizada' }).eq('id', movId);
      logResult('movimentacao_estoque', 'UPDATE', !movUpErr, '', movUpErr);
    }

    // 17. TABELA: backup_historico
    console.log("\n--- 17. Testando Tabela 'backup_historico' ---");
    const { data: bakData, error: bakErr } = await supabase
      .from('backup_historico')
      .insert([{
        empresa_id: empresaId,
        nome: `backup_test_${Date.now()}.json`,
        data: '2026-01-07',
        hora: '14:30:00',
        usuario: 'admin@elmaneko.com',
        tipo: 'Manual',
        tamanho: '2.5 MB',
        status: 'Sucesso',
        modulos: ['produtos', 'clientes', 'vendas']
      }])
      .select()
      .single();

    if (bakErr) {
      logResult('backup_historico', 'INSERT', false, '', bakErr);
    } else {
      backupId = bakData.id;
      cleanupTasks.push(async () => supabase.from('backup_historico').delete().eq('id', backupId));
      logResult('backup_historico', 'INSERT', true, `ID: ${backupId}`);

      const { data: bakSel, error: bakSelErr } = await supabase.from('backup_historico').select('*').eq('id', backupId).single();
      logResult('backup_historico', 'SELECT', !bakSelErr, '', bakSelErr);

      const { error: bakUpErr } = await supabase.from('backup_historico').update({ tamanho: '3.0 MB' }).eq('id', backupId);
      logResult('backup_historico', 'UPDATE', !bakUpErr, '', bakUpErr);
    }

    // 18. TABELA: restore_historico
    console.log("\n--- 18. Testando Tabela 'restore_historico' ---");
    const { data: resData, error: resErr } = await supabase
      .from('restore_historico')
      .insert([{
        empresa_id: empresaId,
        backup_id: backupId,
        usuario: 'admin@elmaneko.com',
        tipo: 'Manual',
        resultado: 'Sucesso',
        detalhes: 'Restauração realizada com sucesso no teste'
      }])
      .select()
      .single();

    if (resErr) {
      logResult('restore_historico', 'INSERT', false, '', resErr);
    } else {
      const restoreId = resData.id;
      cleanupTasks.push(async () => supabase.from('restore_historico').delete().eq('id', restoreId));
      logResult('restore_historico', 'INSERT', true, `ID: ${restoreId}`);

      const { data: resSel, error: resSelErr } = await supabase.from('restore_historico').select('*').eq('id', restoreId).single();
      logResult('restore_historico', 'SELECT', !resSelErr, '', resSelErr);

      const { error: resUpErr } = await supabase.from('restore_historico').update({ detalhes: 'Detalhes alterados' }).eq('id', restoreId);
      logResult('restore_historico', 'UPDATE', !resUpErr, '', resUpErr);
    }

  } catch (err) {
    console.error("❌ Exceção não tratada durante o teste de persistência:", err);
  } finally {
    console.log("\n🧹 Limpando dados de teste criados no banco...");
    for (const task of cleanupTasks.reverse()) {
      try {
        await task();
      } catch (cleanErr) {
        console.error("Erro ao limpar elemento:", cleanErr);
      }
    }
    console.log("✨ Limpeza concluída!");
  }

  // EXIBIR RESUMO DAS TABELAS
  console.log("\n==========================================================================");
  console.log("📊 RESUMO FINAL DA PERSISTÊNCIA DAS TABELAS");
  console.log("==========================================================================");
  
  const tablesTested = [...new Set(results.map(r => r.tabela))];
  const passedOps = results.filter(r => r.status === '✅ PASS').length;
  const failedOps = results.filter(r => r.status === '❌ FAIL').length;

  console.table(results);

  console.log(`\nTotal de Operações Testadas: ${results.length}`);
  console.log(`✅ Sucessos: ${passedOps}`);
  console.log(`❌ Falhas: ${failedOps}`);
  console.log(`📋 Total de Tabelas Únicas Avaliadas: ${tablesTested.length}`);

  if (failedOps === 0) {
    console.log("\n🎉 PARABÉNS! A persistência de TODAS as tabelas está funcionando perfeitamente!");
  } else {
    console.log("\n⚠️ ATENÇÃO: Foram encontradas falhas em algumas tabelas. Verifique a tabela acima.");
  }
}

runPersistenceTest();
