import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Product, ProductionOrder } from '../../types';
import { 
  getLocalCache, setLocalCache, addToLocalCache, removeFromLocalCache, isValidUuid, getActiveTenantId, getTenantQueryKey
} from '../../utils/storage';
import { enqueueOfflineOperation, isNetworkFailure } from '../../utils/offlineQueue';

// PRODUTOS & BOM
export function useProdutos() {
  return useQuery({
    queryKey: getTenantQueryKey('produtos'),
    queryFn: async () => {
      const empresaId = getActiveTenantId();
      const { data: prods, error: pErr } = await supabase.from('produtos').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false });
      if (pErr) throw pErr;
      if (!prods) return [];

      const { data: matRows } = await supabase.from('produto_materiais').select('*').eq('empresa_id', empresaId);

      const mapped: Product[] = prods.map(item => {
        const itemMats = (matRows || []).filter(m => m.produto_id === item.id);
        const materials = itemMats.map(m => ({
          tipoFilamento: m.tipo_filamento,
          quantidadeGrams: Number(m.quantidade_grams),
          filamentoId: m.filamento_id || 'any'
        }));

        return {
          id: item.id,
          nome: item.nome,
          categoria: item.categoria,
          descricao: item.descricao,
          imagem: item.imagem,
          tempoImpressao: Number(item.tempo_impressao),
          impressoraPadraoId: item.impressora_padrao_id,
          tempoAcabamento: Number(item.tempo_acabamento || 0),
          valorMaoDeObra: Number(item.valor_mao_de_obra),
          margemLucro: item.margem_lucro !== null ? Number(item.margem_lucro) : 100,
          overPercent: item.over_percent !== null ? Number(item.over_percent) : 0,
          precoVenda: item.preco_venda !== null ? Number(item.preco_venda) : 0,
          pdfProjeto: item.pdf_projeto || '',
          pdfProjetoNome: item.pdf_projeto_nome || '',
          linkProjeto: item.link_projeto || '',
          outrasDespesas: item.outras_despesas !== null ? Number(item.outras_despesas) : 0,
          observacoes: item.observacoes,
          materials
        };
      });

      setLocalCache('produtos', mapped);
      return mapped;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (novo: Omit<Product, 'id'>) => {
      const empresaId = getActiveTenantId();
      const { data, error } = await supabase.rpc('salvar_produto_com_bom', {
        p_empresa_id: empresaId,
        p_produto: { ...novo, impressoraPadraoId: isValidUuid(novo.impressoraPadraoId) ? novo.impressoraPadraoId : '' },
        p_materiais: novo.materials || [],
      });
      if (error) {
        if (!isNetworkFailure(error)) throw error;
        const offlineItem: Product = { ...novo, id: `offline-${crypto.randomUUID()}` };
        await enqueueOfflineOperation(empresaId, 'create_product', { product: { ...novo, impressoraPadraoId: isValidUuid(novo.impressoraPadraoId) ? novo.impressoraPadraoId : '' }, materials: novo.materials || [] });
        addToLocalCache('produtos', offlineItem);
        return offlineItem;
      }

      const created: Product = {
        ...novo,
        id: data.id
      };

      addToLocalCache('produtos', created);
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos'] }),
  });
}

export function useUpdateProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (produto: Product) => {
      const empresaId = getActiveTenantId();
      const { error } = await supabase.rpc('salvar_produto_com_bom', {
        p_empresa_id: empresaId,
        p_produto: { ...produto, impressoraPadraoId: isValidUuid(produto.impressoraPadraoId) ? produto.impressoraPadraoId : '' },
        p_materiais: produto.materials || [],
      });
      if (error) throw error;

      addToLocalCache('produtos', produto);
      return produto;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos'] }),
  });
}

export function useDeleteProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isValidUuid(id)) {
        await supabase.from('produtos').delete().eq('id', id);
      }
      removeFromLocalCache('produtos', id);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos'] }),
  });
}

