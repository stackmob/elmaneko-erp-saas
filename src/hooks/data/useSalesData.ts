import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Client, Budget, Sale } from '../../types';
import { 
  setLocalCache, addToLocalCache, removeFromLocalCache, isValidUuid, getActiveTenantId, getTenantQueryKey
} from '../../utils/storage';
import { enqueueOfflineOperation, isNetworkFailure } from '../../utils/offlineQueue';

// 1. CLIENTES (CRM)
export function useClientes() {
  return useQuery({
    queryKey: getTenantQueryKey('clientes'),
    queryFn: async () => {
      const { data, error } = await supabase.from('clientes').select('*').eq('empresa_id', getActiveTenantId()).order('created_at', { ascending: false });
      if (error) throw error;
      if (!data) return [];

      const mapped: Client[] = data.map(item => ({
        id: item.id,
        nome: item.nome,
        cpfCnpj: item.cpf_cnpj || '',
        telefone: item.telefone || '',
        whatsapp: item.whatsapp || '',
        email: item.email || '',
        endereco: item.endereco || '',
        observacoes: item.observacoes || ''
      }));

      setLocalCache('clientes', mapped);
      return mapped;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (novo: Omit<Client, 'id'> & { id?: string }) => {
      const empresaId = getActiveTenantId();
      const payload = {
        empresa_id: empresaId,
        nome: novo.nome,
        cpf_cnpj: novo.cpfCnpj || null,
        telefone: novo.telefone || novo.whatsapp || null,
        whatsapp: novo.whatsapp,
        email: novo.email || null,
        endereco: novo.endereco || null,
        observacoes: novo.observacoes || null
      };

      const { data, error } = await supabase.from('clientes').insert([payload]).select().single();
      if (error) {
        if (!isNetworkFailure(error)) throw error;
        const offlineItem: Client = { ...novo, id: novo.id || crypto.randomUUID() };
        addToLocalCache('clientes', offlineItem);
        return offlineItem;
      }

      const created: Client = {
        id: data.id,
        nome: data.nome,
        cpfCnpj: data.cpf_cnpj || '',
        telefone: data.telefone || '',
        whatsapp: data.whatsapp || '',
        email: data.email || '',
        endereco: data.endereco || '',
        observacoes: data.observacoes || ''
      };

      addToLocalCache('clientes', created);
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cliente: Client) => {
      const empresaId = getActiveTenantId();
      const payload = {
        nome: cliente.nome,
        cpf_cnpj: cliente.cpfCnpj || null,
        telefone: cliente.telefone || cliente.whatsapp || null,
        whatsapp: cliente.whatsapp,
        email: cliente.email || null,
        endereco: cliente.endereco || null,
        observacoes: cliente.observacoes || null
      };

      if (isValidUuid(cliente.id)) {
        const { error } = await supabase.from('clientes').update(payload).eq('id', cliente.id).eq('empresa_id', empresaId);
        if (error) throw error;
      }

      addToLocalCache('clientes', cliente);
      return cliente;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const empresaId = getActiveTenantId();
      if (isValidUuid(id)) {
        await supabase.from('clientes').delete().eq('id', id).eq('empresa_id', empresaId);
      }
      removeFromLocalCache('clientes', id);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  });
}

// 2. ORÇAMENTOS
export function useOrcamentos() {
  return useQuery({
    queryKey: getTenantQueryKey('orcamentos'),
    queryFn: async () => {
      const empresaId = getActiveTenantId();
      const { data: orcs, error: oErr } = await supabase.from('orcamentos').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false });
      if (oErr) throw oErr;
      if (!orcs) return [];

      const { data: itemRows } = await supabase.from('orcamento_itens').select('*').eq('empresa_id', empresaId);

      const mapped: Budget[] = orcs.map(item => {
        const budgetItens = (itemRows || []).filter(i => i.orcamento_id === item.id);
        const itens = budgetItens.map(i => ({
          produtoId: i.produto_id,
          quantidade: i.quantidade,
          valorUnitario: Number(i.valor_unitario),
          desconto: Number(i.desconto || 0)
        }));

        return {
          id: item.id,
          numero: item.numero,
          clienteId: item.cliente_id,
          dataEmissao: item.data_emissao,
          validade: item.validade,
          previsaoEntrega: item.previsao_entrega || '',
          descontoGeral: Number(item.desconto_geral),
          observacoes: item.observacoes,
          status: item.status as Budget['status'],
          itens
        };
      });

      setLocalCache('orcamentos', mapped);
      return mapped;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddOrcamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (novo: Omit<Budget, 'id'>) => {
      const empresaId = getActiveTenantId();
      const operationId = crypto.randomUUID();
      const { data, error } = await supabase.rpc('salvar_orcamento_com_itens', {
        p_empresa_id: empresaId,
        p_orcamento: novo,
        p_itens: novo.itens,
        p_idempotency_key: operationId,
      });
      if (error) {
        if (!isNetworkFailure(error)) throw error;
        const offlineItem: Budget = { ...novo, id: `offline-${crypto.randomUUID()}` };
        await enqueueOfflineOperation(empresaId, 'create_budget', {
          budget: novo,
          items: novo.itens,
        }, operationId);
        addToLocalCache('orcamentos', offlineItem);
        return offlineItem;
      }

      const created: Budget = {
        ...novo,
        id: data?.id || crypto.randomUUID()
      };

      addToLocalCache('orcamentos', created);
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orcamentos'] }),
  });
}

export function useUpdateOrcamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (budget: Budget) => {
      const empresaId = getActiveTenantId();
      const { error } = await supabase.rpc('salvar_orcamento_com_itens', {
        p_empresa_id: empresaId,
        p_orcamento: budget,
        p_itens: budget.itens,
        p_idempotency_key: crypto.randomUUID(),
      });
      if (error) throw error;

      addToLocalCache('orcamentos', budget);
      return budget;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orcamentos'] }),
  });
}

