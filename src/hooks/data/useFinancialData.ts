import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { 
  FinancialAccount, FinancialCategory, CostCenter, FinancialEntry, 
  FinancialMovement, FinancialTransfer, FinancialAuditLog
} from '../../types';
import { 
  getLocalCache, setLocalCache, addToLocalCache, removeFromLocalCache, isValidUuid, getActiveTenantId
} from '../../utils/storage';

// 1. CONTAS FINANCEIRAS
export function useContasFinanceiras() {
  return useQuery({
    queryKey: ['contas_financeiras'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contas_financeiras').select('*').eq('empresa_id', getActiveTenantId()).order('created_at', { ascending: false });
      if (error || !data) return getLocalCache<FinancialAccount>('contas_financeiras');

      const mapped: FinancialAccount[] = data.map(item => ({
        id: item.id,
        nome: item.nome,
        tipo: item.tipo as FinancialAccount['tipo'],
        banco: item.banco || '',
        agencia: item.agencia || '',
        conta: item.conta || '',
        digito: item.digito || '',
        bandeira: item.bandeira || '',
        limite: Number(item.limite || 0),
        limiteDisponivel: Number(item.limite_disponivel || 0),
        diaFechamento: item.dia_fechamento,
        diaVencimento: item.dia_vencimento,
        saldoInicial: Number(item.saldo_inicial || 0),
        saldoAtual: Number(item.saldo_atual || 0),
        situacao: item.situacao as FinancialAccount['situacao'],
        observacoes: item.observacoes || ''
      }));

      setLocalCache('contas_financeiras', mapped);
      return mapped;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddContaFinanceira() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nova: Omit<FinancialAccount, 'id'>) => {
      const empresaId = getActiveTenantId();
      const payload = {
        empresa_id: empresaId,
        nome: nova.nome,
        tipo: nova.tipo,
        banco: nova.banco,
        agencia: nova.agencia,
        conta: nova.conta,
        digito: nova.digito,
        bandeira: nova.bandeira,
        limite: nova.limite,
        limite_disponivel: nova.limiteDisponivel,
        dia_fechamento: nova.diaFechamento,
        dia_vencimento: nova.diaVencimento,
        saldo_inicial: nova.saldoInicial,
        saldo_atual: nova.saldoAtual,
        situacao: nova.situacao,
        observacoes: nova.observacoes
      };

      const { data, error } = await supabase.from('contas_financeiras').insert([payload]).select().single();
      if (error) {
        const offlineItem: FinancialAccount = { ...nova, id: crypto.randomUUID() };
        addToLocalCache('contas_financeiras', offlineItem);
        return offlineItem;
      }

      const created: FinancialAccount = {
        id: data.id,
        nome: data.nome,
        tipo: data.tipo,
        banco: data.banco,
        agencia: data.agencia,
        conta: data.conta,
        digito: data.digito,
        bandeira: data.bandeira,
        limite: Number(data.limite),
        limiteDisponivel: Number(data.limite_disponivel),
        diaFechamento: data.dia_fechamento,
        diaVencimento: data.dia_vencimento,
        saldoInicial: Number(data.saldo_inicial),
        saldoAtual: Number(data.saldo_atual),
        situacao: data.situacao,
        observacoes: data.observacoes
      };

      addToLocalCache('contas_financeiras', created);
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contas_financeiras'] }),
  });
}

export function useUpdateContaFinanceira() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (conta: FinancialAccount) => {
      const payload = {
        nome: conta.nome,
        tipo: conta.tipo,
        banco: conta.banco,
        agencia: conta.agencia,
        conta: conta.conta,
        digito: conta.digito,
        bandeira: conta.bandeira,
        limite: conta.limite,
        limite_disponivel: conta.limiteDisponivel,
        dia_fechamento: conta.diaFechamento,
        dia_vencimento: conta.diaVencimento,
        saldo_inicial: conta.saldoInicial,
        saldo_atual: conta.saldoAtual,
        situacao: conta.situacao,
        observacoes: conta.observacoes
      };

      if (isValidUuid(conta.id)) {
        await supabase.from('contas_financeiras').update(payload).eq('id', conta.id);
      }

      addToLocalCache('contas_financeiras', conta);
      return conta;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contas_financeiras'] }),
  });
}

export function useDeleteContaFinanceira() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isValidUuid(id)) {
        await supabase.from('contas_financeiras').delete().eq('id', id);
      }
      removeFromLocalCache('contas_financeiras', id);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contas_financeiras'] }),
  });
}

