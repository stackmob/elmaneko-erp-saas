import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Printer, EnergyTariff } from '../../types';
import { 
  getLocalCache, setLocalCache, addToLocalCache, removeFromLocalCache, isValidUuid, getActiveTenantId
} from '../../utils/storage';

// IMPRESSORAS 3D
export function useImpressoras() {
  return useQuery({
    queryKey: ['impressoras'],
    queryFn: async () => {
      const { data, error } = await supabase.from('impressoras').select('*').eq('empresa_id', getActiveTenantId()).order('created_at', { ascending: false });
      if (error || !data) return getLocalCache<Printer>('impressoras');

      const mapped: Printer[] = data.map(item => ({
        id: item.id,
        nome: item.nome,
        marca: item.marca,
        modelo: item.modelo,
        potenciaWatts: Number(item.potencia_watts),
        status: item.status as Printer['status']
      }));

      setLocalCache('impressoras', mapped);
      return mapped;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddImpressora() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nova: Omit<Printer, 'id'>) => {
      const empresaId = getActiveTenantId();
      const payload = {
        empresa_id: empresaId,
        nome: nova.nome,
        marca: nova.marca,
        modelo: nova.modelo,
        potencia_watts: nova.potenciaWatts,
        status: nova.status
      };

      const { data, error } = await supabase.from('impressoras').insert([payload]).select().single();
      if (error) {
        const offlineItem: Printer = { ...nova, id: crypto.randomUUID() };
        addToLocalCache('impressoras', offlineItem);
        return offlineItem;
      }

      const created: Printer = {
        id: data.id,
        nome: data.nome,
        marca: data.marca,
        modelo: data.modelo,
        potenciaWatts: Number(data.potencia_watts),
        status: data.status
      };

      addToLocalCache('impressoras', created);
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impressoras'] }),
  });
}

export function useUpdateImpressora() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (printer: Printer) => {
      const empresaId = getActiveTenantId();
      const payload = {
        nome: printer.nome,
        marca: printer.marca,
        modelo: printer.modelo,
        potencia_watts: printer.potenciaWatts,
        status: printer.status
      };

      if (isValidUuid(printer.id)) {
        await supabase.from('impressoras').update(payload).eq('id', printer.id).eq('empresa_id', empresaId);
      }

      addToLocalCache('impressoras', printer);
      return printer;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impressoras'] }),
  });
}

export function useDeleteImpressora() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const empresaId = getActiveTenantId();
      if (isValidUuid(id)) {
        await supabase.from('impressoras').delete().eq('id', id).eq('empresa_id', empresaId);
      }
      removeFromLocalCache('impressoras', id);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impressoras'] }),
  });
}

// TARIFAS DE ENERGIA
export function useTarifasEnergia() {
  return useQuery({
    queryKey: ['tarifas_energia'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tarifas_energia').select('*').eq('empresa_id', getActiveTenantId()).order('data_inicio_vigencia', { ascending: false });
      if (error || !data) return getLocalCache<EnergyTariff>('tarifas_energia');

      const mapped: EnergyTariff[] = data.map(item => ({
        id: item.id,
        dataInicio: item.data_inicio_vigencia,
        valorKwh: Number(item.valor_kwh)
      }));

      setLocalCache('tarifas_energia', mapped);
      return mapped;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddTarifaEnergia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nova: Omit<EnergyTariff, 'id'>) => {
      const empresaId = getActiveTenantId();
      const payload = {
        empresa_id: empresaId,
        data_inicio_vigencia: nova.dataInicio,
        valor_kwh: nova.valorKwh
      };

      const { data, error } = await supabase.from('tarifas_energia').insert([payload]).select().single();
      if (error) {
        const offlineItem: EnergyTariff = { ...nova, id: crypto.randomUUID() };
        addToLocalCache('tarifas_energia', offlineItem);
        return offlineItem;
      }

      const created: EnergyTariff = {
        id: data.id,
        dataInicio: data.data_inicio_vigencia,
        valorKwh: Number(data.valor_kwh)
      };

      addToLocalCache('tarifas_energia', created);
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tarifas_energia'] }),
  });
}
