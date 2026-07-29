/**
 * Storage & Local Cache Utilities for Elmaneko 3D ERP
 */

export interface SyncQueueItem {
  id: string;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: string;
}

export const getActiveEmpresaId = (): string => {
  try {
    return (typeof localStorage !== 'undefined' ? localStorage.getItem('elmaneko_empresa_id') : null) || '00000000-0000-0000-0000-000000000001';
  } catch (e) {
    return '00000000-0000-0000-0000-000000000001';
  }
};

export const getEmpresaPrefix = (empresaId?: string): string => {
  const empId = empresaId || getActiveEmpresaId();
  return `elmaneko_cache_${empId}_`;
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
    localStorage.setItem(`${prefix}${key}`, JSON.stringify(data));
  } catch (e) {}
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
