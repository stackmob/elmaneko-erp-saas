import React, { useState } from 'react';
import { Client } from '../types';
import { Plus, Edit, Trash2, Search, User, Mail, Phone, MapPin, CreditCard } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import Toast from './ui/Toast';
import ConfirmDialog from './ui/ConfirmDialog';

export default function Clients() {
  const { useClientes, useAddCliente, useUpdateCliente, useDeleteCliente } = useData();
  const { data: clients = [] } = useClientes();
  const addMutation = useAddCliente();
  const editMutation = useUpdateCliente();
  const deleteMutation = useDeleteCliente();
  const { toast, showToast, hideToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });

  // SEARCH STATE
  const [searchQuery, setSearchQuery] = useState('');

  // FORM FIELDS
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');

  // Inline form error
  const [formError, setFormError] = useState('');

  const handleOpenAddModal = () => {
    setEditingClient(null);
    setNome('');
    setCpfCnpj('');
    setWhatsapp('');
    setEmail('');
    setEndereco('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: Client) => {
    setEditingClient(c);
    setNome(c.nome);
    setCpfCnpj(c.cpfCnpj || '');
    setWhatsapp(c.whatsapp);
    setEmail(c.email || '');
    setEndereco(c.endereco);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Apenas nome e whatsapp são obrigatórios
    if (!nome.trim()) {
      setFormError('O nome do cliente é obrigatório.');
      return;
    }
    if (!whatsapp.trim()) {
      setFormError('O WhatsApp de contato é obrigatório.');
      return;
    }

    const clientData: Client = {
      id: editingClient ? editingClient.id : crypto.randomUUID(),
      nome: nome.trim(),
      cpfCnpj: cpfCnpj.trim() || undefined,
      whatsapp: whatsapp.trim(),
      telefone: whatsapp.trim(),
      email: email.trim() || undefined,
      endereco: endereco.trim()
    };

    if (editingClient) {
      editMutation.mutate(clientData, {
        onSuccess: () => {
          setIsModalOpen(false);
          showToast('Cliente atualizado com sucesso!', 'success');
        },
        onError: () => {
          showToast('Erro ao atualizar cliente. Tente novamente.', 'error');
        }
      });
    } else {
      addMutation.mutate(clientData, {
        onSuccess: () => {
          setIsModalOpen(false);
          showToast('Cliente cadastrado com sucesso!', 'success');
        },
        onError: () => {
          showToast('Erro ao cadastrar cliente. Tente novamente.', 'error');
        }
      });
    }
  };

  const handleDeleteRequest = (id: string, name: string) => {
    setConfirmDialog({ open: true, id, name });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(confirmDialog.id, {
      onSuccess: () => showToast('Cliente excluído com sucesso.', 'warning'),
      onError: () => showToast('Erro ao excluir cliente.', 'error')
    });
    setConfirmDialog({ open: false, id: '', name: '' });
  };

  const filteredClients = clients.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.nome.toLowerCase().includes(query) ||
      (c.cpfCnpj || '').toLowerCase().includes(query) ||
      (c.email || '').toLowerCase().includes(query) ||
      c.whatsapp.includes(query)
    );
  });

  return (
    <div className="space-y-6" id="clients-module-container">

      {/* TOAST */}
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />

      {/* CONFIRM DIALOG */}
      <ConfirmDialog
        open={confirmDialog.open}
        title="Excluir Cliente"
        description={`Tem certeza que deseja excluir "${confirmDialog.name}"? Históricos de orçamentos e vendas perderão o vínculo.`}
        confirmLabel="Excluir Cliente"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDialog({ open: false, id: '', name: '' })}
      />

      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="clients-header">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Cadastro e Gestão de Clientes</h2>
          <p className="text-sm text-neutral-400 mt-1">Gerencie a carteira de contatos para faturamento, rastreamento de frete e envio rápido de PDF via WhatsApp.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          id="add-new-client-btn"
          className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold rounded-xl shadow-md shadow-orange-600/10 flex items-center justify-center gap-2 hover:translate-y-[-1px] transition-all cursor-pointer"
        >
          <Plus size={18} />
          Adicionar Cliente
        </button>
      </div>

      {/* FILTER SEARCH INPUT */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex gap-3 items-center" id="clients-search-bar">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Pesquisar por nome, CPF/CNPJ, e-mail ou WhatsApp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* CLIENTS CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="clients-grid">
        {filteredClients.length > 0 ? (
          filteredClients.map(c => (
            <div
              key={c.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-orange-500/20 transition-all duration-300 relative flex flex-col justify-between"
              id={`client-card-${c.id}`}
            >
              <div>
                {/* Title Card */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-neutral-950 rounded-lg flex items-center justify-center text-orange-500 border border-neutral-800 font-bold">
                      {c.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white line-clamp-1">{c.nome}</h3>
                      <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1 mt-0.5">
                        <CreditCard size={10} />
                        {c.cpfCnpj || <span className="italic text-neutral-600">CPF não informado</span>}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(c)}
                      className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Editar Cliente"
                      id={`edit-client-btn-${c.id}`}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(c.id, c.nome)}
                      className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Cliente"
                      id={`delete-client-btn-${c.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Info List */}
                <div className="mt-4 space-y-2 text-xs font-mono text-neutral-300 pt-3 border-t border-neutral-800/60">
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-neutral-500 shrink-0" />
                    <span className="truncate">
                      {c.email || <span className="italic text-neutral-600">E-mail não informado</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-neutral-500 shrink-0" />
                    <span>{c.whatsapp}</span>
                  </div>
                  <div className="flex items-start gap-2 pt-1">
                    <MapPin size={13} className="text-neutral-500 mt-0.5 shrink-0" />
                    <span className="line-clamp-2 text-neutral-400">{c.endereco || <span className="italic text-neutral-600">Sem endereço de entrega</span>}</span>
                  </div>
                </div>
              </div>

              {/* CRM LINK ACTIONS */}
              <div className="mt-5 pt-3 border-t border-neutral-800/40 flex justify-end">
                <a
                  href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/10 text-emerald-400 font-mono text-[10px] rounded-lg transition-colors"
                >
                  Abrir WhatsApp
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-neutral-500 font-mono text-xs bg-neutral-900 border border-neutral-800 rounded-2xl">
            {searchQuery ? 'Nenhum cliente atende aos filtros de pesquisa.' : 'Nenhum cliente cadastrado. Clique em "Adicionar Cliente" para começar.'}
          </div>
        )}
      </div>

      {/* --- CRM CLIENT DIALOG FORM --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" id="client-form-modal">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <User size={20} className="text-orange-500" />
              {editingClient ? 'Editar Informações do Cliente' : 'Cadastrar Novo Cliente'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs text-left">

              {/* Inline form error */}
              {formError && (
                <div className="p-3 bg-red-950/50 border border-red-800/60 text-red-300 text-xs rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Nome Completo / Razão Social *</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">CPF ou CNPJ <span className="text-neutral-600 normal-case">(opcional)</span></label>
                <input
                  type="text"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Email <span className="text-neutral-600 normal-case">(opcional)</span></label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Endereço de Entrega <span className="text-neutral-600 normal-case">(opcional)</span></label>
                <textarea
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* ACTION CONTROL BUTTONS */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending || editMutation.isPending}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl cursor-pointer disabled:opacity-60"
                >
                  {addMutation.isPending || editMutation.isPending ? 'Salvando...' : 'Gravar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
