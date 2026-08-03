import { supabase } from '../lib/supabase';

export type OfflineOperationType = 'create_purchase' | 'create_budget' | 'create_product';
export type OfflineOperationStatus = 'pending' | 'syncing' | 'conflict' | 'failed';

export interface OfflineOperation {
  id: string;
  tenantId: string;
  type: OfflineOperationType;
  payload: Record<string, unknown>;
  createdAt: string;
  retries: number;
  status: OfflineOperationStatus;
  error?: string;
  serverPayload?: Record<string, unknown>;
}

const DB_NAME = 'elmaneko-offline';
const STORE = 'operations';
export const OFFLINE_QUEUE_CHANGED_EVENT = 'elmaneko-offline-queue-changed';

function notifyQueueChanged() {
  window.dispatchEvent(new Event(OFFLINE_QUEUE_CHANGED_EVENT));
}

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(STORE, { keyPath: 'id' });
      store.createIndex('tenant_status', ['tenantId', 'status']);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function write(operation: OfflineOperation) {
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(operation);
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function enqueueOfflineOperation(tenantId: string, type: OfflineOperationType, payload: Record<string, unknown>, operationId = crypto.randomUUID()) {
  const operation: OfflineOperation = { id: operationId, tenantId, type, payload, createdAt: new Date().toISOString(), retries: 0, status: 'pending' };
  await write(operation);
  notifyQueueChanged();
  return operation;
}

export async function listOfflineOperations(tenantId: string): Promise<OfflineOperation[]> {
  const db = await database();
  const result = await new Promise<OfflineOperation[]>((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).getAll();
    request.onsuccess = () => resolve((request.result as OfflineOperation[]).filter((item) => item.tenantId === tenantId));
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}

async function remove(id: string) {
  const db = await database();
  await new Promise<void>((resolve, reject) => { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(id); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
  db.close();
}

async function dispatch(operation: OfflineOperation) {
  const empresaId = operation.tenantId;
  if (operation.type === 'create_purchase') return supabase.rpc('criar_compra_com_despesa', { p_empresa_id: empresaId, p_compra: operation.payload, p_idempotency_key: operation.id });
  if (operation.type === 'create_budget') return supabase.rpc('salvar_orcamento_com_itens', { p_empresa_id: empresaId, p_orcamento: operation.payload.budget, p_itens: operation.payload.items, p_idempotency_key: operation.id });
  return supabase.rpc('salvar_produto_com_bom', { p_empresa_id: empresaId, p_produto: operation.payload.product, p_materiais: operation.payload.materials, p_idempotency_key: operation.id });
}

export async function syncOfflineOperations(tenantId: string) {
  const operations = (await listOfflineOperations(tenantId)).filter((item) => item.status === 'pending' || item.status === 'failed');
  for (const operation of operations) {
    await write({ ...operation, status: 'syncing', retries: operation.retries + 1, error: undefined });
    const { error } = await dispatch(operation);
    if (!error) {
      await remove(operation.id);
      notifyQueueChanged();
      continue;
    }
    const status: OfflineOperationStatus = error.code === '23505' || error.code === '409' ? 'conflict' : 'failed';
    await write({ ...operation, status, retries: operation.retries + 1, error: error.message });
    notifyQueueChanged();
  }
}

export async function discardOfflineOperation(id: string) {
  await remove(id);
  notifyQueueChanged();
}

/** Recoloca a operação na fila somente após uma decisão explícita do usuário. */
export async function resolveOfflineConflict(id: string, payload: Record<string, unknown>) {
  const operations = await listOfflineOperationsForAllTenants();
  const operation = operations.find((item) => item.id === id);
  if (!operation) throw new Error('Operação offline não encontrada.');
  await write({ ...operation, payload, status: 'pending', error: undefined, serverPayload: undefined });
  notifyQueueChanged();
}

async function listOfflineOperationsForAllTenants(): Promise<OfflineOperation[]> {
  const db = await database();
  const result = await new Promise<OfflineOperation[]>((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as OfflineOperation[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}

export const isNetworkFailure = (error: unknown) => !navigator.onLine || error instanceof TypeError || /network|fetch|offline/i.test(error instanceof Error ? error.message : '');
