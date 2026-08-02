import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  empresaId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  empresaId: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca a sessão atual no Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchEmpresaId(session.user.id);
      } else setLoading(false);
    });

    // Escuta mudanças de auth (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchEmpresaId(session.user.id);
      } else setEmpresaId(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchEmpresaId = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('usuario_empresa')
        .select('empresa_id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!error && data?.empresa_id) {
        setEmpresaId(data.empresa_id);
        try { localStorage.setItem('elmaneko_empresa_id', data.empresa_id); } catch(e){}
      } else {
        await bootstrapUserCompany();
      }
    } catch (err) {
      console.error("Erro ao buscar empresa:", err);
      setEmpresaId(null);
    } finally {
      setLoading(false);
    }
  };

  const bootstrapUserCompany = async () => {
    try {
      const { data: targetEmpresaId, error } = await supabase.rpc('bootstrap_empresa_do_usuario');

      if (!error && targetEmpresaId) {
        setEmpresaId(targetEmpresaId);
        try { localStorage.setItem('elmaneko_empresa_id', targetEmpresaId); } catch(e){}
      } else setEmpresaId(null);
    } catch (e) {
      console.error("Erro ao vincular empresa ao usuário:", e);
      setEmpresaId(null);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    try { localStorage.removeItem('elmaneko_empresa_id'); } catch (e) {}
    setEmpresaId(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, empresaId, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