// PRODUÇÕES (FILA 3D)
export function useProducoes() {
  return useQuery({
    queryKey: getTenantQueryKey('producoes'),
    queryFn: async () => {
      const { data, error } = await supabase.from('producoes').select('*').eq('empresa_id', getActiveTenantId()).order('created_at', { ascending: false });
      if (error) throw error;
      if (!data) return [];

      const mapped: ProductionOrder[] = data.map(item => ({
        id: item.id,
        numero: item.numero,
        data: item.data,
        produtoId: item.produto_id,
        quantidade: item.quantidade,
        impressoraId: item.impressora_id,
        operador: item.operador,
        status: item.status as ProductionOrder['status'],
        custoFilamento: Number(item.custo_filamento),
        custoEnergia: Number(item.custo_energia),
        custoMaoDeObra: Number(item.custo_mao_de_obra),
        custoTotal: Number(item.custo_total),
        custoUnitario: Number(item.custo_unitario),
        maoDeObraEscolha: item.mao_de_obra_escolha as ProductionOrder['maoDeObraEscolha'],
        maoDeObraValor: Number(item.mao_de_obra_valor || 0),
        observacoes: item.observacoes
      }));

      setLocalCache('producoes', mapped);
      return mapped;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddProducao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nova: Omit<ProductionOrder, 'id'>) => {
      const empresaId = getActiveTenantId();
      const payload = {
        empresa_id: empresaId,
        numero: nova.numero,
        data: nova.data,
        produto_id: nova.produtoId,
        quantidade: nova.quantidade,
        impressora_id: nova.impressoraId,
        operador: nova.operador,
        status: nova.status,
        custo_filamento: nova.custoFilamento,
        custo_energia: nova.custoEnergia,
        custo_mao_de_obra: nova.custoMaoDeObra,
        custo_total: nova.custoTotal,
        custo_unitario: nova.custoUnitario,
        mao_de_obra_escolha: nova.maoDeObraEscolha,
        mao_de_obra_valor: nova.maoDeObraValor,
        observacoes: nova.observacoes
      };

      const { data, error } = await supabase.from('producoes').insert([payload]).select().single();
      if (error) {
        const offlineItem: ProductionOrder = { ...nova, id: crypto.randomUUID() };
        addToLocalCache('producoes', offlineItem);
        return offlineItem;
      }

      const created: ProductionOrder = {
        id: data.id,
        numero: data.numero,
        data: data.data,
        produtoId: data.produto_id,
        quantidade: data.quantidade,
        impressoraId: data.impressora_id,
        operador: data.operador,
        status: data.status,
        custoFilamento: Number(data.custo_filamento),
        custoEnergia: Number(data.custo_energia),
        custoMaoDeObra: Number(data.custo_mao_de_obra),
        custoTotal: Number(data.custo_total),
        custoUnitario: Number(data.custo_unitario),
        maoDeObraEscolha: data.mao_de_obra_escolha,
        maoDeObraValor: Number(data.mao_de_obra_valor),
        observacoes: data.observacoes
      };

      addToLocalCache('producoes', created);
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['producoes'] }),
  });
}

export function useUpdateProducaoStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProductionOrder['status'] }) => {
      if (isValidUuid(id)) {
        await supabase.from('producoes').update({ status }).eq('id', id);
      }

      const current = getLocalCache<ProductionOrder>('producoes');
      const updated = current.map(item => item.id === id ? { ...item, status } : item);
      setLocalCache('producoes', updated);

      return { id, status };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['producoes'] }),
  });
}

export function useConcluirProducao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, filamentoId, quantidadeGramas }: { id: string; filamentoId: string; quantidadeGramas: number }) => {
      const { data, error } = await supabase.rpc('concluir_producao', {
        p_producao_id: id,
        p_filamento_id: filamentoId,
        p_quantidade_gramas: quantidadeGramas,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['producoes'] });
      queryClient.invalidateQueries({ queryKey: ['filamentos'] });
    },
  });
}

// Compatibility wrapper while consumers are migrated to status-only updates.
export function useUpdateProducao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (producao: ProductionOrder) => {
      if (isValidUuid(producao.id)) {
        const { error } = await supabase.from('producoes').update({
          status: producao.status,
          custo_unitario: producao.custoUnitario,
        }).eq('id', producao.id);
        if (error) throw error;
      }
      addToLocalCache('producoes', producao);
      return producao;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['producoes'] }),
  });
}
