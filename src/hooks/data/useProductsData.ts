import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Product, ProductionOrder } from '../../types';
import { 
  getLocalCache, setLocalCache, addToLocalCache, removeFromLocalCache, isValidUuid, getActiveTenantId
} from '../../utils/storage';

// PRODUTOS & BOM
export function useProdutos() {
  return useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const empresaId = getActiveTenantId();
      const { data: prods, error: pErr } = await supabase.from('produtos').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false });
      if (pErr || !prods) return getLocalCache<Product>('produtos');

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
      const payload = {
        empresa_id: empresaId,
        nome: novo.nome,
        categoria: novo.categoria,
        descricao: novo.descricao,
        imagem: novo.imagem,
        tempo_impressao: novo.tempoImpressao,
        impressora_padrao_id: isValidUuid(novo.impressoraPadraoId) ? novo.impressoraPadraoId : null,
        tempo_acabamento: novo.tempoAcabamento,
        valor_mao_de_obra: novo.valorMaoDeObra,
        margem_lucro: novo.margemLucro,
        over_percent: novo.overPercent,
        preco_venda: novo.precoVenda,
        pdf_projeto: novo.pdfProjeto,
        pdf_projeto_nome: novo.pdfProjetoNome,
        link_projeto: novo.linkProjeto,
        outras_despesas: novo.outrasDespesas,
        observacoes: novo.observacoes
      };

      const { data: prodData, error } = await supabase.from('produtos').insert([payload]).select().single();
      if (error) {
        const offlineItem: Product = { ...novo, id: crypto.randomUUID() };
        addToLocalCache('produtos', offlineItem);
        return offlineItem;
      }

      if (novo.materials && novo.materials.length > 0) {
        const matPayloads = novo.materials.map(m => ({
          empresa_id: empresaId,
          produto_id: prodData.id,
          tipo_filamento: m.tipoFilamento,
          quantidade_grams: m.quantidadeGrams,
          filamento_id: m.filamentoId || 'any'
        }));
        await supabase.from('produto_materiais').insert(matPayloads);
      }

      const created: Product = {
        ...novo,
        id: prodData.id
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
      const payload = {
        nome: produto.nome,
        categoria: produto.categoria,
        descricao: produto.descricao,
        imagem: produto.imagem,
        tempo_impressao: produto.tempoImpressao,
        impressora_padrao_id: isValidUuid(produto.impressoraPadraoId) ? produto.impressoraPadraoId : null,
        tempo_acabamento: produto.tempoAcabamento,
        valor_mao_de_obra: produto.valorMaoDeObra,
        margem_lucro: produto.margemLucro,
        over_percent: produto.overPercent,
        preco_venda: produto.precoVenda,
        pdf_projeto: produto.pdfProjeto,
        pdf_projeto_nome: produto.pdfProjetoNome,
        link_projeto: produto.linkProjeto,
        outras_despesas: produto.outrasDespesas,
        observacoes: produto.observacoes
      };

      if (isValidUuid(produto.id)) {
        await supabase.from('produtos').update(payload).eq('id', produto.id);
        await supabase.from('produto_materiais').delete().eq('produto_id', produto.id);

        if (produto.materials && produto.materials.length > 0) {
          const empresaId = getActiveTenantId();
          const matPayloads = produto.materials.map(m => ({
            empresa_id: empresaId,
            produto_id: produto.id,
            tipo_filamento: m.tipoFilamento,
            quantidade_grams: m.quantidadeGrams,
            filamento_id: m.filamentoId || 'any'
          }));
          await supabase.from('produto_materiais').insert(matPayloads);
        }
      }

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
    queryKey: ['producoes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('producoes').select('*').eq('empresa_id', getActiveTenantId()).order('created_at', { ascending: false });
      if (error || !data) return getLocalCache<ProductionOrder>('producoes');

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
