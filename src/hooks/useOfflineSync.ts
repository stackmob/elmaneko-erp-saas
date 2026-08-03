import { useEffect } from 'react';
import { syncOfflineOperations } from '../utils/offlineQueue';

export function useOfflineSync(tenantId: string | null) {
  useEffect(() => {
    if (!tenantId) return;
    const synchronize = () => { if (navigator.onLine) void syncOfflineOperations(tenantId); };
    synchronize();
    window.addEventListener('online', synchronize);
    return () => window.removeEventListener('online', synchronize);
  }, [tenantId]);
}
