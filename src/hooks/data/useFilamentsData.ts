import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Filament, Purchase, SupplyItem } from '../../types';
import { 
  setLocalCache, addToLocalCache, removeFromLocalCache, isValidUuid, getActiveTenantId, getTenantQueryKey
} from '../../utils/storage';
import { enqueueOfflineOperation, isNetworkFailure } from '../../utils/offlineQueue';

// 1. FILAMENTOS
export function useFilamentos() {
  return useQuery({
    queryKey: getTenantQueryKey('filamentos'),
    queryFn: async () => {
      const { data, error } = await supabase.from('filamentos').select('*').eq('empresa_id', getActiveTenantId()).order('created_at', { ascending: false });
      if (error) throw error;
      if (!data) return [];

      const mapped: Filament[] = data.map(item => ({
        id: item.id,
        nome: item.nome,
        tipo: item.tipo,
        marca: item.marca,
        cor: item.cor,
        pesoTotal: Number(item.peso_total),
        quantidadeDisponivel: Number(item.quantidade_disponivel),
        valorCompra: Number(item.valor_compra),
        dataCompra: item.data_compra,
        fornecedor: item.fornecedor,
        observacoes: item.observacoes
      }));

      setLocalCache('filamentos', mapped);
      return mapped;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddFilamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (novo: Omit<Filament, 'id'>) => {
      const empresaId = getActiveTenantId();
      const payload = {
        empresa_id: empresaId,
        nome: novo.nome,
        tipo: novo.tipo,
        marca: novo.marca,
        cor: novo.cor,
        peso_total: novo.pesoTotal,
        quantidade_disponivel: novo.quantidadeDisponivel,
        valor_compra: novo.valorCompra,
        data_compra: novo.dataCompra,
        fornecedor: novo.fornecedor,
        observacoes: novo.observacoes
      };

      const { data, error } = await supabase.from('filamentos').insert([payload]).select().single();
      if (error) {
        const offlineItem: Filament = { ...novo, id: crypto.randomUUID() };
        addToLocalCache('filamentos', offlineItem);
        return offlineItem;
      }

      const created: Filament = {
        id: data.id,
        nome: data.nome,
        tipo: data.tipo,
        marca: data.marca,
        cor: data.cor,
        pesoTotal: Number(data.peso_total),
        quantidadeDisponivel: Number(data.quantidade_disponivel),
        valorCompra: Number(data.valor_compra),
        dataCompra: data.data_compra,
        fornecedor: data.fornecedor,
        observacoes: data.observacoes
      };

      addToLocalCache('filamentos', created);
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['filamentos'] }),
  });
}

export function useUpdateFilamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (filamento: Filament) => {
      const empresaId = getActiveTenantId();
      const payload = {
        nome: filamento.nome,
        tipo: filamento.tipo,
        marca: filamento.marca,
        cor: filamento.cor,
        peso_total: filamento.pesoTotal,
        quantidade_disponivel: filamento.quantidadeDisponivel,
        valor_compra: filamento.valorCompra,
        data_compra: filamento.dataCompra,
        fornecedor: filamento.fornecedor,
        observacoes: filamento.observacoes
      };

      if (isValidUuid(filamento.id)) {
        await supabase.from('filamentos').update(payload).eq('id', filamento.id).eq('empresa_id', empresaId);
      }

      addToLocalCache('filamentos', filamento);
      return filamento;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['filamentos'] }),
  });
}

export function useDeleteFilamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const empresaId = getActiveTenantId();
      if (isValidUuid(id)) {
        await supabase.from('filamentos').delete().eq('id', id).eq('empresa_id', empresaId);
      }
      removeFromLocalCache('filamentos', id);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['filamentos'] }),
  });
}

// 2. INSUMOS
export function useInsumos() {
  return useQuery({
    queryKey: getTenantQueryKey('insumos'),
    queryFn: async () => {
      const { data, error } = await supabase.from('insumos').select('*').eq('empresa_id', getActiveTenantId()).order('created_at', { ascending: false });
      if (error) throw error;
      if (!data) return [];

      const mapped: SupplyItem[] = data.map(item => ({
        id: item.id,
        nome: item.nome,
        categoria: item.categoria,
        unidadeMedida: item.unidade_medida || 'un',
        quantidadeEstoque: Number(item.quantidade_estoque || 0),
        estoqueMinimo: Number(item.estoque_minimo || 5),
        custoUnitarioPadrao: Number(item.custo_unitario_padrao || 0),
        fornecedorPadrao: item.fornecedor_padrao || '',
        observacoes: item.observacoes || ''
      }));

      setLocalCache('insumos', mapped);
      return mapped;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddInsumo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (novo: Omit<SupplyItem, 'id'>) => {
      const empresaId = getActiveTenantId();
      const payload = {
        empresa_id: empresaId,
        nome: novo.nome,
        categoria: novo.categoria,
        unidade_medida: novo.unidadeMedida,
        quantidade_estoque: novo.quantidadeEstoque,
        estoque_minimo: novo.estoqueMinimo,
        custo_unitario_padrao: novo.custoUnitarioPadrao,
        fornecedor_padrao: novo.fornecedorPadrao,
        observacoes: novo.observacoes
      };

      const { data, error } = await supabase.from('insumos').insert([payload]).select().single();
      if (error) {
        const offlineItem: SupplyItem = { ...novo, id: crypto.randomUUID() };
        addToLocalCache('insumos', offlineItem);
        return offlineItem;
      }

      const created: SupplyItem = {
        id: data.id,
        nome: data.nome,
        categoria: data.categoria,
        unidadeMedida: data.unidade_medida,
        quantidadeEstoque: Number(data.quantidade_estoque),
        estoqueMinimo: Number(data.estoque_minimo),
        custoUnitarioPadrao: Number(data.custo_unitario_padrao),
        fornecedorPadrao: data.fornecedor_padrao,
        observacoes: data.observacoes
      };

      addToLocalCache('insumos', created);
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insumos'] }),
  });
}

export function useUpdateInsumo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: SupplyItem) => {
      const empresaId = getActiveTenantId();
      const payload = {
        nome: item.nome,
        categoria: item.categoria,
        unidade_medida: item.unidadeMedida,
        quantidade_estoque: item.quantidadeEstoque,
        estoque_minimo: item.estoqueMinimo,
        custo_unitario_padrao: item.custoUnitarioPadrao,
        fornecedor_padrao: item.fornecedorPadrao,
        observacoes: item.observacoes
      };

      if (isValidUuid(item.id)) {
        await supabase.from('insumos').update(payload).eq('id', item.id).eq('empresa_id', empresaId);
      }

      addToLocalCache('insumos', item);
      return item;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insumos'] }),
  });
}

