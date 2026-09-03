/**
 * Storage & Local Cache Utilities for Elmaneko 3D ERP
 */

export interface SyncQueueItem<T = Record<string, unknown>> {
  id: string;
  empresaId: string;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: T;
  timestamp: string;
}

export const getActiveTenantId = (): string => {
  try {
    const id = typeof localStorage !== 'undefined' ? localStorage.getItem('elmaneko_empresa_id') : null;
    if (id) return id;
  } catch (e) {}
  throw new Error('Nenhuma empresa ativa selecionada para a sessão atual.');
};

export const getActiveEmpresaId = getActiveTenantId;

/** Safe for render-time cache keys; mutations and requests must use getActiveTenantId. */
export const getTenantQueryKey = (resource: string): [string, string] => {
  try {
    const id = typeof localStorage !== 'undefined' ? localStorage.getItem('elmaneko_empresa_id') : null;
    return [resource, id || 'no-active-tenant'];
  } catch {
    return [resource, 'no-active-tenant'];
  }
};

export const getEmpresaPrefix = (empresaId?: string): string => {
  let empId = empresaId;
  if (!empId) {
    try {
      empId = (typeof localStorage !== 'undefined' ? localStorage.getItem('elmaneko_empresa_id') : null) || undefined;
    } catch (e) {}
  }
  const safeId = empId || 'no_tenant';
  return `elmaneko_cache_${safeId}_`;
};

export const getLocalCache = <T>(key: string, empresaId?: string): T[] => {
  try {
    const prefix = getEmpresaPrefix(empresaId);
    const data = localStorage.getItem(`${prefix}${key}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const setLocalCache = <T>(key: string, data: T[], empresaId?: string): void => {
  try {
    const prefix = getEmpresaPrefix(empresaId);
    let payload = data;
    if (key === 'produtos' && Array.isArray(data)) {
      payload = data.map((item: any) => {
        if (!item || typeof item !== 'object') return item;
        const copy = { ...item };
        // Remove strings massivas em base64 que estouram a cota de 5MB do localStorage
        delete copy.pdfProjeto;
        if (typeof copy.imagem === 'string' && copy.imagem.length > 80000) {
          delete copy.imagem;
        }
        return copy;
      }) as unknown as T[];
    }
    localStorage.setItem(`${prefix}${key}`, JSON.stringify(payload));
  } catch (e) {
    console.warn(`[LocalCache] Erro de cota ao persistir cache para ${key}:`, e);
  }
};

export const addToLocalCache = <T extends { id: string }>(key: string, item: T, empresaId?: string): void => {
  const current = getLocalCache<T>(key, empresaId);
  const exists = current.findIndex(i => i.id === item.id);
  let updated: T[];
  if (exists >= 0) {
    updated = [...current];
    updated[exists] = item;
  } else {
    updated = [item, ...current];
  }
  setLocalCache(key, updated, empresaId);
};

export const removeFromLocalCache = <T extends { id: string }>(key: string, id: string, empresaId?: string): void => {
  const current = getLocalCache<T>(key, empresaId);
  const updated = current.filter(i => i.id !== id);
  setLocalCache(key, updated, empresaId);
};

export const getSyncQueue = (empresaId?: string): SyncQueueItem[] => {
  try {
    const prefix = getEmpresaPrefix(empresaId);
    const data = localStorage.getItem(`${prefix}sync_queue`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const addToSyncQueue = (item: Omit<SyncQueueItem, 'id' | 'timestamp'>, empresaId?: string): void => {
  const queue = getSyncQueue(empresaId);
  const queueItem: SyncQueueItem = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString()
  };
  const updated = [queueItem, ...queue];
  try {
    const prefix = getEmpresaPrefix(empresaId);
    localStorage.setItem(`${prefix}sync_queue`, JSON.stringify(updated));
  } catch (e) {}
};

export const removeFromSyncQueue = (id: string, empresaId?: string): void => {
  const queue = getSyncQueue(empresaId);
  const updated = queue.filter(q => q.id !== id);
  try {
    const prefix = getEmpresaPrefix(empresaId);
    localStorage.setItem(`${prefix}sync_queue`, JSON.stringify(updated));
  } catch (e) {}
};

export const isValidUuid = (id?: string): boolean => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};
