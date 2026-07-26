import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Filament, Purchase, Printer, EnergyTariff, Product, ProductionOrder, Budget, Sale, Client, BackupLog, StockMovement, ProductStock } from '../types';

// Wrapper para checar tenant antes da query
export const useData = () => {
  const { empresaId } = useAuth();
  const queryClient = useQueryClient();

  // --- FILAMENTOS ---
  const useFilamentos = () => useQuery({
    queryKey: ['filamentos', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase.from('filamentos').select('*').eq('empresa_id', empresaId);
      if (error) throw error;
      return (data || []) as Filament[];
    },
    enabled: !!empresaId,
  });

  const useAddFilamento = () => useMutation({
    mutationFn: async (newFilamento: Omit<Filament, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data, error } = await supabase.from('filamentos').insert([{ ...newFilamento, empresa_id: empresaId }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['filamentos'] }),
  });

  const useUpdateFilamento = () => useMutation({
    mutationFn: async (filamento: Filament) => {
      const { id, ...rest } = filamento;
      const { data, error } = await supabase.from('filamentos').update(rest).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['filamentos'] }),
  });

  const useDeleteFilamento = () => useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('filamentos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['filamentos'] }),
  });

  // --- COMPRAS ---
  const useCompras = () => useQuery({
    queryKey: ['compras', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase.from('compras').select('*').eq('empresa_id', empresaId);
      if (error) throw error;
      return (data || []) as Purchase[];
    },
    enabled: !!empresaId,
  });

  const useAddCompra = () => useMutation({
    mutationFn: async (newCompra: Omit<Purchase, 'id' | 'createdAt'>) => {
      // O trigger no DB atualiza o estoque de filamento automaticamente
      const { data, error } = await supabase.from('compras').insert([{ ...newCompra, empresa_id: empresaId }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      queryClient.invalidateQueries({ queryKey: ['filamentos'] });
    },
  });

  // --- IMPRESSORAS ---
  const useImpressoras = () => useQuery({
    queryKey: ['impressoras', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase.from('impressoras').select('*').eq('empresa_id', empresaId);
      if (error) throw error;
      return (data || []) as Printer[];
    },
    enabled: !!empresaId,
  });

  const useAddImpressora = () => useMutation({
    mutationFn: async (printer: Omit<Printer, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data, error } = await supabase.from('impressoras').insert([{ ...printer, empresa_id: empresaId }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impressoras'] }),
  });

  const useUpdateImpressora = () => useMutation({
    mutationFn: async (printer: Printer) => {
      const { id, ...rest } = printer;
      const { data, error } = await supabase.from('impressoras').update(rest).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impressoras'] }),
  });

  const useDeleteImpressora = () => useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('impressoras').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impressoras'] }),
  });

  // --- CLIENTES ---
  const useClientes = () => useQuery({
    queryKey: ['clientes', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase.from('clientes').select('*').eq('empresa_id', empresaId);
      if (error) throw error;
      return (data || []) as Client[];
    },
    enabled: !!empresaId,
  });

  const useAddCliente = () => useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data, error } = await supabase.from('clientes').insert([{ ...client, empresa_id: empresaId }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  });

  const useUpdateCliente = () => useMutation({
    mutationFn: async (client: Client) => {
      const { id, ...rest } = client;
      const { data, error } = await supabase.from('clientes').update(rest).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  });

  const useDeleteCliente = () => useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  });

  // --- TARIFAS ---
  const useTarifas = () => useQuery({
    queryKey: ['tarifas', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase.from('tarifas_energia').select('*').eq('empresa_id', empresaId);
      if (error) throw error;
      return (data || []) as EnergyTariff[];
    },
    enabled: !!empresaId,
  });

  const useAddTarifa = () => useMutation({
    mutationFn: async (tarifa: Omit<EnergyTariff, 'id' | 'createdAt'>) => {
      const { data, error } = await supabase.from('tarifas_energia').insert([{ ...tarifa, empresa_id: empresaId }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tarifas'] }),
  });

  // --- PRODUTOS ---
  const useProdutos = () => useQuery({
    queryKey: ['produtos', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase.from('produtos').select('*').eq('empresa_id', empresaId);
      if (error) throw error;
      return (data || []) as Product[];
    },
    enabled: !!empresaId,
  });

  const useAddProduto = () => useMutation({
    mutationFn: async (produto: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data, error } = await supabase.from('produtos').insert([{ ...produto, empresa_id: empresaId }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos'] }),
  });

  const useUpdateProduto = () => useMutation({
    mutationFn: async (produto: Product) => {
      const { id, ...rest } = produto;
      const { data, error } = await supabase.from('produtos').update(rest).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos'] }),
  });

  const useDeleteProduto = () => useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos'] }),
  });

  // --- VENDAS ---
  const useVendas = () => useQuery({
    queryKey: ['vendas', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase.from('vendas').select('*').eq('empresa_id', empresaId);
      if (error) throw error;
      return (data || []) as Sale[];
    },
    enabled: !!empresaId,
  });

  const useAddVenda = () => useMutation({
    mutationFn: async (venda: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data, error } = await supabase.from('vendas').insert([{ ...venda, empresa_id: empresaId }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendas'] }),
  });

  const useUpdateVenda = () => useMutation({
    mutationFn: async (venda: Sale) => {
      const { id, ...rest } = venda;
      const { data, error } = await supabase.from('vendas').update(rest).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendas'] }),
  });

  // --- PRODUÇÕES ---
  const useProducoes = () => useQuery({
    queryKey: ['producoes', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase.from('producoes').select('*').eq('empresa_id', empresaId);
      if (error) throw error;
      return (data || []) as ProductionOrder[];
    },
    enabled: !!empresaId,
  });

  const useAddProducao = () => useMutation({
    mutationFn: async (producao: Omit<ProductionOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data, error } = await supabase.from('producoes').insert([{ ...producao, empresa_id: empresaId }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['producoes'] }),
  });

  const useUpdateProducao = () => useMutation({
    mutationFn: async (producao: ProductionOrder) => {
      const { id, ...rest } = producao;
      const { data, error } = await supabase.from('producoes').update(rest).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['producoes'] }),
  });

  // --- ORÇAMENTOS ---
  const useOrcamentos = () => useQuery({
    queryKey: ['orcamentos', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase.from('orcamentos').select('*').eq('empresa_id', empresaId);
      if (error) throw error;
      return (data || []) as Budget[];
    },
    enabled: !!empresaId,
  });

  const useAddOrcamento = () => useMutation({
    mutationFn: async (orcamento: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data, error } = await supabase.from('orcamentos').insert([{ ...orcamento, empresa_id: empresaId }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orcamentos'] }),
  });

  const useUpdateOrcamento = () => useMutation({
    mutationFn: async (orcamento: Budget) => {
      const { id, ...rest } = orcamento;
      const { data, error } = await supabase.from('orcamentos').update(rest).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orcamentos'] }),
  });

  const useDeleteOrcamento = () => useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('orcamentos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orcamentos'] }),
  });

  return {
    useFilamentos, useAddFilamento, useUpdateFilamento, useDeleteFilamento,
    useCompras, useAddCompra,
    useImpressoras, useAddImpressora, useUpdateImpressora, useDeleteImpressora,
    useClientes, useAddCliente, useUpdateCliente, useDeleteCliente,
    useTarifas, useAddTarifa,
    useProdutos, useAddProduto, useUpdateProduto, useDeleteProduto,
    useVendas, useAddVenda, useUpdateVenda,
    useProducoes, useAddProducao, useUpdateProducao,
    useOrcamentos, useAddOrcamento, useUpdateOrcamento, useDeleteOrcamento
  };
};
