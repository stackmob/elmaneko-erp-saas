import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  empresaId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const DEFAULT_DEMO_EMPRESA_ID = "00000000-0000-0000-0000-000000000001";

const getFallbackEmpresaId = (): string => {
  try {
    let savedId = localStorage.getItem('elmaneko_empresa_id');
    if (!savedId) {
      savedId = DEFAULT_DEMO_EMPRESA_ID;
      localStorage.setItem('elmaneko_empresa_id', savedId);
    }
    return savedId;
  } catch (e) {
    return DEFAULT_DEMO_EMPRESA_ID;
  }
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  empresaId: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(getFallbackEmpresaId());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca a sessão atual no Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchEmpresaId(session.user.id);
      } else {
        ensureEmpresaId();
      }
    });

    // Escuta mudanças de auth (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchEmpresaId(session.user.id);
      } else {
        ensureEmpresaId();
      }
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
        await bootstrapUserCompany(userId);
      }
    } catch (err) {
      console.error("Erro ao buscar empresa:", err);
      ensureEmpresaId();
    } finally {
      setLoading(false);
    }
  };

  const bootstrapUserCompany = async (userId: string) => {
    try {
      const { data: empList } = await supabase.from('empresas').select('id').limit(1);
      let targetEmpresaId = empList && empList.length > 0 ? empList[0].id : null;

      if (!targetEmpresaId) {
        const { data: newEmp, error: createErr } = await supabase
          .from('empresas')
          .insert([{ nome: 'Empresa Principal' }])
          .select()
          .single();
        if (!createErr && newEmp) {
          targetEmpresaId = newEmp.id;
        }
      }

      if (targetEmpresaId) {
        await supabase
          .from('usuario_empresa')
          .insert([{ user_id: userId, empresa_id: targetEmpresaId, role: 'admin' }]);
        setEmpresaId(targetEmpresaId);
        try { localStorage.setItem('elmaneko_empresa_id', targetEmpresaId); } catch(e){}
      } else {
        ensureEmpresaId();
      }
    } catch (e) {
      console.error("Erro ao vincular empresa ao usuário:", e);
      ensureEmpresaId();
    }
  };

  const ensureEmpresaId = async () => {
    try {
      const { data } = await supabase.from('empresas').select('id').limit(1);
      if (data && data.length > 0) {
        setEmpresaId(data[0].id);
        try { localStorage.setItem('elmaneko_empresa_id', data[0].id); } catch(e){}
      } else {
        const fallback = getFallbackEmpresaId();
        setEmpresaId(fallback);
      }
    } catch (e) {
      const fallback = getFallbackEmpresaId();
      setEmpresaId(fallback);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, empresaId, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
