import React, { useState } from 'react';
import { Client } from '../types';
import { Plus, Search, User, MessageCircle } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import Toast from './ui/Toast';
import ConfirmDialog from './ui/ConfirmDialog';
import { DataList, ColumnDef } from './ui/DataList';

export default function Clients() {
  const { useClientes, useAddCliente, useUpdateCliente, useDeleteCliente } = useData();
  const { data: clients = [] } = useClientes();
  const addMutation = useAddCliente();
  const editMutation = useUpdateCliente();
  const deleteMutation = useDeleteCliente();
  const { toast, showToast, hideToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // FORM FIELDS
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
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
        onSuccess: () => { setIsModalOpen(false); showToast('Cliente atualizado com sucesso!', 'success'); },
        onError: () => { showToast('Erro ao atualizar cliente. Tente novamente.', 'error'); }
      });
    } else {
      addMutation.mutate(clientData, {
        onSuccess: () => { setIsModalOpen(false); showToast('Cliente cadastrado com sucesso!', 'success'); },
        onError: () => { showToast('Erro ao cadastrar cliente. Tente novamente.', 'error'); }
      });
    }
  };

  const handleDeleteRequest = (id: string, name: string) => {
    setConfirmDialog({ open: true, id, name });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(confirmDialog.id, {
      onSuccess: () => { showToast('Cliente excluído.', 'success'); },
      onError: () => { showToast('Erro ao excluir cliente.', 'error'); }
    });
    setConfirmDialog({ open: false, id: '', name: '' });
  };

  const filteredClients = clients.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.nome.toLowerCase().includes(q) ||
      (c.cpfCnpj || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      c.whatsapp.includes(q)
    );
  });

  // ── Column definitions ──────────────────────────────────────
  const mainColumns: ColumnDef<Client>[] = [
    {
      key: 'nome',
      header: 'Cliente',
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-neutral-800 border border-neutral-700 rounded-lg flex items-center justify-center text-orange-400 font-bold text-sm shrink-0">
            {c.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-white text-sm leading-tight">{c.nome}</p>
            {c.cpfCnpj && (
              <p className="text-[11px] text-neutral-500 font-mono mt-0.5">{c.cpfCnpj}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'whatsapp',
      header: 'WhatsApp',
      render: (c) => (
        <a
          href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-mono text-xs transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <MessageCircle size={13} />
          {c.whatsapp}
        </a>
      ),
    },
    {
      key: 'email',
      header: 'E-mail',
      render: (c) => (
        <span className="text-xs font-mono text-neutral-300">
          {c.email || <span className="italic text-neutral-600">—</span>}
        </span>
      ),
    },
  ];

  const extraColumns: ColumnDef<Client>[] = [
    {
      key: 'cpfCnpj',
      header: 'CPF / CNPJ',
      render: (c) => (
        <span className="text-neutral-300">{c.cpfCnpj || <span className="italic text-neutral-600">Não informado</span>}</span>
      ),
    },
    {
      key: 'endereco',
      header: 'Endereço de Entrega',
      render: (c) => (
        <span className="text-neutral-300">{c.endereco || <span className="italic text-neutral-600">Não informado</span>}</span>
      ),
    },
  ];

  return (
    <div className="space-y-5" id="clients-module-container">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />

      <ConfirmDialog
        open={confirmDialog.open}
        title="Excluir Cliente"
        description={`Tem certeza que deseja excluir "${confirmDialog.name}"? Históricos de orçamentos e vendas perderão o vínculo.`}
        confirmLabel="Excluir Cliente"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDialog({ open: false, id: '', name: '' })}
      />

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="clients-header">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Clientes / CRM</h2>
          <p className="text-sm text-neutral-400 mt-1">Gerencie contatos para faturamento, orçamentos e envio de PDF via WhatsApp.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          id="add-new-client-btn"
          className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl shadow-md shadow-orange-600/10 flex items-center gap-2 hover:-translate-y-px transition-all cursor-pointer shrink-0"
        >
          <Plus size={18} />
          Novo Cliente
        </button>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="relative" id="clients-search-bar">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
        <input
          id="clients-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar por nome, CPF/CNPJ, e-mail ou WhatsApp..."
          className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
          aria-label="Pesquisar clientes"
        />
      </div>

      {/* ── LIST ── */}
      <DataList<Client>
        data={filteredClients}
        columns={mainColumns}
        extraColumns={extraColumns}
        rowKey={(c) => c.id}
        onEdit={handleOpenEditModal}
        onDelete={(c) => handleDeleteRequest(c.id, c.nome)}
        emptyMessage={
          searchQuery
            ? 'Nenhum cliente encontrado para esta pesquisa.'
            : 'Nenhum cliente cadastrado. Clique em "Novo Cliente" para começar.'
        }
      />

      {/* ── FORM MODAL ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          id="client-form-modal"
          aria-modal="true"
          role="dialog"
          aria-label={editingClient ? 'Editar Cliente' : 'Novo Cliente'}
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <User size={20} className="text-orange-500" />
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs" noValidate>
              {formError && (
                <div role="alert" className="p-3 bg-red-950/50 border border-red-800/60 text-red-300 rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="client-nome" className="block text-neutral-300 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                  Nome Completo / Razão Social <span className="text-orange-500">*</span>
                </label>
                <input
                  id="client-nome"
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="client-cpf" className="block text-neutral-300 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                  CPF ou CNPJ <span className="text-neutral-600 normal-case font-normal">(opcional)</span>
                </label>
                <input
                  id="client-cpf"
                  type="text"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="client-whatsapp" className="block text-neutral-300 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                    WhatsApp <span className="text-orange-500">*</span>
                  </label>
                  <input
                    id="client-whatsapp"
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="client-email" className="block text-neutral-300 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                    E-mail <span className="text-neutral-600 normal-case font-normal">(opcional)</span>
                  </label>
                  <input
                    id="client-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="client-endereco" className="block text-neutral-300 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                  Endereço de Entrega <span className="text-neutral-600 normal-case font-normal">(opcional)</span>
                </label>
                <textarea
                  id="client-endereco"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending || editMutation.isPending}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl cursor-pointer disabled:opacity-60 transition-colors"
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
