import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Client, Budget, Sale } from '../../types';
import { 
  getLocalCache, setLocalCache, addToLocalCache, removeFromLocalCache, isValidUuid 
} from '../../utils/storage';

const DEFAULT_DEMO_EMPRESA_ID = "00000000-0000-0000-0000-000000000001";

const getFallbackEmpresaId = (): string => {
  try {
    return localStorage.getItem('elmaneko_empresa_id') || DEFAULT_DEMO_EMPRESA_ID;
  } catch (e) {
    return DEFAULT_DEMO_EMPRESA_ID;
  }
};

export function useSalesData() {
  const queryClient = useQueryClient();

  // 1. CLIENTES (CRM)
  const useClientes = () => {
    return useQuery({
      queryKey: ['clientes'],
      queryFn: async () => {
        const { data, error } = await supabase.from('clientes').select('*').order('created_at', { ascending: false });
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
  };

  const useAddCliente = () => {
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
  };

  const useUpdateCliente = () => {
    return useMutation({
      mutationFn: async (cliente: Client) => {
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
          await supabase.from('clientes').update(payload).eq('id', cliente.id);
        }

        addToLocalCache('clientes', cliente);
        return cliente;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
    });
  };

  const useDeleteCliente = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        if (isValidUuid(id)) {
          await supabase.from('clientes').delete().eq('id', id);
        }
        removeFromLocalCache('clientes', id);
        return id;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
    });
  };

  // 2. ORÇAMENTOS
  const useOrcamentos = () => {
    return useQuery({
      queryKey: ['orcamentos'],
      queryFn: async () => {
        const { data: orcs, error: oErr } = await supabase.from('orcamentos').select('*').order('created_at', { ascending: false });
        if (oErr || !orcs) return getLocalCache<Budget>('orcamentos');

        const { data: itemRows } = await supabase.from('orcamento_itens').select('*');

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
  };

  const useAddOrcamento = () => {
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
  };

  const useUpdateOrcamento = () => {
    return useMutation({
      mutationFn: async (budget: Budget) => {
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
          await supabase.from('orcamentos').update(payload).eq('id', budget.id);
          await supabase.from('orcamento_itens').delete().eq('orcamento_id', budget.id);

          if (budget.itens && budget.itens.length > 0) {
            const empresaId = getFallbackEmpresaId();
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
  };

  const useDeleteOrcamento = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        if (isValidUuid(id)) {
          await supabase.from('orcamentos').delete().eq('id', id);
        }
        removeFromLocalCache('orcamentos', id);
        return id;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orcamentos'] }),
    });
  };

  // 3. VENDAS REALIZADAS
  const useVendas = () => {
    return useQuery({
      queryKey: ['vendas'],
      queryFn: async () => {
        const { data, error } = await supabase.from('vendas').select('*').order('created_at', { ascending: false });
        if (error || !data) return getLocalCache<Sale>('vendas');

        const mapped: Sale[] = data.map(item => ({
          id: item.id,
          clienteId: item.cliente_id,
          data: item.data,
          valorTotal: Number(item.valor_total),
          formaPagamento: item.forma_pagamento as any,
          status: item.status as any,
          orcamentoOrigemId: item.orcamento_origem_id
        }));

        setLocalCache('vendas', mapped);
        return mapped;
      },
      staleTime: 1000 * 60 * 5,
    });
  };

  const useAddVenda = () => {
    return useMutation({
      mutationFn: async (nova: Omit<Sale, 'id'>) => {
        const empresaId = getFallbackEmpresaId();
        const payload = {
          empresa_id: empresaId,
          cliente_id: nova.clienteId,
          data: nova.data,
          valor_total: nova.valorTotal,
          forma_pagamento: nova.formaPagamento,
          status: nova.status,
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
          clienteId: data.cliente_id,
          data: data.data,
          valorTotal: Number(data.valor_total),
          formaPagamento: data.forma_pagamento,
          status: data.status,
          orcamentoOrigemId: data.orcamento_origem_id
        };

        addToLocalCache('vendas', created);

        // Auto-link: Lançamento Financeiro de Receita
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
  };

  return {
    useClientes,
    useAddCliente,
    useUpdateCliente,
    useDeleteCliente,
    useOrcamentos,
    useAddOrcamento,
    useUpdateOrcamento,
    useDeleteOrcamento,
    useVendas,
    useAddVenda,
  };
}
