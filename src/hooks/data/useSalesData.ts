import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Client, Budget, Sale } from '../../types';
import { 
  getLocalCache, setLocalCache, addToLocalCache, removeFromLocalCache, isValidUuid 
} from '../../utils/storage';

const getFallbackEmpresaId = (): string => {
  try {
    const empresaId = localStorage.getItem('elmaneko_empresa_id');
    if (empresaId) return empresaId;
  } catch (e) {
    // The caller receives a clear tenant error below.
  }
  throw new Error('Nenhuma empresa ativa para a sessão atual.');
};

// 1. CLIENTES (CRM)
export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clientes').select('*').eq('empresa_id', getFallbackEmpresaId()).order('created_at', { ascending: false });
      if (error || !data) return getLocalCache<Client>('clientes');

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
    mutationFn: async (novo: Omit<Client, 'id'>) => {
      const empresaId = getFallbackEmpresaId();
      const payload = {
        empresa_id: empresaId,
        nome: novo.nome,
        cpf_cnpj: novo.cpfCnpj,
        telefone: novo.telefone,
        whatsapp: novo.whatsapp,
        email: novo.email,
        endereco: novo.endereco,
        observacoes: novo.observacoes
      };

      const { data, error } = await supabase.from('clientes').insert([payload]).select().single();
      if (error) {
        const offlineItem: Client = { ...novo, id: crypto.randomUUID() };
        addToLocalCache('clientes', offlineItem);
        return offlineItem;
      }

      const created: Client = {
        id: data.id,
        nome: data.nome,
        cpfCnpj: data.cpf_cnpj,
        telefone: data.telefone,
        whatsapp: data.whatsapp,
        email: data.email,
        endereco: data.endereco,
        observacoes: data.observacoes
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
      const empresaId = getFallbackEmpresaId();
      const payload = {
        nome: cliente.nome,
        cpf_cnpj: cliente.cpfCnpj,
        telefone: cliente.telefone,
        whatsapp: cliente.whatsapp,
        email: cliente.email,
        endereco: cliente.endereco,
        observacoes: cliente.observacoes
      };

      if (isValidUuid(cliente.id)) {
        await supabase.from('clientes').update(payload).eq('id', cliente.id).eq('empresa_id', empresaId);
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
      const empresaId = getFallbackEmpresaId();
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
    queryKey: ['orcamentos'],
    queryFn: async () => {
      const empresaId = getFallbackEmpresaId();
      const { data: orcs, error: oErr } = await supabase.from('orcamentos').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false });
      if (oErr || !orcs) return getLocalCache<Budget>('orcamentos');

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
          status: item.status as any,
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
      const empresaId = getFallbackEmpresaId();
      const payload = {
        empresa_id: empresaId,
        numero: novo.numero,
        cliente_id: novo.clienteId,
        data_emissao: novo.dataEmissao,
        validade: novo.validade,
        previsao_entrega: novo.previsaoEntrega || null,
        desconto_geral: novo.descontoGeral,
        observacoes: novo.observacoes,
        status: novo.status
      };

      const { data: orcData, error } = await supabase.from('orcamentos').insert([payload]).select().single();
      if (error) {
        const offlineItem: Budget = { ...novo, id: crypto.randomUUID() };
        addToLocalCache('orcamentos', offlineItem);
        return offlineItem;
      }

      if (novo.itens && novo.itens.length > 0) {
        const itemPayloads = novo.itens.map(i => ({
          empresa_id: empresaId,
          orcamento_id: orcData.id,
          produto_id: i.produtoId,
          quantidade: i.quantidade,
          valor_unitario: i.valorUnitario,
          desconto: i.desconto
        }));
        await supabase.from('orcamento_itens').insert(itemPayloads);
      }

      const created: Budget = {
        ...novo,
        id: orcData.id
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
      const empresaId = getFallbackEmpresaId();
      const payload = {
        cliente_id: budget.clienteId,
        data_emissao: budget.dataEmissao,
        validade: budget.validade,
        previsao_entrega: budget.previsaoEntrega || null,
        desconto_geral: budget.descontoGeral,
        observacoes: budget.observacoes,
        status: budget.status
      };

      if (isValidUuid(budget.id)) {
        await supabase.from('orcamentos').update(payload).eq('id', budget.id).eq('empresa_id', empresaId);
        await supabase.from('orcamento_itens').delete().eq('orcamento_id', budget.id).eq('empresa_id', empresaId);

        if (budget.itens && budget.itens.length > 0) {
          const itemPayloads = budget.itens.map(i => ({
            empresa_id: empresaId,
            orcamento_id: budget.id,
            produto_id: i.produtoId,
            quantidade: i.quantidade,
            valor_unitario: i.valorUnitario,
            desconto: i.desconto
          }));
          await supabase.from('orcamento_itens').insert(itemPayloads);
        }
      }

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
      const empresaId = getFallbackEmpresaId();
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
    queryKey: ['vendas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vendas').select('*').eq('empresa_id', getFallbackEmpresaId()).order('created_at', { ascending: false });
      if (error || !data) return getLocalCache<Sale>('vendas');

      const mapped: Sale[] = data.map(item => ({
        id: item.id,
        numero: `VENDA-${String(item.id).slice(0, 8).toUpperCase()}`,
        clienteId: item.cliente_id,
        dataVenda: item.data,
        itens: [],
        valorTotal: Number(item.valor_total),
        formaPagamento: item.forma_pagamento as any,
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
      const empresaId = getFallbackEmpresaId();
      const payload = {
        empresa_id: empresaId,
        cliente_id: nova.clienteId,
        data: nova.dataVenda,
        valor_total: nova.valorTotal,
        forma_pagamento: nova.formaPagamento,
        status: nova.statusPagamento,
        orcamento_origem_id: isValidUuid(nova.orcamentoOrigemId) ? nova.orcamentoOrigemId : null
      };

      const { data, error } = await supabase.from('vendas').insert([payload]).select().single();
      if (error) {
        const offlineItem: Sale = { ...nova, id: crypto.randomUUID() };
        addToLocalCache('vendas', offlineItem);
        return offlineItem;
      }

      const created: Sale = {
        id: data.id,
        numero: nova.numero,
        clienteId: data.cliente_id,
        dataVenda: data.data,
        itens: nova.itens,
        valorTotal: Number(data.valor_total),
        formaPagamento: data.forma_pagamento,
        statusPagamento: data.status,
        orcamentoOrigemId: data.orcamento_origem_id
      };

      addToLocalCache('vendas', created);

      try {
        await supabase.from('lancamentos_financeiros').insert([{
          empresa_id: empresaId,
          numero_documento: `VENDA-${data.id.slice(0, 8)}`,
          tipo: 'Receita',
          origem: 'Venda',
          origem_id: data.id,
          cliente_id: data.cliente_id,
          data_emissao: data.data || new Date().toISOString().split('T')[0],
          data_vencimento: data.data || new Date().toISOString().split('T')[0],
          valor_bruto: Number(data.valor_total),
          valor_liquido: Number(data.valor_total),
          forma_pagamento: data.forma_pagamento || 'PIX',
          status: 'Aberto',
          observacoes: `Faturamento gerado automaticamente pela Venda #${data.id.slice(0, 8)}`
        }]);
      } catch (e) {}

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
      const empresaId = getFallbackEmpresaId();
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
      const empresaId = getFallbackEmpresaId();
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