// 2. CATEGORIAS FINANCEIRAS
export function useCategoriasFinanceiras() {
  return useQuery({
    queryKey: ['categorias_financeiras'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categorias_financeiras').select('*').eq('empresa_id', getActiveTenantId()).order('created_at', { ascending: false });
      if (error || !data) return getLocalCache<FinancialCategory>('categorias_financeiras');

      const mapped: FinancialCategory[] = data.map(item => ({
        id: item.id,
        nome: item.nome,
        tipo: item.tipo as FinancialCategory['tipo'],
        categoriaPaiId: item.categoria_pai_id,
        descricao: item.descricao || ''
      }));

      setLocalCache('categorias_financeiras', mapped);
      return mapped;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddCategoriaFinanceira() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nova: Omit<FinancialCategory, 'id'>) => {
      const empresaId = getActiveTenantId();
      const payload = {
        empresa_id: empresaId,
        nome: nova.nome,
        tipo: nova.tipo,
        categoria_pai_id: isValidUuid(nova.categoriaPaiId) ? nova.categoriaPaiId : null,
        descricao: nova.descricao
      };

      const { data, error } = await supabase.from('categorias_financeiras').insert([payload]).select().single();
      if (error) {
        const offlineItem: FinancialCategory = { ...nova, id: crypto.randomUUID() };
        addToLocalCache('categorias_financeiras', offlineItem);
        return offlineItem;
      }

      const created: FinancialCategory = {
        id: data.id,
        nome: data.nome,
        tipo: data.tipo,
        categoriaPaiId: data.categoria_pai_id,
        descricao: data.descricao
      };

      addToLocalCache('categorias_financeiras', created);
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias_financeiras'] }),
  });
}

export function useUpdateCategoriaFinanceira() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cat: FinancialCategory) => {
      const payload = {
        nome: cat.nome,
        tipo: cat.tipo,
        categoria_pai_id: isValidUuid(cat.categoriaPaiId) ? cat.categoriaPaiId : null,
        descricao: cat.descricao
      };

      if (isValidUuid(cat.id)) {
        await supabase.from('categorias_financeiras').update(payload).eq('id', cat.id);
      }

      addToLocalCache('categorias_financeiras', cat);
      return cat;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias_financeiras'] }),
  });
}

export function useDeleteCategoriaFinanceira() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isValidUuid(id)) {
        await supabase.from('categorias_financeiras').delete().eq('id', id);
      }
      removeFromLocalCache('categorias_financeiras', id);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias_financeiras'] }),
  });
}

// 3. CENTROS DE CUSTO
export function useCentrosCusto() {
  return useQuery({
    queryKey: ['centros_custo'],
    queryFn: async () => {
      const { data, error } = await supabase.from('centros_custo').select('*').eq('empresa_id', getActiveTenantId()).order('created_at', { ascending: false });
      if (error || !data) return getLocalCache<CostCenter>('centros_custo');

      const mapped: CostCenter[] = data.map(item => ({
        id: item.id,
        codigo: item.codigo,
        nome: item.nome,
        descricao: item.descricao || ''
      }));

      setLocalCache('centros_custo', mapped);
      return mapped;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddCentroCusto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (novo: Omit<CostCenter, 'id'>) => {
      const empresaId = getActiveTenantId();
      const payload = {
        empresa_id: empresaId,
        codigo: novo.codigo,
        nome: novo.nome,
        descricao: novo.descricao
      };

      const { data, error } = await supabase.from('centros_custo').insert([payload]).select().single();
      if (error) {
        const offlineItem: CostCenter = { ...novo, id: crypto.randomUUID() };
        addToLocalCache('centros_custo', offlineItem);
        return offlineItem;
      }

      const created: CostCenter = {
        id: data.id,
        codigo: data.codigo,
        nome: data.nome,
        descricao: data.descricao
      };

      addToLocalCache('centros_custo', created);
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['centros_custo'] }),
  });
}

export function useUpdateCentroCusto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cc: CostCenter) => {
      const payload = {
        codigo: cc.codigo,
        nome: cc.nome,
        descricao: cc.descricao
      };

      if (isValidUuid(cc.id)) {
        await supabase.from('centros_custo').update(payload).eq('id', cc.id);
      }

      addToLocalCache('centros_custo', cc);
      return cc;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['centros_custo'] }),
  });
}

export function useDeleteCentroCusto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isValidUuid(id)) {
        await supabase.from('centros_custo').delete().eq('id', id);
      }
      removeFromLocalCache('centros_custo', id);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['centros_custo'] }),
  });
}

