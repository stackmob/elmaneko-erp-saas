import { useMemo, useState } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import { OfflineOperation, resolveOfflineConflict } from '../utils/offlineQueue';

type Props = { operation: OfflineOperation; onClose: () => void; onResolved: () => Promise<void> };
const printable = (value: unknown) => typeof value === 'string' ? value : JSON.stringify(value);

export default function OfflineConflictResolver({ operation, onClose, onResolved }: Props) {
  const [choices, setChoices] = useState<Record<string, 'local' | 'server'>>({});
  const [saving, setSaving] = useState(false);
  const local = operation.payload;
  const server = operation.serverPayload || {};
  const fields = useMemo(() => Array.from(new Set([...Object.keys(local), ...Object.keys(server)])), [local, server]);
  const hasServerVersion = Object.keys(server).length > 0;

  const retryWithResolution = async () => {
    const payload = Object.fromEntries(fields.map((field) => [field, choices[field] === 'server' ? server[field] : local[field]]));
    setSaving(true);
    try { await resolveOfflineConflict(operation.id, payload); await onResolved(); onClose(); } finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
    <section className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-2xl border border-amber-500/40 bg-neutral-950 p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-lg font-bold text-white"><AlertTriangle className="text-amber-400" />Resolver conflito offline</h2><p className="mt-1 text-xs text-neutral-400">Escolha a origem de cada campo. A operação só será reenviada após sua confirmação.</p></div><button onClick={onClose} className="text-neutral-400 hover:text-white"><X /></button></div>
      {!hasServerVersion && <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-950/30 p-3 text-xs text-amber-200">O servidor não retornou uma versão comparável para esta criação. Manter servidor significa descartar esta operação; manter local tentará reenviá-la.</p>}
      <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-neutral-400"><tr><th className="p-2">Campo</th><th className="p-2">Local</th><th className="p-2">Servidor</th><th className="p-2">Decisão</th></tr></thead><tbody className="divide-y divide-neutral-800">{fields.map((field) => <tr key={field}><td className="p-2 font-mono text-neutral-300">{field}</td><td className="max-w-48 break-words p-2 text-orange-200">{printable(local[field])}</td><td className="max-w-48 break-words p-2 text-cyan-200">{hasServerVersion ? printable(server[field]) : 'Indisponível'}</td><td className="p-2"><select value={choices[field] || 'local'} onChange={(event) => setChoices({ ...choices, [field]: event.target.value as 'local' | 'server' })} disabled={!hasServerVersion} className="rounded bg-neutral-900 p-1 text-white disabled:opacity-50"><option value="local">Manter local</option><option value="server">Manter servidor</option></select></td></tr>)}</tbody></table></div>
      <div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="rounded-lg border border-neutral-700 px-3 py-2 text-xs text-neutral-300">Cancelar</button><button onClick={() => void retryWithResolution()} disabled={saving} className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-neutral-950 disabled:opacity-50"><Check size={14} />Aplicar e sincronizar</button></div>
    </section>
  </div>;
}
