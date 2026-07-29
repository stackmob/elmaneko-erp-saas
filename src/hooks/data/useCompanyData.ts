import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Company } from '../../types';

const getFallbackEmpresaId = (): string => {
  try {
    const empresaId = localStorage.getItem('elmaneko_empresa_id');
    if (empresaId) return empresaId;
  } catch (e) {
    // The caller receives a clear tenant error below.
  }
  throw new Error('Nenhuma empresa ativa para a sessão atual.');
};

const DEFAULT_COMPANY_DATA: Company = {
  id: '',
  nome: 'ELMANEKO 3D',
  razaoSocial: 'ELMANEKO 3D LTDA',
  cnpj: '12.345.678/0001-99',
  inscricaoEstadual: 'ISENTO',
  telefone: '(11) 3333-3333',
  whatsapp: '(11) 99999-9999',
  email: 'contato@elmaneko3d.com',
  endereco: 'Rua da Extrusora, 3D - Parque Tecnológico, SP',
  responsavel: 'Guilherme Braga',
  cargoResponsavel: 'Gestor Administrativo',
  pixChave: '12.345.678/0001-99',
  pixTipo: 'CNPJ',
  slogan: 'Impressão 3D de Alta Fidelidade',
  observacoes: 'Documentos e propostas emitidos via ELMANEKO 3D ERP HUD'
};

const mapEmpresaFromDB = (row: any): Company => ({
  id: row.id,
  nome: row.nome || 'ELMANEKO 3D',
  razaoSocial: row.razao_social || row.nome || 'ELMANEKO 3D LTDA',
  cnpj: row.cnpj || '',
  inscricaoEstadual: row.inscricao_estadual || '',
  telefone: row.telefone || '',
  whatsapp: row.whatsapp || '',
  email: row.email || '',
  endereco: row.endereco || '',
  responsavel: row.responsavel || '',
  cargoResponsavel: row.cargo_responsavel || '',
  pixChave: row.pix_chave || '',
  pixTipo: row.pix_tipo || 'CNPJ',
  slogan: row.slogan || '',
  logotipoUrl: row.logotipo_url || '',
  observacoes: row.observacoes || ''
});

const mapEmpresaToDB = (comp: Partial<Company>) => ({
  nome: comp.nome,
  razao_social: comp.razaoSocial,
  cnpj: comp.cnpj,
  inscricao_estadual: comp.inscricaoEstadual,
  telefone: comp.telefone,
  whatsapp: comp.whatsapp,
  email: comp.email,
  endereco: comp.endereco,
  responsavel: comp.responsavel,
  cargo_responsavel: comp.cargoResponsavel,
  pix_chave: comp.pixChave,
  pix_tipo: comp.pixTipo,
  slogan: comp.slogan,
  logotipo_url: comp.logotipoUrl,
  observacoes: comp.observacoes
});

export function useEmpresa() {
  const { session } = useAuth();
  const fallbackId = getFallbackEmpresaId();

  return useQuery({
    queryKey: ['empresa', session?.user?.id],
    queryFn: async () => {
      try {
        if (session?.user?.id) {
          const { data: ueData } = await supabase
            .from('usuario_empresa')
            .select('empresa_id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          const activeEmpresaId = ueData?.empresa_id || fallbackId;

          const { data: empData, error: empErr } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', activeEmpresaId)
            .maybeSingle();

          if (empData && !empErr) {
            return mapEmpresaFromDB(empData);
          }
        }

        // Try querying demo empresa only if session exists or try-catch gracefully
        const { data: demoData, error: demoErr } = await supabase
          .from('empresas')
          .select('*')
          .eq('id', fallbackId)
          .maybeSingle();

        if (demoData && !demoErr) {
          return mapEmpresaFromDB(demoData);
        }

        return DEFAULT_COMPANY_DATA;
      } catch (e) {
        return DEFAULT_COMPANY_DATA;
      }
    },
    staleTime: 1000 * 60 * 10,
    retry: false, // Prevent noisy console 403 retries
  });
}

export function useUpdateEmpresa() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const fallbackId = getFallbackEmpresaId();

  return useMutation({
    mutationFn: async (updated: Partial<Company>) => {
      let activeEmpresaId = fallbackId;

      if (session?.user?.id) {
        const { data: ueData } = await supabase
          .from('usuario_empresa')
          .select('empresa_id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (ueData?.empresa_id) {
          activeEmpresaId = ueData.empresa_id;
        }
      }

      const dbPayload = mapEmpresaToDB(updated);

      const { data, error } = await supabase
        .from('empresas')
        .update(dbPayload)
        .eq('id', activeEmpresaId)
        .select()
        .single();

      if (error) throw error;
      return mapEmpresaFromDB(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresa'] });
    },
  });
}