// 4. LANÇAMENTOS FINANCEIROS
export function useLancamentosFinanceiros() {
  return useQuery({
    queryKey: ['lancamentos_financeiros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lancamentos_financeiros')
        .select('*')
        .eq('empresa_id', getActiveTenantId())
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error || !data) return getLocalCache<FinancialEntry>('lancamentos_financeiros');

      const mapped: FinancialEntry[] = data.map(item => ({
        id: item.id,
        numeroDocumento: item.numero_documento,
        tipo: item.tipo as FinancialEntry['tipo'],
        origem: item.origem as FinancialEntry['origem'],
        origemId: item.origem_id,
        clienteId: item.cliente_id,
        fornecedor: item.fornecedor || '',
        dataEmissao: item.data_emissao,
        dataVencimento: item.data_vencimento,
        dataLiquidacao: item.data_liquidacao,
        valorBruto: Number(item.valor_bruto || 0),
        desconto: Number(item.desconto || 0),
        acrescimo: Number(item.acrescimo || 0),
        valorLiquido: Number(item.valor_liquido || 0),
        valorPago: Number(item.valor_pago || 0),
        jurosMulta: Number(item.juros_multa || 0),
        formaPagamento: item.forma_pagamento || 'PIX',
        contaFinanceiraId: item.conta_financeira_id,
        categoriaId: item.categoria_id,
        centroCustoId: item.centro_custo_id,
        parcelaAtual: item.parcela_atual || 1,
        totalParcelas: item.total_parcelas || 1,
        parcelaPaiId: item.parcela_pai_id,
        status: item.status as FinancialEntry['status'],
        conciliado: !!item.conciliado,
        tipoConciliacao: item.tipo_conciliacao,
        observacoes: item.observacoes || '',
        isDeleted: !!item.is_deleted
      }));

      setLocalCache('lancamentos_financeiros', mapped);
      return mapped;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddLancamentoFinanceiro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (novo: Omit<FinancialEntry, 'id'>) => {
      const empresaId = getActiveTenantId();
      const payload = {
        empresa_id: empresaId,
        numero_documento: novo.numeroDocumento,
        tipo: novo.tipo,
        origem: novo.origem,
        origem_id: isValidUuid(novo.origemId) ? novo.origemId : null,
        cliente_id: isValidUuid(novo.clienteId) ? novo.clienteId : null,
        fornecedor: novo.fornecedor,
        data_emissao: novo.dataEmissao,
        data_vencimento: novo.dataVencimento,
        valor_bruto: novo.valorBruto,
        desconto: novo.desconto,
        acrescimo: novo.acrescimo,
        valor_liquido: novo.valorLiquido,
        forma_pagamento: novo.formaPagamento,
        conta_financeira_id: isValidUuid(novo.contaFinanceiraId) ? novo.contaFinanceiraId : null,
        categoria_id: isValidUuid(novo.categoriaId) ? novo.categoriaId : null,
        centro_custo_id: isValidUuid(novo.centroCustoId) ? novo.centroCustoId : null,
        parcela_atual: novo.parcelaAtual,
        total_parcelas: novo.totalParcelas,
        status: novo.status,
        observacoes: novo.observacoes
      };

      const { data, error } = await supabase.from('lancamentos_financeiros').insert([payload]).select().single();
      if (error) {
        const offlineItem: FinancialEntry = { ...novo, id: crypto.randomUUID() };
        addToLocalCache('lancamentos_financeiros', offlineItem);
        return offlineItem;
      }

      const created: FinancialEntry = {
        ...novo,
        id: data.id
      };

      addToLocalCache('lancamentos_financeiros', created);
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros'] }),
  });
}

export function useLiquidarLancamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contaFinanceiraId, dataLiquidacao, valorPago }: {
      id: string;
      contaFinanceiraId: string;
      dataLiquidacao: string;
      valorPago: number;
      jurosMulta?: number;
    }) => {
      if (isValidUuid(id)) {
        // Executa obrigatoriamente a RPC atômica no banco de dados
        const { error: rpcError } = await supabase.rpc('liquidar_lancamento_financeiro', {
          p_lancamento_id: id,
          p_conta_id: contaFinanceiraId,
          p_valor_pago: valorPago,
          p_data_liquidacao: dataLiquidacao
        });

        if (rpcError) {
          console.error("RPC liquidar_lancamento_financeiro falhou:", rpcError.message);
          throw rpcError;
        }
      }
      return { id, valorPago };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros'] });
      queryClient.invalidateQueries({ queryKey: ['contas_financeiras'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes_financeiras'] });
    },
  });
}

