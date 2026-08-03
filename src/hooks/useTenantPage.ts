import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getActiveTenantId, getTenantQueryKey } from '../utils/storage';

export type PageRequest = { page?: number; pageSize?: number; orderBy?: string; ascending?: boolean; search?: string; searchColumn?: string; filters?: Record<string, string | number | boolean | null> };
export type PageResult<T> = { rows: T[]; total: number; page: number; pageSize: number; pageCount: number };

/** Consulta paginada e filtrada no Supabase; use nas telas de listagem sem carregar o tenant inteiro. */
export function useTenantPage<T>(table: string, request: PageRequest = {}) {
  const page = Math.max(0, request.page ?? 0);
  const pageSize = Math.min(100, Math.max(10, request.pageSize ?? 25));
  return useQuery({
    queryKey: [...getTenantQueryKey(table), 'page', page, pageSize, request.orderBy, request.ascending, request.search, request.searchColumn, request.filters],
    queryFn: async (): Promise<PageResult<T>> => {
      let query = supabase.from(table).select('*', { count: 'exact' }).eq('empresa_id', getActiveTenantId());
      for (const [column, value] of Object.entries(request.filters || {})) query = query.eq(column, value);
      if (request.search && request.searchColumn) query = query.ilike(request.searchColumn, `%${request.search}%`);
      const { data, count, error } = await query.order(request.orderBy || 'created_at', { ascending: request.ascending ?? false }).range(page * pageSize, page * pageSize + pageSize - 1);
      if (error) throw error;
      const total = count || 0;
      return { rows: (data || []) as T[], total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
    },
    staleTime: 30_000,
  });
}