export function useDeleteInsumo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const empresaId = getActiveTenantId();
      if (isValidUuid(id)) {
        await supabase.from('insumos').delete().eq('id', id).eq('empresa_id', empresaId);
      }
      removeFromLocalCache('insumos', id);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insumos'] }),
  });
}

// 3. COMPRAS
export function useCompras() {
  return useQuery({
    queryKey: getTenantQueryKey('compras'),
    queryFn: async () => {
      const { data, error } = await supabase.from('compras').select('*').eq('empresa_id', getActiveTenantId()).order('created_at', { ascending: false });
      if (error) throw error;
      if (!data) return [];

      const mapped: Purchase[] = data.map(item => ({
        id: item.id,
        data: item.data,
        fornecedor: item.fornecedor,
        categoriaItem: item.categoria_item || 'Filamento',
        descricaoItem: item.descricao_item || '',
        quantidade: Number(item.quantidade || item.quantidade_adquirida || 1),
        unidadeMedida: item.unidade_medida || 'un',
        filamentoId: item.filamento_id,
        insumoId: item.insumo_id,
        quantidadeAdquirida: Number(item.quantidade_adquirida),
        valorPago: Number(item.valor_pago),
        notaFiscal: item.nota_fiscal,
        observacoes: item.observacoes
      }));

      setLocalCache('compras', mapped);
      return mapped;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nova: Omit<Purchase, 'id'>) => {
      const empresaId = getActiveTenantId();
      const operationId = crypto.randomUUID();
      const { data, error } = await supabase.rpc('criar_compra_com_despesa', {
        p_empresa_id: empresaId,
        p_compra: {
          ...nova,
          filamentoId: isValidUuid(nova.filamentoId) ? nova.filamentoId : '',
          insumoId: isValidUuid(nova.insumoId) ? nova.insumoId : '',
        },
        p_idempotency_key: operationId,
      });
      if (error) {
        if (!isNetworkFailure(error)) throw error;
        const offlineItem: Purchase = { ...nova, id: `offline-${crypto.randomUUID()}` };
        await enqueueOfflineOperation(empresaId, 'create_purchase', {
          ...nova,
          filamentoId: isValidUuid(nova.filamentoId) ? nova.filamentoId : '',
          insumoId: isValidUuid(nova.insumoId) ? nova.insumoId : '',
        }, operationId);
        addToLocalCache('compras', offlineItem);
        return offlineItem;
      }

      const created: Purchase = {
        id: data.id,
        ...nova,
      };

      addToLocalCache('compras', created);
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      queryClient.invalidateQueries({ queryKey: ['filamentos'] });
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros'] });
    },
  });
}

export function useUpdateCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (compra: Purchase) => {
      const empresaId = getActiveTenantId();
      if (isValidUuid(compra.id)) {
        const { error } = await supabase.rpc('atualizar_compra_com_despesa', {
          p_empresa_id: empresaId,
          p_compra_id: compra.id,
          p_compra: { ...compra, filamentoId: isValidUuid(compra.filamentoId) ? compra.filamentoId : '', insumoId: isValidUuid(compra.insumoId) ? compra.insumoId : '' },
        });
        if (error) throw error;
      }

      addToLocalCache('compras', compra);
      return compra;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      queryClient.invalidateQueries({ queryKey: ['filamentos'] });
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros'] });
    },
  });
}

export function useDeleteCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const empresaId = getActiveTenantId();
      if (isValidUuid(id)) {
        const { error } = await supabase.rpc('excluir_compra_com_despesa', { p_empresa_id: empresaId, p_compra_id: id });
        if (error) throw error;
      }
      removeFromLocalCache('compras', id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      queryClient.invalidateQueries({ queryKey: ['filamentos'] });
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos_financeiros'] });
    },
  });
}