export function useCancelLancamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const empresaId = getActiveTenantId();
      if (isValidUuid(id)) {
        await supabase.from('lancamentos_financeiros').update({ status: 'Cancelado' }).eq('id', id).eq('empresa_id', empresaId);
      }
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros'] }),
  });
}

export function useConciliateLancamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tipoConciliacao }: { id: string; tipoConciliacao: string }) => {
      if (isValidUuid(id)) {
        const { error } = await supabase.from('lancamentos_financeiros').update({
          status: 'Conciliado', conciliado: true, tipo_conciliacao: tipoConciliacao,
        }).eq('id', id);
        if (error) throw error;
      }
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros'] }),
  });
}

export function useDeleteLancamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isValidUuid(id)) {
        await supabase.from('lancamentos_financeiros').update({ is_deleted: true }).eq('id', id);
      }
      removeFromLocalCache('lancamentos_financeiros', id);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros'] }),
  });
}

// 5. MOVIMENTAÇÕES FINANCEIRAS
export function useMovimentacoesFinanceiras() {
  return useQuery({
    queryKey: ['movimentacoes_financeiras'],
    queryFn: async () => {
      const { data, error } = await supabase.from('movimentacoes_financeiras').select('*').eq('empresa_id', getActiveTenantId()).order('created_at', { ascending: false });
      if (error || !data) return getLocalCache<FinancialMovement>('movimentacoes_financeiras');

      const mapped: FinancialMovement[] = data.map(item => ({
        id: item.id,
        contaFinanceiraId: item.conta_financeira_id,
        lancamentoId: item.lancamento_id,
        data: item.data,
        tipo: item.tipo as FinancialMovement['tipo'],
        valor: Number(item.valor),
        saldoAnterior: Number(item.saldo_anterior || 0),
        saldoPosterior: Number(item.saldo_posterior || 0),
        descricao: item.descricao
      }));

      setLocalCache('movimentacoes_financeiras', mapped);
      return mapped;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// 6. TRANSFERÊNCIAS FINANCEIRAS
export function useTransferenciasFinanceiras() {
  return useQuery({
    queryKey: ['transferencias_financeiras'],
    queryFn: async () => {
      const { data, error } = await supabase.from('transferencias_financeiras').select('*').eq('empresa_id', getActiveTenantId()).order('created_at', { ascending: false });
      if (error || !data) return getLocalCache<FinancialTransfer>('transferencias_financeiras');

      const mapped: FinancialTransfer[] = data.map(item => ({
        id: item.id,
        data: item.data,
        contaOrigemId: item.conta_origem_id,
        contaDestinoId: item.conta_destino_id,
        valor: Number(item.valor),
        observacoes: item.observacoes || ''
      }));

      setLocalCache('transferencias_financeiras', mapped);
      return mapped;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddTransferenciaFinanceira() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nova: Omit<FinancialTransfer, 'id'>) => {
      // Executa obrigatoriamente a RPC atômica no banco de dados
      const { data: rpcRes, error: rpcError } = await supabase.rpc('transferir_saldo_financeiro', {
        p_conta_origem_id: nova.contaOrigemId,
        p_conta_destino_id: nova.contaDestinoId,
        p_valor: nova.valor,
        p_data: nova.data,
        p_observacoes: nova.observacoes
      });

      if (rpcError) {
        console.error("RPC transferir_saldo_financeiro falhou:", rpcError.message);
        throw rpcError;
      }

      const created: FinancialTransfer = {
        id: rpcRes.transferencia_id,
        data: nova.data,
        contaOrigemId: nova.contaOrigemId,
        contaDestinoId: nova.contaDestinoId,
        valor: nova.valor,
        observacoes: nova.observacoes
      };
      addToLocalCache('transferencias_financeiras', created);
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias_financeiras'] });
      queryClient.invalidateQueries({ queryKey: ['contas_financeiras'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes_financeiras'] });
    },
  });
}

// 7. AUDITORIA FINANCEIRA
export function useAuditoriaFinanceira() {
  return useQuery({
    queryKey: ['auditoria_financeira'],
    queryFn: async () => {
      const { data, error } = await supabase.from('auditoria_financeira').select('*').eq('empresa_id', getActiveTenantId()).order('data_hora', { ascending: false });
      if (error || !data) return getLocalCache<FinancialAuditLog>('auditoria_financeira');

      const mapped: FinancialAuditLog[] = data.map(item => ({
        id: item.id,
        dataHora: item.data_hora,
        usuario: item.usuario,
        ip: item.ip || '',
        operacao: item.operacao,
        entidade: item.entidade,
        entidadeId: item.entidade_id,
        valorAnterior: item.valor_anterior,
        valorNovo: item.valor_novo
      }));

      setLocalCache('auditoria_financeira', mapped);
      return mapped;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddAuditLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: Omit<FinancialAuditLog, 'id'> & { id?: string }) => {
      const empresaId = getActiveTenantId();
      const { data, error } = await supabase.from('auditoria_financeira').insert([{
        empresa_id: empresaId,
        data_hora: log.dataHora,
        usuario: log.usuario,
        ip: log.ip,
        operacao: log.operacao,
        entidade: log.entidade,
        entidade_id: log.entidadeId,
        valor_anterior: log.valorAnterior,
        valor_novo: log.valorNovo,
      }]).select().single();
      if (error) throw error;
      const created: FinancialAuditLog = { ...log, id: data.id };
      addToLocalCache('auditoria_financeira', created);
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auditoria_financeira'] }),
  });
}

// 8. RETROACTIVE FINANCIAL SYNC
export function useSyncFinancialEntries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const empresaId = getActiveTenantId();
      
      try {
        const { data: vendas, error: errVendas } = await supabase.from('vendas').select('*').eq('empresa_id', empresaId);
        const { data: compras, error: errCompras } = await supabase.from('compras').select('*').eq('empresa_id', empresaId);
        const { data: lancamentos } = await supabase.from('lancamentos_financeiros').select('origem_id').eq('empresa_id', empresaId);

        const existingOrigemIds = new Set((lancamentos || []).map(l => l.origem_id));

        const newEntries: any[] = [];
        const nowStr = new Date().toISOString().split('T')[0];

        if (!errVendas && vendas && Array.isArray(vendas)) {
          vendas.forEach(venda => {
            if (venda && venda.id && !existingOrigemIds.has(venda.id)) {
              const vendaData = (venda.data && typeof venda.data === 'string') ? venda.data : nowStr;
              const shortId = String(venda.id).slice(0, 8);
              newEntries.push({
                empresa_id: empresaId,
                numero_documento: `VENDA-${shortId}`,
                tipo: 'Receita',
                origem: 'Venda',
                origem_id: venda.id,
                cliente_id: venda.cliente_id || null,
                data_emissao: vendaData,
                data_vencimento: vendaData,
                valor_bruto: Number(venda.valor_total || 0),
                valor_liquido: Number(venda.valor_total || 0),
                forma_pagamento: venda.forma_pagamento || 'PIX',
                status: 'Aberto',
                conciliado: false,
                observacoes: 'Faturamento retroativo importado automaticamente de Vendas'
              });
            }
          });
        }

        if (!errCompras && compras && Array.isArray(compras)) {
          compras.forEach(compra => {
            if (compra && compra.id && !existingOrigemIds.has(compra.id)) {
              const compraData = (compra.data && typeof compra.data === 'string') ? compra.data : nowStr;
              const shortId = String(compra.id).slice(0, 8);
              const docNum = (compra.nota_fiscal && String(compra.nota_fiscal).trim() !== '') 
                ? `NF-${compra.nota_fiscal}` 
                : `COMP-${shortId}`;

              newEntries.push({
                empresa_id: empresaId,
                numero_documento: docNum,
                tipo: 'Despesa',
                origem: 'Compra',
                origem_id: compra.id,
                fornecedor: compra.fornecedor || 'Fornecedor Diversos',
                data_emissao: compraData,
                data_vencimento: compraData,
                valor_bruto: Number(compra.valor_pago || 0),
                valor_liquido: Number(compra.valor_pago || 0),
                forma_pagamento: 'PIX',
                status: 'Aberto',
                conciliado: false,
                observacoes: 'Despesa retroativa importada automaticamente de Compras'
              });
            }
          });
        }

        if (newEntries.length > 0) {
          await supabase.from('lancamentos_financeiros').insert(newEntries);
        }

        return { total: newEntries.length, syncedSales: newEntries.filter(entry => entry.origem === 'Venda').length, syncedPurchases: newEntries.filter(entry => entry.origem === 'Compra').length };
      } catch (e) {
        console.error("Erro na sincronização financeira retroativa:", e);
        return { total: 0, syncedSales: 0, syncedPurchases: 0 };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros'] });
    },
  });
}
