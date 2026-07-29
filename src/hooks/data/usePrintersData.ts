import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Printer, EnergyTariff } from '../../types';
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

export function usePrintersData() {
  const queryClient = useQueryClient();

  // IMPRESSORAS 3D
  const useImpressoras = () => {
    return useQuery({
      queryKey: ['impressoras'],
      queryFn: async () => {
        const { data, error } = await supabase.from('impressoras').select('*').order('created_at', { ascending: false });
        if (error || !data) return getLocalCache<Printer>('impressoras');

        const mapped: Printer[] = data.map(item => ({
          id: item.id,
          nome: item.nome,
          marca: item.marca,
          modelo: item.modelo,
          potenciaWatts: Number(item.potencia_watts),
          status: item.status as any
        }));

        setLocalCache('impressoras', mapped);
        return mapped;
      },
      staleTime: 1000 * 60 * 5,
    });
  };

  const useAddImpressora = () => {
    return useMutation({
      mutationFn: async (nova: Omit<Printer, 'id'>) => {
        const empresaId = getFallbackEmpresaId();
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
  };

  const useUpdateImpressora = () => {
    return useMutation({
      mutationFn: async (printer: Printer) => {
        const payload = {
          nome: printer.nome,
          marca: printer.marca,
          modelo: printer.modelo,
          potencia_watts: printer.potenciaWatts,
          status: printer.status
        };

        if (isValidUuid(printer.id)) {
          await supabase.from('impressoras').update(payload).eq('id', printer.id);
        }

        addToLocalCache('impressoras', printer);
        return printer;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impressoras'] }),
    });
  };

  const useDeleteImpressora = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        if (isValidUuid(id)) {
          await supabase.from('impressoras').delete().eq('id', id);
        }
        removeFromLocalCache('impressoras', id);
        return id;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impressoras'] }),
    });
  };

  // TARIFAS DE ENERGIA
  const useTarifasEnergia = () => {
    return useQuery({
      queryKey: ['tarifas_energia'],
      queryFn: async () => {
        const { data, error } = await supabase.from('tarifas_energia').select('*').order('data_inicio_vigencia', { ascending: false });
        if (error || !data) return getLocalCache<EnergyTariff>('tarifas_energia');

        const mapped: EnergyTariff[] = data.map(item => ({
          id: item.id,
          dataInicioVigencia: item.data_inicio_vigencia,
          valorKwh: Number(item.valor_kwh)
        }));

        setLocalCache('tarifas_energia', mapped);
        return mapped;
      },
      staleTime: 1000 * 60 * 5,
    });
  };

  const useAddTarifaEnergia = () => {
    return useMutation({
      mutationFn: async (nova: Omit<EnergyTariff, 'id'>) => {
        const empresaId = getFallbackEmpresaId();
        const payload = {
          empresa_id: empresaId,
          data_inicio_vigencia: nova.dataInicioVigencia,
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
          dataInicioVigencia: data.data_inicio_vigencia,
          valorKwh: Number(data.valor_kwh)
        };

        addToLocalCache('tarifas_energia', created);
        return created;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tarifas_energia'] }),
    });
  };

  return {
    useImpressoras,
    useAddImpressora,
    useUpdateImpressora,
    useDeleteImpressora,
    useTarifasEnergia,
    useAddTarifaEnergia,
  };
}
