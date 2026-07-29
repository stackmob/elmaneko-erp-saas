import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Filament, Purchase, SupplyItem } from '../../types';
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

// 1. FILAMENTOS
export function useFilamentos() {
  return useQuery({
    queryKey: ['filamentos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('filamentos').select('*').eq('empresa_id', getFallbackEmpresaId()).order('created_at', { ascending: false });
      if (error || !data) return getLocalCache<Filament>('filamentos');

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
      const empresaId = getFallbackEmpresaId();
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
        await supabase.from('filamentos').update(payload).eq('id', filamento.id);
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
      if (isValidUuid(id)) {
        await supabase.from('filamentos').delete().eq('id', id);
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
    queryKey: ['insumos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('insumos').select('*').eq('empresa_id', getFallbackEmpresaId()).order('created_at', { ascending: false });
      if (error || !data) return getLocalCache<SupplyItem>('insumos');

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
      const empresaId = getFallbackEmpresaId();
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
        await supabase.from('insumos').update(payload).eq('id', item.id);
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
      if (isValidUuid(id)) {
        await supabase.from('insumos').delete().eq('id', id);
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
    queryKey: ['compras'],
    queryFn: async () => {
      const { data, error } = await supabase.from('compras').select('*').eq('empresa_id', getFallbackEmpresaId()).order('created_at', { ascending: false });
      if (error || !data) return getLocalCache<Purchase>('compras');

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
      const empresaId = getFallbackEmpresaId();
      const payload = {
        empresa_id: empresaId,
        data: nova.data,
        fornecedor: nova.fornecedor,
        categoria_item: nova.categoriaItem,
        descricao_item: nova.descricaoItem,
        quantidade: nova.quantidade,
        unidade_medida: nova.unidadeMedida,
        filamento_id: isValidUuid(nova.filamentoId) ? nova.filamentoId : null,
        insumo_id: isValidUuid(nova.insumoId) ? nova.insumoId : null,
        quantidade_adquirida: nova.quantidadeAdquirida,
        valor_pago: nova.valorPago,
        nota_fiscal: nova.notaFiscal,
        observacoes: nova.observacoes
      };

      const { data, error } = await supabase.from('compras').insert([payload]).select().single();
      if (error) {
        const offlineItem: Purchase = { ...nova, id: crypto.randomUUID() };
        addToLocalCache('compras', offlineItem);
        return offlineItem;
      }

      const created: Purchase = {
        id: data.id,
        data: data.data,
        fornecedor: data.fornecedor,
        categoriaItem: data.categoria_item,
        descricaoItem: data.descricao_item,
        quantidade: Number(data.quantidade),
        unidadeMedida: data.unidade_medida,
        filamentoId: data.filamento_id,
        insumoId: data.insumo_id,
        quantidadeAdquirida: Number(data.quantidade_adquirida),
        valorPago: Number(data.valor_pago),
        notaFiscal: data.nota_fiscal,
        observacoes: data.observacoes
      };

      addToLocalCache('compras', created);

      try {
        await supabase.from('lancamentos_financeiros').insert([{
          empresa_id: empresaId,
          numero_documento: data.nota_fiscal ? `NF-${data.nota_fiscal}` : `COMP-${data.id.slice(0, 8)}`,
          tipo: 'Despesa',
          origem: 'Compra',
          origem_id: data.id,
          fornecedor: data.fornecedor,
          data_emissao: data.data || new Date().toISOString().split('T')[0],
          data_vencimento: data.data || new Date().toISOString().split('T')[0],
          valor_bruto: Number(data.valor_pago),
          valor_liquido: Number(data.valor_pago),
          forma_pagamento: 'PIX',
          status: 'Aberto',
          observacoes: `Despesa gerada automaticamente pela Compra de Insumos #${data.id.slice(0, 8)}`
        }]);
      } catch (e) {}

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
      const payload = {
        data: compra.data,
        fornecedor: compra.fornecedor,
        categoria_item: compra.categoriaItem,
        descricao_item: compra.descricaoItem,
        quantidade: compra.quantidade,
        unidade_medida: compra.unidadeMedida,
        filamento_id: isValidUuid(compra.filamentoId) ? compra.filamentoId : null,
        insumo_id: isValidUuid(compra.insumoId) ? compra.insumoId : null,
        quantidade_adquirida: compra.quantidadeAdquirida,
        valor_pago: compra.valorPago,
        nota_fiscal: compra.notaFiscal,
        observacoes: compra.observacoes
      };

      if (isValidUuid(compra.id)) {
        await supabase.from('compras').update(payload).eq('id', compra.id);
        
        try {
          await supabase
            .from('lancamentos_financeiros')
            .update({
              fornecedor: compra.fornecedor,
              data_emissao: compra.data || new Date().toISOString().split('T')[0],
              data_vencimento: compra.data || new Date().toISOString().split('T')[0],
              valor_bruto: Number(compra.valorPago),
              valor_liquido: Number(compra.valorPago),
              numero_documento: compra.notaFiscal ? `NF-${compra.notaFiscal}` : `COMP-${compra.id.slice(0, 8)}`,
            })
            .eq('origem_id', compra.id);
        } catch (e) {}
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
      if (isValidUuid(id)) {
        await supabase.from('compras').delete().eq('id', id);
        try {
          await supabase.from('lancamentos_financeiros').delete().eq('origem_id', id);
        } catch (e) {}
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

