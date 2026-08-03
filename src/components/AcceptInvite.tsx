import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AcceptInvite() {
  const token = new URLSearchParams(window.location.search).get('token');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const accept = async () => {
    if (!token) return;
    setState('loading');
    const { data, error } = await supabase.rpc('aceitar_convite_empresa', { p_token: token });
    if (error) {
      setState('error');
      setMessage(error.message);
      return;
    }
    localStorage.setItem('elmaneko_empresa_id', data);
    setState('success');
    setMessage('Convite aceito. Você já pode acessar a empresa.');
  };

  return <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
    <section className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 text-center">
      <CheckCircle2 className="mx-auto text-orange-500" size={38} />
      <h1 className="font-bold text-lg">Convite para a equipe</h1>
      {!token ? <p className="text-sm text-red-300">Link de convite inválido.</p> : <>
        <p className="text-sm text-neutral-400">Confirme o aceite usando a conta autenticada correspondente ao e-mail convidado.</p>
        {state !== 'success' && <button onClick={accept} disabled={state === 'loading'} className="w-full py-2.5 bg-orange-600 rounded-xl font-bold text-sm disabled:opacity-50">
          {state === 'loading' ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Aceitar convite'}
        </button>}
        {message && <p className={`text-sm ${state === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>{message}</p>}
        {state === 'success' && <a href="/" className="block text-sm text-orange-400">Abrir sistema</a>}
      </>}
    </section>
  </main>;
}
