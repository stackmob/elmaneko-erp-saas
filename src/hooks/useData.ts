import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Filament, Purchase, Printer, EnergyTariff, Product, ProductionOrder, Budget, Sale, Client } from '../types';

const DEFAULT_DEMO_EMPRESA_ID = "00000000-0000-0000-0000-000000000001";

const getFallbackEmpresaId = (): string => {
  try {
    return localStorage.getItem('elmaneko_empresa_id') || DEFAULT_DEMO_EMPRESA_ID;
  } catch (e) {
    return DEFAULT_DEMO_EMPRESA_ID;
  }
};

// Helper para validar UUID v4 do PostgreSQL
const isValidUuid = (id?: string): boolean => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

// ============================================================================
// LOCAL STORAGE CACHE HELPERS (Resiliência & Fallback Offline/RLS)
// ============================================================================
const getLocalCache = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(`elmaneko_cache_${key}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const setLocalCache = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(`elmaneko_cache_${key}`, JSON.stringify(data));
  } catch (e) {}
};

const addToLocalCache = <T extends { id: string }>(key: string, item: T): void => {
  const current = getLocalCache<T>(key);
  const exists = current.findIndex(i => i.id === item.id);
  let updated: T[];
  if (exists >= 0) {
    updated = [...current];
    updated[exists] = item;
  } else {
    updated = [item, ...current];
  }
  setLocalCache(key, updated);
};

const removeFromLocalCache = <T extends { id: string }>(key: string, id: string): void => {
  const current = getLocalCache<T>(key);
  const updated = current.filter(i => i.id !== id);
  setLocalCache(key, updated);
};

// ============================================================================
// MAPPERS: Frontend (camelCase) <-> Supabase PostgreSQL (snake_case)
// ============================================================================

// 1. FILAMENTOS
const mapFilamentoFromDB = (row: any): Filament => ({
  id: row.id,
  nome: row.nome,
  tipo: row.tipo,
  marca: row.marca,
  cor: row.cor,
  pesoTotal: Number(row.peso_total || 0),
  quantidadeDisponivel: Number(row.quantidade_disponivel || 0),
  valorCompra: Number(row.valor_compra || 0),
  dataCompra: row.data_compra || '',
  fornecedor: row.fornecedor || '',
  observacoes: row.observacoes || ''
});

const mapFilamentoToDB = (f: Partial<Filament>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    nome: f.nome,
    tipo: f.tipo,
    marca: f.marca,
    cor: f.cor,
    peso_total: Number(f.pesoTotal),
    quantidade_disponivel: Number(f.quantidadeDisponivel),
    valor_compra: Number(f.valorCompra),
    data_compra: f.dataCompra,
    fornecedor: f.fornecedor,
    observacoes: f.observacoes || null
  };
  if (isValidUuid(f.id)) {
    payload.id = f.id;
  }
  return payload;
};

// 2. CLIENTES
const mapClienteFromDB = (row: any): Client => ({
  id: row.id,
  nome: row.nome,
  cpfCnpj: row.cpf_cnpj || '',
  telefone: row.telefone || '',
  whatsapp: row.whatsapp || '',
  email: row.email || '',
  endereco: row.endereco || '',
  observacoes: row.observacoes || ''
});

const mapClienteToDB = (c: Partial<Client>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    nome: c.nome,
    cpf_cnpj: c.cpfCnpj || null,
    telefone: c.telefone || c.whatsapp || null,
    whatsapp: c.whatsapp || null,
    email: c.email || null,
    endereco: c.endereco || null,
    observacoes: c.observacoes || null
  };
  if (isValidUuid(c.id)) {
    payload.id = c.id;
  }
  return payload;
};

// 3. COMPRAS
const mapCompraFromDB = (row: any): Purchase => ({
  id: row.id,
  data: row.data,
  fornecedor: row.fornecedor,
  filamentoId: row.filamento_id,
  quantidadeAdquirida: Number(row.quantidade_adquirida || 0),
  valorPago: Number(row.valor_pago || 0),
  notaFiscal: row.nota_fiscal || '',
  observacoes: row.observacoes || ''
});

const mapCompraToDB = (p: Partial<Purchase>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    data: p.data,
    fornecedor: p.fornecedor,
    filamento_id: p.filamentoId,
    quantidade_adquirida: Number(p.quantidadeAdquirida),
    valor_pago: Number(p.valorPago),
    nota_fiscal: p.notaFiscal || null,
    observacoes: p.observacoes || null
  };
  if (isValidUuid(p.id)) {
    payload.id = p.id;
  }
  return payload;
};

// 4. IMPRESSORAS
const mapPrinterFromDB = (row: any): Printer => ({
  id: row.id,
  nome: row.nome,
  marca: row.marca,
  modelo: row.modelo,
  potenciaWatts: Number(row.potencia_watts || 0),
  status: row.status
});

const mapPrinterToDB = (p: Partial<Printer>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    nome: p.nome,
    marca: p.marca,
    modelo: p.modelo,
    potencia_watts: Number(p.potenciaWatts),
    status: p.status
  };
  if (isValidUuid(p.id)) {
    payload.id = p.id;
  }
  return payload;
};

// 5. TARIFAS
const mapTariffFromDB = (row: any): EnergyTariff => ({
  id: row.id,
  dataInicio: row.data_inicio_vigencia || row.data_inicio || '',
  valorKwh: Number(row.valor_kwh || 0)
});

const mapTariffToDB = (t: Partial<EnergyTariff>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    data_inicio_vigencia: t.dataInicio,
    valor_kwh: Number(t.valorKwh)
  };
  if (isValidUuid(t.id)) {
    payload.id = t.id;
  }
  return payload;
};

// 6. PRODUTOS — CR-03: materials carregados via JOIN com produto_materiais
const mapProductFromDB = (row: any): Product => ({
  id: row.id,
  nome: row.nome,
  categoria: row.categoria,
  descricao: row.descricao || '',
  imagem: row.imagem || '',
  tempoImpressao: Number(row.tempo_impressao || 0),
  impressoraPadraoId: row.impressora_padrao_id || '',
  tempoAcabamento: Number(row.tempo_acabamento || 0),
  valorMaoDeObra: Number(row.valor_mao_de_obra || 0),
  observacoes: row.observacoes || '',
  // Carregado via JOIN com tabela produto_materiais
  materials: (row.produto_materiais || []).map((m: any) => ({
    tipoFilamento: m.tipo_filamento,
    filamentoId: m.filamento_id,
    quantidadeGrams: Number(m.quantidade_grams || 0)
  }))
});

const mapProductToDB = (p: Partial<Product>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    nome: p.nome,
    categoria: p.categoria,
    descricao: p.descricao || null,
    imagem: p.imagem || null,
    tempo_impressao: Number(p.tempoImpressao || 0),
    impressora_padrao_id: isValidUuid(p.impressoraPadraoId) ? p.impressoraPadraoId : null,
    tempo_acabamento: Number(p.tempoAcabamento || 0),
    valor_mao_de_obra: Number(p.valorMaoDeObra || 0),
    observacoes: p.observacoes || null
  };
  if (isValidUuid(p.id)) {
    payload.id = p.id;
  }
  return payload;
};

// 7. VENDAS
const mapSaleFromDB = (row: any): Sale => ({
  id: row.id,
  numero: row.id,
  clienteId: row.cliente_id,
  dataVenda: row.data,
  itens: [],
  valorTotal: Number(row.valor_total || 0),
  formaPagamento: row.forma_pagamento,
  statusPagamento: row.status,
  orcamentoOrigemId: row.orcamento_origem_id
});

const mapSaleToDB = (s: Partial<Sale>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    cliente_id: s.clienteId,
    data: s.dataVenda,
    valor_total: Number(s.valorTotal),
    forma_pagamento: s.formaPagamento,
    status: s.statusPagamento,
    orcamento_origem_id: isValidUuid(s.orcamentoOrigemId) ? s.orcamentoOrigemId : null
  };
  if (isValidUuid(s.id)) {
    payload.id = s.id;
  }
  return payload;
};

// 8. PRODUÇÕES
const mapProductionFromDB = (row: any): ProductionOrder => ({
  id: row.id,
  numero: row.numero,
  data: row.data,
  produtoId: row.produto_id,
  quantidade: Number(row.quantidade || 0),
  impressoraId: row.impressora_id,
  operador: row.operador || '',
  status: row.status,
  custoFilamento: Number(row.custo_filamento || 0),
  custoEnergia: Number(row.custo_energia || 0),
  custoMaoDeObra: Number(row.custo_mao_de_obra || 0),
  custoTotal: Number(row.custo_total || 0),
  custoUnitario: Number(row.custo_unitario || 0),
  maoDeObraEscolha: row.mao_de_obra_escolha || 'unitario',
  maoDeObraValor: Number(row.mao_de_obra_valor || 0),
  observacoes: row.observacoes || ''
});

const mapProductionToDB = (p: Partial<ProductionOrder>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    numero: p.numero,
    data: p.data,
    produto_id: isValidUuid(p.produtoId) ? p.produtoId : null,
    quantidade: Number(p.quantidade),
    impressora_id: isValidUuid(p.impressoraId) ? p.impressoraId : null,
    operador: p.operador || null,
    status: p.status,
    custo_filamento: Number(p.custoFilamento || 0),
    custo_energia: Number(p.custoEnergia || 0),
    custo_mao_de_obra: Number(p.custoMaoDeObra || 0),
    custo_total: Number(p.custoTotal || 0),
    custo_unitario: Number(p.custoUnitario || 0),
    mao_de_obra_escolha: p.maoDeObraEscolha || 'unitario',
    mao_de_obra_valor: Number(p.maoDeObraValor || 0),
    observacoes: p.observacoes || null
  };
  if (isValidUuid(p.id)) {
    payload.id = p.id;
  }
  return payload;
};

// 9. ORÇAMENTOS — CR-04: itens carregados via JOIN com orcamento_itens
const mapBudgetFromDB = (row: any): Budget => ({
  id: row.id,
  numero: row.numero,
  clienteId: row.cliente_id,
  dataEmissao: row.data_emissao,
  validade: row.validade,
  descontoGeral: Number(row.desconto_geral || 0),
  observacoes: row.observacoes || '',
  status: row.status,
  // Carregado via JOIN com tabela orcamento_itens
  itens: (row.orcamento_itens || []).map((item: any) => ({
    produtoId: item.produto_id,
    quantidade: Number(item.quantidade || 1),
    valorUnitario: Number(item.valor_unitario || 0),
    desconto: Number(item.desconto || 0)
  }))
});

const mapBudgetToDB = (b: Partial<Budget>, empresaId: string) => {
  const payload: any = {
    empresa_id: empresaId,
    numero: b.numero,
    cliente_id: isValidUuid(b.clienteId) ? b.clienteId : null,
    data_emissao: b.dataEmissao,
    validade: b.validade || null,
    desconto_geral: Number(b.descontoGeral || 0),
    observacoes: b.observacoes || null,
    status: b.status
  };
  if (isValidUuid(b.id)) {
    payload.id = b.id;
  }
  return payload;
};

// ============================================================================
// REACT QUERY HOOKS DA APLICAÇÃO
// ============================================================================

export const useData = () => {
  const { empresaId } = useAuth();
  const queryClient = useQueryClient();
  const activeTenant = empresaId || getFallbackEmpresaId();

  // --- FILAMENTOS ---
  const useFilamentos = () => useQuery({
    queryKey: ['filamentos', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('filamentos').select('*').eq('empresa_id', activeTenant);
        if (!error && data) {
          const dbItems = data.map(mapFilamentoFromDB);
          const localItems = getLocalCache<Filament>('filamentos');
          const mergedMap = new Map<string, Filament>();
          localItems.forEach(item => mergedMap.set(item.id, item));
          dbItems.forEach(item => mergedMap.set(item.id, item));
          const merged = Array.from(mergedMap.values());
          setLocalCache('filamentos', merged);
          return merged;
        }
      } catch (err) {
        console.warn('[useData] Usando cache local de filamentos:', err);
      }
      return getLocalCache<Filament>('filamentos');
    },
    enabled: true,
  });

  const useAddFilamento = () => useMutation({
    mutationFn: async (newFilamento: Filament) => {
      const payload = mapFilamentoToDB(newFilamento, activeTenant);
      let itemSalvo: Filament;

      try {
        const { data, error } = await supabase.from('filamentos').insert([payload]).select().single();
        if (!error && data) {
          itemSalvo = mapFilamentoFromDB(data);
        } else {
          console.warn('[useData] Gravação Supabase bloqueada, persistindo localmente:', error?.message);
          itemSalvo = { ...newFilamento, id: isValidUuid(newFilamento.id) ? newFilamento.id : crypto.randomUUID() };
        }
      } catch (err) {
        console.error('[useData] Exceção ao salvar filamento:', err);
        itemSalvo = { ...newFilamento, id: isValidUuid(newFilamento.id) ? newFilamento.id : crypto.randomUUID() };
      }

      addToLocalCache('filamentos', itemSalvo);
      queryClient.setQueryData(['filamentos', activeTenant], (old: Filament[] = []) => [itemSalvo, ...old.filter(f => f.id !== itemSalvo.id)]);
      return itemSalvo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filamentos', activeTenant] });
    },
  });

  const useUpdateFilamento = () => useMutation({
    mutationFn: async (filamento: Filament) => {
      const payload = mapFilamentoToDB(filamento, activeTenant);
      delete payload.empresa_id;
      let itemAtualizado: Filament = filamento;

      try {
        const { data, error } = await supabase.from('filamentos').update(payload).eq('id', filamento.id).select().single();
        if (!error && data) {
          itemAtualizado = mapFilamentoFromDB(data);
        } else {
          console.error('[useData] Erro ao atualizar filamento:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao atualizar filamento:', err);
      }

      addToLocalCache('filamentos', itemAtualizado);
      queryClient.setQueryData(['filamentos', activeTenant], (old: Filament[] = []) => old.map(f => f.id === itemAtualizado.id ? itemAtualizado : f));
      return itemAtualizado;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filamentos', activeTenant] });
    },
  });

  const useDeleteFilamento = () => useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('filamentos').delete().eq('id', id);
      } catch (err) {
        console.error('[useData] Exceção ao excluir filamento:', err);
      }
      removeFromLocalCache('filamentos', id);
      queryClient.setQueryData(['filamentos', activeTenant], (old: Filament[] = []) => old.filter(f => f.id !== id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filamentos', activeTenant] });
    },
  });

  // --- CLIENTES ---
  const useClientes = () => useQuery({
    queryKey: ['clientes', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('clientes').select('*').eq('empresa_id', activeTenant);
        if (!error && data) {
          const dbItems = data.map(mapClienteFromDB);
          const localItems = getLocalCache<Client>('clientes');
          const mergedMap = new Map<string, Client>();
          localItems.forEach(item => mergedMap.set(item.id, item));
          dbItems.forEach(item => mergedMap.set(item.id, item));
          const merged = Array.from(mergedMap.values());
          setLocalCache('clientes', merged);
          return merged;
        }
      } catch (err) {
        console.warn('[useData] Usando cache local de clientes:', err);
      }
      return getLocalCache<Client>('clientes');
    },
    enabled: true,
  });

  const useAddCliente = () => useMutation({
    mutationFn: async (client: Client) => {
      const payload = mapClienteToDB(client, activeTenant);
      let clienteSalvo: Client;

      try {
        const { data, error } = await supabase.from('clientes').insert([payload]).select().single();
        if (!error && data) {
          clienteSalvo = mapClienteFromDB(data);
        } else {
          console.warn('[useData] Gravação Supabase bloqueada, persistindo cliente localmente:', error?.message);
          clienteSalvo = { ...client, id: isValidUuid(client.id) ? client.id : crypto.randomUUID() };
        }
      } catch (err) {
        console.error('[useData] Exceção ao salvar cliente:', err);
        clienteSalvo = { ...client, id: isValidUuid(client.id) ? client.id : crypto.randomUUID() };
      }

      addToLocalCache('clientes', clienteSalvo);
      queryClient.setQueryData(['clientes', activeTenant], (old: Client[] = []) => [clienteSalvo, ...old.filter(c => c.id !== clienteSalvo.id)]);
      return clienteSalvo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', activeTenant] });
    },
  });

  const useUpdateCliente = () => useMutation({
    mutationFn: async (client: Client) => {
      const payload = mapClienteToDB(client, activeTenant);
      delete payload.empresa_id;
      let clienteAtualizado: Client = client;

      try {
        const { data, error } = await supabase.from('clientes').update(payload).eq('id', client.id).select().single();
        if (!error && data) {
          clienteAtualizado = mapClienteFromDB(data);
        } else {
          console.error('[useData] Erro ao atualizar cliente:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao atualizar cliente:', err);
      }

      addToLocalCache('clientes', clienteAtualizado);
      queryClient.setQueryData(['clientes', activeTenant], (old: Client[] = []) => old.map(c => c.id === clienteAtualizado.id ? clienteAtualizado : c));
      return clienteAtualizado;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', activeTenant] });
    },
  });

  const useDeleteCliente = () => useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('clientes').delete().eq('id', id);
      } catch (err) {
        console.error('[useData] Exceção ao excluir cliente:', err);
      }
      removeFromLocalCache('clientes', id);
      queryClient.setQueryData(['clientes', activeTenant], (old: Client[] = []) => old.filter(c => c.id !== id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', activeTenant] });
    },
  });

  // --- COMPRAS ---
  const useCompras = () => useQuery({
    queryKey: ['compras', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('compras').select('*').eq('empresa_id', activeTenant);
        if (!error && data) {
          return data.map(mapCompraFromDB);
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar compras:', err);
      }
      return getLocalCache<Purchase>('compras');
    },
    enabled: true,
  });

  const useAddCompra = () => useMutation({
    mutationFn: async (newCompra: Purchase) => {
      const payload = mapCompraToDB(newCompra, activeTenant);
      let itemSalvo: Purchase = newCompra;
      try {
        const { data, error } = await supabase.from('compras').insert([payload]).select().single();
        if (!error && data) {
          itemSalvo = mapCompraFromDB(data);
        } else {
          console.error('[useData] Erro ao salvar compra:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao salvar compra:', err);
      }
      addToLocalCache('compras', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras', activeTenant] });
      queryClient.invalidateQueries({ queryKey: ['filamentos', activeTenant] });
    },
  });

  // --- IMPRESSORAS ---
  const useImpressoras = () => useQuery({
    queryKey: ['impressoras', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('impressoras').select('*').eq('empresa_id', activeTenant);
        if (!error && data) {
          const mapped = data.map(mapPrinterFromDB);
          setLocalCache('impressoras', mapped);
          return mapped;
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar impressoras:', err);
      }
      return getLocalCache<Printer>('impressoras');
    },
    enabled: true,
  });

  const useAddImpressora = () => useMutation({
    mutationFn: async (printer: Printer) => {
      const payload = mapPrinterToDB(printer, activeTenant);
      let itemSalvo: Printer = printer;
      try {
        const { data, error } = await supabase.from('impressoras').insert([payload]).select().single();
        if (!error && data) {
          itemSalvo = mapPrinterFromDB(data);
        } else {
          console.error('[useData] Erro ao salvar impressora:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao salvar impressora:', err);
      }
      addToLocalCache('impressoras', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impressoras', activeTenant] }),
  });

  const useUpdateImpressora = () => useMutation({
    mutationFn: async (printer: Printer) => {
      const payload = mapPrinterToDB(printer, activeTenant);
      delete payload.empresa_id;
      let itemSalvo: Printer = printer;
      try {
        const { data, error } = await supabase.from('impressoras').update(payload).eq('id', printer.id).select().single();
        if (!error && data) {
          itemSalvo = mapPrinterFromDB(data);
        } else {
          console.error('[useData] Erro ao atualizar impressora:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao atualizar impressora:', err);
      }
      addToLocalCache('impressoras', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impressoras', activeTenant] }),
  });

  const useDeleteImpressora = () => useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('impressoras').delete().eq('id', id);
      } catch (err) {
        console.error('[useData] Exceção ao excluir impressora:', err);
      }
      removeFromLocalCache('impressoras', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impressoras', activeTenant] }),
  });

  // --- TARIFAS ---
  const useTarifas = () => useQuery({
    queryKey: ['tarifas', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('tarifas_energia').select('*').eq('empresa_id', activeTenant);
        if (!error && data) {
          return data.map(mapTariffFromDB);
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar tarifas:', err);
      }
      return getLocalCache<EnergyTariff>('tarifas');
    },
    enabled: true,
  });

  const useAddTarifa = () => useMutation({
    mutationFn: async (tarifa: EnergyTariff) => {
      const payload = mapTariffToDB(tarifa, activeTenant);
      let itemSalvo: EnergyTariff = tarifa;
      try {
        const { data, error } = await supabase.from('tarifas_energia').insert([payload]).select().single();
        if (!error && data) {
          itemSalvo = mapTariffFromDB(data);
        } else {
          console.error('[useData] Erro ao salvar tarifa:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao salvar tarifa:', err);
      }
      addToLocalCache('tarifas', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tarifas', activeTenant] }),
  });

  // --- PRODUTOS — CR-03: Query com JOIN em produto_materiais ---
  const useProdutos = () => useQuery({
    queryKey: ['produtos', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('produtos')
          .select('*, produto_materiais(*)')
          .eq('empresa_id', activeTenant);
        if (!error && data) {
          const mapped = data.map(mapProductFromDB);
          setLocalCache('produtos', mapped);
          return mapped;
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar produtos:', err);
      }
      return getLocalCache<Product>('produtos');
    },
    enabled: true,
  });

  const useAddProduto = () => useMutation({
    mutationFn: async (produto: Product) => {
      const payload = mapProductToDB(produto, activeTenant);
      let itemSalvo: Product = produto;
      try {
        const { data, error } = await supabase.from('produtos').insert([payload]).select().single();
        if (!error && data) {
          // Inserir materiais da BOM na tabela relacional
          if (produto.materials && produto.materials.length > 0) {
            const materialsPayload = produto.materials.map(m => ({
              empresa_id: activeTenant,
              produto_id: data.id,
              tipo_filamento: m.tipoFilamento,
              filamento_id: m.filamentoId,
              quantidade_grams: m.quantidadeGrams
            }));
            const { error: matErr } = await supabase.from('produto_materiais').insert(materialsPayload);
            if (matErr) console.error('[useData] Erro ao inserir BOM:', matErr.message);
          }
          itemSalvo = { ...mapProductFromDB(data), materials: produto.materials };
        } else {
          console.error('[useData] Erro ao salvar produto:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao salvar produto:', err);
      }
      addToLocalCache('produtos', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos', activeTenant] }),
  });

  const useUpdateProduto = () => useMutation({
    mutationFn: async (produto: Product) => {
      const payload = mapProductToDB(produto, activeTenant);
      delete payload.empresa_id;
      let itemSalvo: Product = produto;
      try {
        const { data, error } = await supabase.from('produtos').update(payload).eq('id', produto.id).select().single();
        if (!error && data) {
          // Deletar BOM antiga e reinserir
          await supabase.from('produto_materiais').delete().eq('produto_id', produto.id);
          if (produto.materials && produto.materials.length > 0) {
            const materialsPayload = produto.materials.map(m => ({
              empresa_id: activeTenant,
              produto_id: produto.id,
              tipo_filamento: m.tipoFilamento,
              filamento_id: m.filamentoId,
              quantidade_grams: m.quantidadeGrams
            }));
            const { error: matErr } = await supabase.from('produto_materiais').insert(materialsPayload);
            if (matErr) console.error('[useData] Erro ao atualizar BOM:', matErr.message);
          }
          itemSalvo = { ...mapProductFromDB(data), materials: produto.materials };
        } else {
          console.error('[useData] Erro ao atualizar produto:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao atualizar produto:', err);
      }
      addToLocalCache('produtos', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos', activeTenant] }),
  });

  const useDeleteProduto = () => useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('produtos').delete().eq('id', id);
      } catch (err) {
        console.error('[useData] Exceção ao excluir produto:', err);
      }
      removeFromLocalCache('produtos', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos', activeTenant] }),
  });

  // --- VENDAS ---
  const useVendas = () => useQuery({
    queryKey: ['vendas', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('vendas').select('*').eq('empresa_id', activeTenant);
        if (!error && data) {
          return data.map(mapSaleFromDB);
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar vendas:', err);
      }
      return getLocalCache<Sale>('vendas');
    },
    enabled: true,
  });

  const useAddVenda = () => useMutation({
    mutationFn: async (venda: Sale) => {
      const payload = mapSaleToDB(venda, activeTenant);
      let itemSalvo: Sale = venda;
      try {
        const { data, error } = await supabase.from('vendas').insert([payload]).select().single();
        if (!error && data) {
          itemSalvo = mapSaleFromDB(data);
        } else {
          console.error('[useData] Erro ao salvar venda:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao salvar venda:', err);
      }
      addToLocalCache('vendas', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendas', activeTenant] }),
  });

  const useUpdateVenda = () => useMutation({
    mutationFn: async (venda: Sale) => {
      const payload = mapSaleToDB(venda, activeTenant);
      delete payload.empresa_id;
      let itemSalvo: Sale = venda;
      try {
        const { data, error } = await supabase.from('vendas').update(payload).eq('id', venda.id).select().single();
        if (!error && data) {
          itemSalvo = mapSaleFromDB(data);
        } else {
          console.error('[useData] Erro ao atualizar venda:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao atualizar venda:', err);
      }
      addToLocalCache('vendas', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendas', activeTenant] }),
  });

  // --- PRODUÇÕES ---
  const useProducoes = () => useQuery({
    queryKey: ['producoes', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('producoes').select('*').eq('empresa_id', activeTenant);
        if (!error && data) {
          return data.map(mapProductionFromDB);
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar produções:', err);
      }
      return getLocalCache<ProductionOrder>('producoes');
    },
    enabled: true,
  });

  const useAddProducao = () => useMutation({
    mutationFn: async (producao: ProductionOrder) => {
      const payload = mapProductionToDB(producao, activeTenant);
      let itemSalvo: ProductionOrder = producao;
      try {
        const { data, error } = await supabase.from('producoes').insert([payload]).select().single();
        if (!error && data) {
          itemSalvo = mapProductionFromDB(data);
        } else {
          console.error('[useData] Erro ao salvar produção:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao salvar produção:', err);
      }
      addToLocalCache('producoes', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['producoes', activeTenant] }),
  });

  const useUpdateProducao = () => useMutation({
    mutationFn: async (producao: ProductionOrder) => {
      const payload = mapProductionToDB(producao, activeTenant);
      delete payload.empresa_id;
      let itemSalvo: ProductionOrder = producao;
      try {
        const { data, error } = await supabase.from('producoes').update(payload).eq('id', producao.id).select().single();
        if (!error && data) {
          itemSalvo = mapProductionFromDB(data);
        } else {
          console.error('[useData] Erro ao atualizar produção:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao atualizar produção:', err);
      }
      addToLocalCache('producoes', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['producoes', activeTenant] }),
  });

  // --- ORÇAMENTOS — CR-04: Query com JOIN em orcamento_itens ---
  const useOrcamentos = () => useQuery({
    queryKey: ['orcamentos', activeTenant],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('orcamentos')
          .select('*, orcamento_itens(*)')
          .eq('empresa_id', activeTenant);
        if (!error && data) {
          return data.map(mapBudgetFromDB);
        }
      } catch (err) {
        console.error('[useData] Exceção ao buscar orçamentos:', err);
      }
      return getLocalCache<Budget>('orcamentos');
    },
    enabled: true,
  });

  const useAddOrcamento = () => useMutation({
    mutationFn: async (orcamento: Budget) => {
      const payload = mapBudgetToDB(orcamento, activeTenant);
      let itemSalvo: Budget = orcamento;
      try {
        const { data, error } = await supabase.from('orcamentos').insert([payload]).select().single();
        if (!error && data) {
          // Inserir itens do orçamento na tabela relacional
          if (orcamento.itens && orcamento.itens.length > 0) {
            const itemsPayload = orcamento.itens.map(it => ({
              empresa_id: activeTenant,
              orcamento_id: data.id,
              produto_id: it.produtoId,
              quantidade: it.quantidade,
              valor_unitario: it.valorUnitario,
              desconto: it.desconto
            }));
            const { error: itemErr } = await supabase.from('orcamento_itens').insert(itemsPayload);
            if (itemErr) console.error('[useData] Erro ao inserir itens do orçamento:', itemErr.message);
          }
          itemSalvo = { ...mapBudgetFromDB(data), itens: orcamento.itens };
        } else {
          console.error('[useData] Erro ao salvar orçamento:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao salvar orçamento:', err);
      }
      addToLocalCache('orcamentos', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orcamentos', activeTenant] }),
  });

  const useUpdateOrcamento = () => useMutation({
    mutationFn: async (orcamento: Budget) => {
      const payload = mapBudgetToDB(orcamento, activeTenant);
      delete payload.empresa_id;
      let itemSalvo: Budget = orcamento;
      try {
        const { data, error } = await supabase.from('orcamentos').update(payload).eq('id', orcamento.id).select().single();
        if (!error && data) {
          // Deletar itens antigos e reinserir
          await supabase.from('orcamento_itens').delete().eq('orcamento_id', orcamento.id);
          if (orcamento.itens && orcamento.itens.length > 0) {
            const itemsPayload = orcamento.itens.map(it => ({
              empresa_id: activeTenant,
              orcamento_id: orcamento.id,
              produto_id: it.produtoId,
              quantidade: it.quantidade,
              valor_unitario: it.valorUnitario,
              desconto: it.desconto
            }));
            const { error: itemErr } = await supabase.from('orcamento_itens').insert(itemsPayload);
            if (itemErr) console.error('[useData] Erro ao atualizar itens do orçamento:', itemErr.message);
          }
          itemSalvo = { ...mapBudgetFromDB(data), itens: orcamento.itens };
        } else {
          console.error('[useData] Erro ao atualizar orçamento:', error?.message);
        }
      } catch (err) {
        console.error('[useData] Exceção ao atualizar orçamento:', err);
      }
      addToLocalCache('orcamentos', itemSalvo);
      return itemSalvo;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orcamentos', activeTenant] }),
  });

  const useDeleteOrcamento = () => useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('orcamentos').delete().eq('id', id);
      } catch (err) {
        console.error('[useData] Exceção ao excluir orçamento:', err);
      }
      removeFromLocalCache('orcamentos', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orcamentos', activeTenant] }),
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
