/**
 * Storage & Local Cache Utilities for Elmaneko 3D ERP
 */

export const getLocalCache = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(`elmaneko_cache_${key}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const setLocalCache = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(`elmaneko_cache_${key}`, JSON.stringify(data));
  } catch (e) {}
};

export const addToLocalCache = <T extends { id: string }>(key: string, item: T): void => {
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

export const removeFromLocalCache = <T extends { id: string }>(key: string, id: string): void => {
  const current = getLocalCache<T>(key);
  const updated = current.filter(i => i.id !== id);
  setLocalCache(key, updated);
};

export const isValidUuid = (id?: string): boolean => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};