export function useDeleteOrcamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const empresaId = getActiveTenantId();
      if (isValidUuid(id)) {
        await supabase.from('orcamentos').delete().eq('id', id).eq('empresa_id', empresaId);
      }
      removeFromLocalCache('orcamentos', id);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orcamentos'] }),
  });
}

// 3. VENDAS REALIZADAS
export function useVendas() {
  return useQuery({
    queryKey: getTenantQueryKey('vendas'),
    queryFn: async () => {
      const { data, error } = await supabase.from('vendas').select('*').eq('empresa_id', getActiveTenantId()).order('created_at', { ascending: false });
      if (error) throw error;
      if (!data) return [];

      const mapped: Sale[] = data.map(item => ({
        id: item.id,
        // Read numero from DB (populated by criar_venda_com_lancamento RPC).
        // Fall back to a derived label only for legacy rows that predate the column.
        numero: item.numero || `VND-${String(item.id).slice(0, 8).toUpperCase()}`,
        clienteId: item.cliente_id,
        dataVenda: item.data,
        itens: [],
        valorTotal: Number(item.valor_total),
        formaPagamento: item.forma_pagamento as Sale['formaPagamento'],
        statusPagamento: item.status as Sale['statusPagamento'],
        orcamentoOrigemId: item.orcamento_origem_id
      }));

      setLocalCache('vendas', mapped);
      return mapped;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddVenda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nova: Omit<Sale, 'id'>) => {
      const empresaId = getActiveTenantId();
      const { data, error } = await supabase.rpc('criar_venda_com_lancamento', {
        p_empresa_id: empresaId,
        p_cliente_id: nova.clienteId,
        p_data: nova.dataVenda,
        p_valor_total: nova.valorTotal,
        p_forma_pagamento: nova.formaPagamento,
        p_orcamento_origem_id: isValidUuid(nova.orcamentoOrigemId) ? nova.orcamentoOrigemId : null,
        p_numero: nova.numero,
      });
      if (error) throw error;

      const created: Sale = {
        id: data.id,
        numero: data.numero,
        clienteId: nova.clienteId,
        dataVenda: nova.dataVenda,
        itens: nova.itens,
        valorTotal: nova.valorTotal,
        formaPagamento: nova.formaPagamento,
        statusPagamento: 'Pendente',
        orcamentoOrigemId: nova.orcamentoOrigemId
      };

      addToLocalCache('vendas', created);
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros'] });
    },
  });
}

export function useUpdateVenda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (venda: Sale) => {
      const empresaId = getActiveTenantId();
      if (isValidUuid(venda.id)) {
        const { error } = await supabase.from('vendas').update({
          cliente_id: venda.clienteId,
          data: venda.dataVenda,
          valor_total: venda.valorTotal,
          forma_pagamento: venda.formaPagamento,
          status: venda.statusPagamento,
          orcamento_origem_id: isValidUuid(venda.orcamentoOrigemId) ? venda.orcamentoOrigemId : null,
        }).eq('id', venda.id).eq('empresa_id', empresaId);
        if (error) throw error;
      }
      addToLocalCache('vendas', venda);
      return venda;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendas'] }),
  });
}

export function useDeleteVenda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const empresaId = getActiveTenantId();
      if (isValidUuid(id)) {
        const { error } = await supabase.from('vendas').delete().eq('id', id).eq('empresa_id', empresaId);
        if (error) throw error;
      }
      removeFromLocalCache('vendas', id);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendas'] }),
  });
}

export function useConverterOrcamentoEmVenda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orcamentoId, formaPagamento }: { orcamentoId: string; formaPagamento?: string }) => {
      if (isValidUuid(orcamentoId)) {
        const { data: rpcRes, error } = await supabase.rpc('converter_orcamento_em_venda', {
          p_orcamento_id: orcamentoId,
          p_forma_pagamento: formaPagamento || 'Pix'
        });
        if (error) {
          console.warn("RPC converter_orcamento_em_venda falhou:", error.message);
          throw error;
        }
        return rpcRes;
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros'] });
    },
  });
}
