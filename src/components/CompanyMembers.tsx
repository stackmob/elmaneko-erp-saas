import { useState, type FormEvent } from 'react';
import { Mail, Send, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import Toast from './ui/Toast';

type MemberRole = 'admin' | 'financeiro' | 'operador' | 'leitura';

export function CompanyMembers() {
  const { empresaId } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('operador');
  const [sending, setSending] = useState(false);

  const invite = async (event: FormEvent) => {
    event.preventDefault();
    if (!empresaId || !email.trim()) return;
    setSending(true);
    const { error } = await supabase.functions.invoke('send-company-invite', {
      body: { empresaId, email: email.trim(), role },
    });
    setSending(false);
    if (error) {
      showToast(error.message || 'Não foi possível enviar o convite.', 'error');
      return;
    }
    setEmail('');
    showToast('Convite enviado com sucesso.', 'success');
  };

  return (
    <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
        <Users size={16} className="text-orange-500" />
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Equipe e Acessos</h3>
      </div>
      <p className="text-xs text-neutral-400">Convites são enviados por e-mail e expiram em sete dias.</p>
      <form onSubmit={invite} className="grid grid-cols-1 sm:grid-cols-[1fr_150px_auto] gap-3">
        <input aria-label="E-mail do membro" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="membro@empresa.com"
          className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500" />
        <select value={role} onChange={(e) => setRole(e.target.value as MemberRole)} className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs">
          <option value="operador">Operador</option><option value="financeiro">Financeiro</option><option value="leitura">Leitura</option><option value="admin">Administrador</option>
        </select>
        <button disabled={sending || !empresaId} className="px-4 py-2 bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
          {sending ? <Mail size={14} className="animate-pulse" /> : <Send size={14} />} Enviar
        </button>
      </form>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />
    </section>
  );
}
