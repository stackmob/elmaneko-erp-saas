import React, { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import Toast from './ui/Toast';
import { Company } from '../types';
import { 
  Building2, Save, Building, Phone, MapPin, 
  UserCheck, Sparkles, Printer, CheckCircle2
} from 'lucide-react';

export default function CompanyModule() {
  const { useEmpresa, useUpdateEmpresa } = useData();
  const { data: company, isLoading } = useEmpresa();
  const updateMutation = useUpdateEmpresa();
  const { toast, showToast, hideToast } = useToast();

  const [formData, setFormData] = useState<Company>({
    id: '',
    nome: '',
    razaoSocial: '',
    cnpj: '',
    inscricaoEstadual: '',
    telefone: '',
    whatsapp: '',
    email: '',
    endereco: '',
    responsavel: '',
    cargoResponsavel: '',
    pixChave: '',
    pixTipo: 'CNPJ',
    slogan: '',
    logotipoUrl: '',
    observacoes: ''
  });

  useEffect(() => {
    if (company) {
      setFormData(company);
    }
  }, [company]);

  const handleChange = (field: keyof Company, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      showToast('O Nome Fantasia da empresa é obrigatório.', 'error');
      return;
    }

    updateMutation.mutate(formData, {
      onSuccess: () => {
        showToast('Dados da Empresa salvos com sucesso! Relatórios e orçamentos atualizados.', 'success');
      },
      onError: (err: any) => {
        showToast(`Erro ao salvar empresa: ${err?.message || 'Tente novamente.'}`, 'error');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-neutral-400 font-mono flex items-center justify-center gap-2">
        <Sparkles className="animate-spin text-orange-500 w-5 h-5" />
        Carregando cadastro da empresa...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in" id="company-module-container">
      
      {/* HUD TITLE HEADER */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 border border-orange-400/30">
            <Building2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-wide">Cadastro & Perfil da Empresa</h1>
              <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[10px] font-mono text-orange-400 font-bold uppercase">Emissor de Relatórios</span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Defina as informações oficiais da sua empresa para cabeçalhos de orçamentos, relatórios PDF e comprovantes.
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={updateMutation.isPending}
          className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 border border-orange-400/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          id="save-company-btn"
        >
          {updateMutation.isPending ? (
            <>
              <Sparkles size={16} className="animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Save size={16} /> Salvar Alterações
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* FORM CONTAINER (7 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          
          {/* SECTION 1: IDENTIFICAÇÃO E DADOS LEGAIS */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Building size={16} className="text-orange-500" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">1. Identificação Comercial & Legal</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Nome Fantasia (Exibição) *</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  placeholder="Ex: ELMANEKO 3D"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Razão Social Oficial</label>
                <input
                  type="text"
                  value={formData.razaoSocial || ''}
                  onChange={(e) => handleChange('razaoSocial', e.target.value)}
                  placeholder="Ex: ELMANEKO 3D TECNOLOGIA LTDA"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">CNPJ ou CPF</label>
                <input
                  type="text"
                  value={formData.cnpj || ''}
                  onChange={(e) => handleChange('cnpj', e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Inscrição Estadual / Municipal</label>
                <input
                  type="text"
                  value={formData.inscricaoEstadual || ''}
                  onChange={(e) => handleChange('inscricaoEstadual', e.target.value)}
                  placeholder="ISENTO ou nº inscrição"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Slogan ou Subtítulo Comercial</label>
                <input
                  type="text"
                  value={formData.slogan || ''}
                  onChange={(e) => handleChange('slogan', e.target.value)}
                  placeholder="Ex: Impressão 3D de Alta Fidelidade & Prototipagem"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: CONTATO E LOCALIZAÇÃO */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
              <MapPin size={16} className="text-orange-500" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">2. Canais de Contato & Endereço</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Telefone Fixo / Principal</label>
                <input
                  type="text"
                  value={formData.telefone || ''}
                  onChange={(e) => handleChange('telefone', e.target.value)}
                  placeholder="(11) 3333-3333"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">WhatsApp Comercial</label>
                <input
                  type="text"
                  value={formData.whatsapp || ''}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">E-mail Comercial Oficial</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contato@empresa.com.br"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Endereço Físico Completo</label>
                <input
                  type="text"
                  value={formData.endereco || ''}
                  onChange={(e) => handleChange('endereco', e.target.value)}
                  placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: ASSINATURA, REGRAS & COBRANÇA */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
              <UserCheck size={16} className="text-orange-500" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">3. Gestão de Assinatura & Cobrança PIX</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Nome do Gestor / Responsável</label>
                <input
                  type="text"
                  value={formData.responsavel || ''}
                  onChange={(e) => handleChange('responsavel', e.target.value)}
                  placeholder="Ex: Guilherme Braga"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Cargo do Responsável</label>
                <input
                  type="text"
                  value={formData.cargoResponsavel || ''}
                  onChange={(e) => handleChange('cargoResponsavel', e.target.value)}
                  placeholder="Ex: Gestor Administrativo / Diretor"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Tipo da Chave PIX</label>
                <select
                  value={formData.pixTipo || 'CNPJ'}
                  onChange={(e) => handleChange('pixTipo', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                >
                  <option value="CNPJ">CNPJ</option>
                  <option value="CPF">CPF</option>
                  <option value="E-mail">E-mail</option>
                  <option value="Celular">Celular</option>
                  <option value="Chave Aleatória">Chave Aleatória</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Chave PIX de Recebimento</label>
                <input
                  type="text"
                  value={formData.pixChave || ''}
                  onChange={(e) => handleChange('pixChave', e.target.value)}
                  placeholder="Chave PIX para constar nos orçamentos"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">Observações ou Nota de Rodapé</label>
                <textarea
                  rows={2}
                  value={formData.observacoes || ''}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                  placeholder="Observações padrão a serem incluídas no final de propostas comerciais e relatórios..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
          </div>

        </form>

        {/* LIVE PREVIEW CONTAINER (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 sticky top-24">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <Printer size={15} /> Pré-visualização do Timbrado
              </span>
              <span className="text-[10px] font-mono bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded">PDF & Impressão</span>
            </div>

            {/* LIVE PAPER PREVIEW BOX */}
            <div className="bg-white text-neutral-950 p-5 rounded-xl border border-neutral-300 shadow-inner font-sans text-xs space-y-4">
              
              {/* HEADER */}
              <div className="flex justify-between items-start border-b-2 border-orange-500 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-tr from-orange-600 to-amber-500 rounded flex items-center justify-center text-white font-black text-xs">
                      {formData.nome ? formData.nome[0] : 'E'}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-neutral-900 leading-tight">
                        {formData.nome || 'ELMANEKO 3D'}
                      </h4>
                      <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-500">
                        {formData.slogan || 'Impressão 3D de Alta Fidelidade'}
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] text-neutral-600 mt-2 space-y-0.5 leading-snug">
                    <p className="font-bold">
                      {formData.razaoSocial || formData.nome || 'Razão Social'} 
                      {formData.cnpj ? ` • CNPJ: ${formData.cnpj}` : ''}
                    </p>
                    <p>{formData.endereco || 'Endereço da empresa não informado'}</p>
                    <p>
                      {formData.email ? `Email: ${formData.email}` : ''} 
                      {formData.telefone ? ` • Tel: ${formData.telefone}` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-mono text-orange-600 font-bold uppercase block">PROPOSTA COMERCIAL</span>
                  <span className="text-[9px] font-mono text-neutral-400">Nº ORÇ-001</span>
                </div>
              </div>

              {/* DUMMY CONTENT */}
              <div className="py-2 space-y-2 text-[10px] text-neutral-400 border-b border-neutral-200 border-dashed">
                <div className="flex justify-between font-mono text-neutral-600">
                  <span>ITEM EXEMPLO: Suporte de Extrusora V6</span>
                  <span className="font-bold text-neutral-900">R$ 150,00</span>
                </div>
                {formData.pixChave && (
                  <div className="p-2 bg-neutral-100 rounded border border-neutral-200 text-neutral-800 font-mono text-[9px]">
                    <span className="font-bold text-orange-700 block">Dados para Pagamento via PIX:</span>
                    <span>Chave ({formData.pixTipo || 'CNPJ'}): <strong>{formData.pixChave}</strong></span>
                  </div>
                )}
              </div>

              {/* SIGNATURE PREVIEW */}
              <div className="pt-2 flex justify-between items-end text-[9px] text-neutral-600">
                <div className="text-center w-1/2 pr-2">
                  <div className="border-b border-neutral-400 pb-1 mb-1 font-mono text-[8px] text-neutral-400">EMISSOR DIGITAL</div>
                  <strong className="text-neutral-900 block">{formData.responsavel || 'Nome do Gestor'}</strong>
                  <span className="text-neutral-500 text-[8px]">{formData.cargoResponsavel || 'Cargo / Função'}</span>
                </div>

                <div className="text-center w-1/2 pl-2">
                  <div className="border-b border-neutral-400 pb-1 mb-1 font-mono text-[8px] text-neutral-400">ACEITE DO CLIENTE</div>
                  <strong className="text-neutral-900 block">Assinatura Cliente</strong>
                  <span className="text-neutral-500 text-[8px]">Proposta Aceita</span>
                </div>
              </div>

            </div>

            <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 text-[11px] text-neutral-400 flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>
                As alterações salvas são aplicadas automaticamente em todos os documentos impressos, relatórios financeiros e propostas digitais exportadas.
              </span>
            </div>

          </div>
        </div>

      </div>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />
    </div>
  );
}
