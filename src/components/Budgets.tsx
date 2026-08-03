import React, { useState } from 'react';
import { Budget, Client, Product, BudgetItem, Sale, Filament } from '../types';
import { 
  Plus, Edit, Trash2, FileText, Calendar, User, 
  DollarSign, Check, ChevronRight, Share2, Download, Eye, X, Printer, Percent, CheckCircle2,
  Filter, ArrowUpDown, RotateCcw, TrendingUp, Clock, AlertCircle, FolderHeart, Package
} from 'lucide-react';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import Toast from './ui/Toast';
import ConfirmDialog from './ui/ConfirmDialog';
import { BudgetPreviewModal } from './commercial/BudgetPreviewModal';
import { Modal } from './ui/Modal';
import { budgetSubtotal, budgetTotal, suggestedProductPrice } from '../utils/businessCalculations';

// Helper to format ISO YYYY-MM-DD date to DD/MM/YYYY
const formatDateBR = (dateStr?: string): string => {
  if (!dateStr) return '';
  const cleanDate = dateStr.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export default function Budgets() {
  const { useOrcamentos, useClientes, useProdutos, useFilamentos, useEmpresa, useAddOrcamento, useUpdateOrcamento, useDeleteOrcamento, useAddVenda, useVendas } = useData();
  const { data: budgets = [] } = useOrcamentos();
  const { data: clients = [] } = useClientes();
  const { data: products = [] } = useProdutos();
  const { data: filaments = [] } = useFilamentos();
  const { data: company } = useEmpresa();
  const { data: sales = [] } = useVendas();
  const addMutation = useAddOrcamento();
  const editMutation = useUpdateOrcamento();
  const deleteMutation = useDeleteOrcamento();
  const addVendaMutation = useAddVenda();
  const { toast, showToast, hideToast } = useToast();
  
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; id: string; num: string; invoiced: boolean }>({ open: false, id: '', num: '', invoiced: false });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // PDF Preview Modal
  const [pdfPreviewBudget, setPdfPreviewBudget] = useState<Budget | null>(null);

  // Conversion to sale modal
  const [conversionBudget, setConversionBudget] = useState<Budget | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Boleto' | 'Dinheiro'>('Pix');
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  // FILTER & SORT STATES
  const [filterClient, setFilterClient] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minValor, setMinValor] = useState('');
  const [maxValor, setMaxValor] = useState('');
  const [sortBy, setSortBy] = useState<'data_desc' | 'data_asc' | 'cliente_asc' | 'cliente_desc' | 'valor_desc' | 'valor_asc'>('data_desc');

  // Helper check if budget is already invoiced (status === Faturado or has associated Sale)
  const isBudgetInvoiced = (b: Budget): boolean => {
    if (b.status === 'Faturado') return true;
    return sales.some(s => s.orcamentoOrigemId === b.id);
  };

  // FORM FIELDS
  const [clienteId, setClienteId] = useState('');
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split('T')[0]);
  const [validade, setValidade] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15); // 15 days default validity
    return d.toISOString().split('T')[0];
  });
  const [previsaoEntrega, setPrevisaoEntrega] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7); // 7 days default delivery preview
    return d.toISOString().split('T')[0];
  });
  const [itens, setItens] = useState<BudgetItem[]>([
    { produtoId: '', quantidade: 1, valorUnitario: 0, desconto: 0 }
  ]);
  const [descontoGeral, setDescontoGeral] = useState(0);
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState<Budget['status']>('Aberto');

  // Filament highest cost rate helper
  const getMaxCostPerGram = (type: string): number => {
    const typeFilaments = filaments.filter(f => f.tipo === type);
    if (typeFilaments.length === 0) return 0.12;
    let max = 0;
    typeFilaments.forEach(f => {
      const r = f.valorCompra / f.pesoTotal;
      if (r > max) max = r;
    });
    return max;
  };

  // Suggested product price helper (Cost + saved margin/price)
  const getProductSuggestedPrice = (product: Product) => suggestedProductPrice(product, filaments);

  const handleProductSelectionChange = (index: number, pId: string) => {
    const prodObj = products.find(p => p.id === pId);
    if (!prodObj) return;

    const suggestedPrice = getProductSuggestedPrice(prodObj);
    const list = [...itens];
    list[index].produtoId = pId;
    list[index].valorUnitario = suggestedPrice;
    setItens(list);
  };

  const handleAddItemRow = () => {
    setItens([...itens, { produtoId: '', quantidade: 1, valorUnitario: 0, desconto: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (itens.length === 1) return;
    setItens(itens.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, key: keyof BudgetItem, value: any) => {
    const list = [...itens];
    if (key === 'quantidade') {
      list[index].quantidade = Math.max(1, Number(value));
    } else if (key === 'valorUnitario') {
      list[index].valorUnitario = Number(value);
    } else if (key === 'desconto') {
      list[index].desconto = Number(value);
    }
    setItens(list);
  };

  // Calculations
  const calculateSubtotal = budgetSubtotal;
  const calculateTotal = budgetTotal;

  const handleOpenAddModal = () => {
    setEditingBudget(null);
    setClienteId(clients.length > 0 ? clients[0].id : '');
    setDataEmissao(new Date().toISOString().split('T')[0]);
    const dVal = new Date();
    dVal.setDate(dVal.getDate() + 15);
    setValidade(dVal.toISOString().split('T')[0]);
    const dEnt = new Date();
    dEnt.setDate(dEnt.getDate() + 7);
    setPrevisaoEntrega(dEnt.toISOString().split('T')[0]);
    setItens([{ produtoId: products.length > 0 ? products[0].id : '', quantidade: 1, valorUnitario: products.length > 0 ? getProductSuggestedPrice(products[0]) : 0, desconto: 0 }]);
    setDescontoGeral(0);
    setObservacoes('');
    setStatus('Aberto');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (b: Budget) => {
    setEditingBudget(b);
    setClienteId(b.clienteId);
    setDataEmissao(b.dataEmissao);
    setValidade(b.validade);
    setPrevisaoEntrega(b.previsaoEntrega || '');
    setItens(b.itens.map(it => ({ ...it })));
    setDescontoGeral(b.descontoGeral);
    setObservacoes(b.observacoes || '');
    setStatus(b.status);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || itens.some(it => !it.produtoId)) {
      showToast('Por favor, selecione o cliente e pelo menos um produto válido.', 'error');
      return;
    }

    const budgetData: Omit<Budget, 'id'> = {
      numero: editingBudget ? editingBudget.numero : `ORÇ-2026-${String(budgets.length + 1).padStart(4, '0')}`,
      clienteId,
      dataEmissao,
      validade,
      previsaoEntrega,
      itens,
      descontoGeral: Number(descontoGeral),
      observacoes,
      status
    };

    if (editingBudget) {
      editMutation.mutate({ ...budgetData, id: editingBudget.id }, {
        onSuccess: () => {
          showToast(`Orçamento ${budgetData.numero} atualizado com sucesso!`, 'success');
          setIsModalOpen(false);
        },
        onError: (err: any) => {
          showToast(`Erro ao atualizar orçamento: ${err.message || 'Falha na persistência'}`, 'error');
        }
      });
    } else {
      addMutation.mutate(budgetData, {
        onSuccess: () => {
          showToast(`Orçamento ${budgetData.numero} gravado com sucesso!`, 'success');
          setIsModalOpen(false);
        },
        onError: (err: any) => {
          showToast(`Erro ao salvar orçamento: ${err.message || 'Falha na persistência'}`, 'error');
        }
      });
    }
  };

  const handleConvertToSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversionBudget || isSubmittingSale) return;

    if (isBudgetInvoiced(conversionBudget)) {
      showToast(`O orçamento ${conversionBudget.numero} já foi faturado e não pode ser faturado novamente!`, 'error');
      setConversionBudget(null);
      return;
    }

    setIsSubmittingSale(true);
    const budgetSnapshot = conversionBudget;

    const novaVenda: Sale = {
      id: crypto.randomUUID(),
      numero: `VEN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      dataVenda: new Date().toISOString().split('T')[0],
      clienteId: budgetSnapshot.clienteId,
      itens: budgetSnapshot.itens,
      formaPagamento: paymentMethod,
      valorTotal: calculateTotal(budgetSnapshot.itens, budgetSnapshot.descontoGeral),
      statusPagamento: 'Pendente',
      orcamentoOrigemId: budgetSnapshot.id
    };

    addVendaMutation.mutate(novaVenda, {
      onSuccess: () => {
        editMutation.mutate({ ...budgetSnapshot, status: 'Faturado' });
        setConversionBudget(null);
        showToast(`Orçamento ${budgetSnapshot.numero} faturado com sucesso! Venda gerada.`, 'success');
        setIsSubmittingSale(false);
      },
      onError: (err) => {
        showToast(`Erro ao processar faturamento: ${err.message || 'Falha na operação'}`, 'error');
        setIsSubmittingSale(false);
      }
    });
  };

  const handleApproveBudget = (b: Budget) => {
    if (isBudgetInvoiced(b)) {
      showToast(`O orçamento ${b.numero} já está faturado e não pode ser alterado.`, 'error');
      return;
    }
    editMutation.mutate({ ...b, status: 'Aprovado' });
    showToast(`Orçamento ${b.numero} marcado como Aprovado!`, 'success');
  };

  // WhatsApp share generator helper
  const handleShareWhatsApp = (b: Budget) => {
    const client = clients.find(c => c.id === b.clienteId);
    if (!client) return;
    
    const text = `Olá ${client.nome}! Segue o link de faturamento de seu orçamento da ELMANEKO 3D:\n\n*Orçamento:* ${b.numero}\n*Validade:* ${formatDateBR(b.validade)}\n*Total:* R$ ${calculateTotal(b.itens, b.descontoGeral).toFixed(2)}\n\nAgradecemos a preferência!`;
    const encoded = encodeURIComponent(text);
    const link = `https://wa.me/${client.whatsapp.replace(/\D/g, '')}?text=${encoded}`;
    window.open(link, '_blank');
  };

  // FILTER & SORT COMPUTATION
  const filteredAndSortedBudgets = budgets.filter(b => {
    const invoiced = isBudgetInvoiced(b);
    const effectiveStatus = invoiced ? 'Faturado' : b.status;
    const totalVal = calculateTotal(b.itens, b.descontoGeral);

    if (filterClient !== 'todos' && b.clienteId !== filterClient) return false;
    if (filterStatus !== 'todos' && effectiveStatus !== filterStatus) return false;
    if (startDate && b.dataEmissao < startDate) return false;
    if (endDate && b.dataEmissao > endDate) return false;
    if (minValor !== '' && totalVal < Number(minValor)) return false;
    if (maxValor !== '' && totalVal > Number(maxValor)) return false;

    return true;
  }).sort((a, b) => {
    const clientA = (clients.find(c => c.id === a.clienteId)?.nome || '').toLowerCase();
    const clientB = (clients.find(c => c.id === b.clienteId)?.nome || '').toLowerCase();
    const totalA = calculateTotal(a.itens, a.descontoGeral);
    const totalB = calculateTotal(b.itens, b.descontoGeral);

    switch (sortBy) {
      case 'data_desc':
        return b.dataEmissao.localeCompare(a.dataEmissao) || b.numero.localeCompare(a.numero);
      case 'data_asc':
        return a.dataEmissao.localeCompare(b.dataEmissao) || a.numero.localeCompare(b.numero);
      case 'cliente_asc':
        return clientA.localeCompare(clientB);
      case 'cliente_desc':
        return clientB.localeCompare(clientA);
      case 'valor_desc':
        return totalB - totalA;
      case 'valor_asc':
        return totalA - totalB;
      default:
        return b.dataEmissao.localeCompare(a.dataEmissao);
    }
  });

  // KPIS TOTALIZADOS (Total Faturado, Pendente de Faturamento e Provisão)
  const faturadosBudgets = filteredAndSortedBudgets.filter(b => isBudgetInvoiced(b));
  const aprovadosBudgets = filteredAndSortedBudgets.filter(b => b.status === 'Aprovado' && !isBudgetInvoiced(b));
  const provisaoBudgets = filteredAndSortedBudgets.filter(b => (b.status === 'Aberto' || b.status === 'Enviado') && !isBudgetInvoiced(b));

  const totalFaturadoVal = faturadosBudgets.reduce((acc, b) => acc + calculateTotal(b.itens, b.descontoGeral), 0);
  const totalPendenteFaturamentoVal = aprovadosBudgets.reduce((acc, b) => acc + calculateTotal(b.itens, b.descontoGeral), 0);
  const totalProvisaoVal = provisaoBudgets.reduce((acc, b) => acc + calculateTotal(b.itens, b.descontoGeral), 0);

  return (
    <div className="space-y-6" id="budgets-module-container">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />

      <ConfirmDialog
        open={confirmDialog.open}
        title="Excluir Orçamento"
        description={
          confirmDialog.invoiced
            ? 'Este orçamento já está faturado com uma venda gerada. Deseja realmente excluí-lo?'
            : `Deseja excluir o orçamento ${confirmDialog.num}?`
        }
        confirmLabel="Excluir Orçamento"
        onConfirm={() => {
          deleteMutation.mutate(confirmDialog.id);
          showToast(`Orçamento ${confirmDialog.num} excluído.`, 'success');
          setConfirmDialog({ open: false, id: '', num: '', invoiced: false });
        }}
        onCancel={() => setConfirmDialog({ open: false, id: '', num: '', invoiced: false })}
      />
      
      {/* MODULE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="budgets-header">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Geração de Orçamentos</h2>
          <p className="text-sm text-neutral-400 mt-1">Gere propostas comerciais profissionais. Converta propostas aprovadas em vendas com apenas um clique.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          disabled={clients.length === 0 || products.length === 0}
          id="add-new-budget-btn"
          className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold rounded-xl shadow-md shadow-orange-600/10 flex items-center justify-center gap-2 hover:translate-y-[-1px] transition-all cursor-pointer disabled:opacity-45"
        >
          <Plus size={18} />
          Gerar Novo Orçamento
        </button>
      </div>

      {/* BUDGETS KPIS BOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 animate-fade-in" id="budgets-kpis">
        {/* Total Faturado */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase text-neutral-400">
            <span>Total Faturado (Tudo faturado)</span>
            <TrendingUp size={14} className="text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-300 mt-1">
            R$ {totalFaturadoVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-neutral-500 mt-1 font-mono">{faturadosBudgets.length} propostas liquidadas</p>
        </div>

        {/* Total Pendente de Faturamento */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase text-neutral-400">
            <span>Pendente de Faturamento (Aprovado)</span>
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-400 mt-1">
            R$ {totalPendenteFaturamentoVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-neutral-500 mt-1 font-mono">{aprovadosBudgets.length} propostas aprovadas</p>
        </div>

        {/* Provisão */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase text-neutral-400">
            <span>Provisão (Pendente Aprovação)</span>
            <FileText size={14} className="text-orange-500" />
          </div>
          <div className="text-xl font-black text-orange-400 mt-1">
            R$ {totalProvisaoVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-neutral-500 mt-1 font-mono">{provisaoBudgets.length} propostas em negociação</p>
        </div>
      </div>

      {(clients.length === 0 || products.length === 0) && (
        <div className="p-4 bg-amber-950/40 border border-amber-800 text-amber-200 text-sm rounded-xl" id="budget-warnings-box">
          ⚠️ <strong>Atenção:</strong> Você precisa ter clientes em <strong>Clientes</strong> e fichas técnicas cadastradas em <strong>Produtos</strong> para conseguir emitir orçamentos comerciais.
        </div>
      )}

      {/* FILTER & SORT CONTROL BAR */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3" id="budgets-filters-bar">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
          <span className="text-xs font-mono font-bold uppercase text-neutral-300 flex items-center gap-1.5">
            <Filter size={14} className="text-orange-500" /> Filtros e Ordenação de Orçamentos
          </span>
          {(filterClient !== 'todos' || filterStatus !== 'todos' || startDate || endDate || minValor !== '' || maxValor !== '' || sortBy !== 'data_desc') && (
            <button
              onClick={() => {
                setFilterClient('todos');
                setFilterStatus('todos');
                setStartDate('');
                setEndDate('');
                setMinValor('');
                setMaxValor('');
                setSortBy('data_desc');
              }}
              className="text-[11px] font-mono text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} /> Limpar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono text-xs">
          {/* Cliente */}
          <div>
            <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1 font-semibold">Cliente</label>
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="todos">Todos os Clientes</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1 font-semibold">Situação</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="Aberto">Aberto</option>
              <option value="Enviado">Enviado</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Faturado">Faturado</option>
              <option value="Rejeitado">Rejeitado</option>
              <option value="Expirado">Expirado</option>
            </select>
          </div>

          {/* Data Início / Fim */}
          <div>
            <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1 font-semibold">Data De</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1 font-semibold">Data Até</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Valor Range */}
          <div className="flex gap-1.5">
            <div className="flex-1">
              <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1 font-semibold">Val. Mín</label>
              <input
                type="number"
                placeholder="R$ 0"
                value={minValor}
                onChange={(e) => setMinValor(e.target.value)}
                className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1 font-semibold">Val. Máx</label>
              <input
                type="number"
                placeholder="R$ Max"
                value={maxValor}
                onChange={(e) => setMaxValor(e.target.value)}
                className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Ordenar por */}
          <div>
            <label className="block text-[10px] text-orange-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <ArrowUpDown size={10} /> Ordenar Por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-bold focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="data_desc">Data (Mais Recentes)</option>
              <option value="data_asc">Data (Mais Antigos)</option>
              <option value="cliente_asc">Cliente (A-Z)</option>
              <option value="cliente_desc">Cliente (Z-A)</option>
              <option value="valor_desc">Valor (Maior p/ Menor)</option>
              <option value="valor_asc">Valor (Menor p/ Maior)</option>
            </select>
          </div>
        </div>
      </div>

      {/* LIST OF BUDGETS */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl" id="budgets-table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="budgets-table">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/20 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                <th className="py-4 px-4 font-semibold">Orçamento</th>
                <th className="py-4 px-4 font-semibold">Cliente</th>
                <th className="py-4 px-4 font-semibold">Emissão / Validade / Entrega</th>
                <th className="py-4 px-4 text-right">Qtd Itens</th>
                <th className="py-4 px-4 text-right">Valor Final</th>
                <th className="py-4 px-4 font-semibold text-center">Status</th>
                <th className="py-4 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-sm text-neutral-300">
              {filteredAndSortedBudgets.length > 0 ? (
                filteredAndSortedBudgets.map(b => {
                  const client = clients.find(c => c.id === b.clienteId);
                  const itemsCount = b.itens.reduce((acc, it) => acc + it.quantidade, 0);
                  const totalVal = calculateTotal(b.itens, b.descontoGeral);
                  const invoiced = isBudgetInvoiced(b);

                  return (
                    <tr key={b.id} className="hover:bg-neutral-800/10 transition-colors" id={`row-budget-${b.id}`}>
                      <td className="py-3.5 px-4 font-mono font-black text-white">
                        {b.numero}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {client ? client.nome : <span className="text-red-400">Cliente removido</span>}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="text-neutral-400">{formatDateBR(b.dataEmissao)}</div>
                        <div className="text-neutral-500 text-[10px]">Expira: {formatDateBR(b.validade)}</div>
                        {b.previsaoEntrega && (
                          <div className="text-orange-400 font-semibold text-[10px] flex items-center gap-1 mt-0.5">
                            <Calendar size={10} /> Entrega: {formatDateBR(b.previsaoEntrega)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold">
                        {itemsCount} peças
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-orange-400">
                        R$ {totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                          invoiced ? 'bg-purple-950/80 border border-purple-500/40 text-purple-300' :
                          b.status === 'Aprovado' ? 'bg-emerald-950/60 border border-emerald-500/20 text-emerald-400' :
                          b.status === 'Enviado' ? 'bg-blue-950/60 border border-blue-500/20 text-blue-400' :
                          b.status === 'Aberto' ? 'bg-orange-950/60 border border-orange-500/20 text-orange-400' :
                          b.status === 'Rejeitado' ? 'bg-red-950/60 border border-red-500/20 text-red-400' :
                          'bg-neutral-950 border border-neutral-800 text-neutral-500'
                        }`}>
                          {invoiced ? 'Faturado' : b.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* VIEW PDF */}
                          <button
                            onClick={() => setPdfPreviewBudget(b)}
                            className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                            title="Visualizar Proposta / PDF"
                            id={`pdf-btn-${b.id}`}
                          >
                            <Eye size={15} />
                          </button>

                          {/* SHARE */}
                          <button
                            onClick={() => handleShareWhatsApp(b)}
                            className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-emerald-500 rounded transition-colors cursor-pointer"
                            title="Compartilhar por WhatsApp"
                            id={`share-btn-${b.id}`}
                          >
                            <Share2 size={15} />
                          </button>

                          {/* FLUXO DE STATUS: APROVAR | APROVADO + FATURAR | FATURADO (BLOQUEADO) */}
                          {invoiced ? (
                            <span className="px-2 py-0.5 bg-purple-950/50 border border-purple-500/30 text-purple-300 font-mono font-bold text-[10px] rounded flex items-center gap-1 cursor-not-allowed" title="Orçamento Faturado — Bloqueado para novos faturamentos">
                              <Check size={11} className="text-purple-400" /> Faturado
                            </span>
                          ) : b.status === 'Aprovado' ? (
                            <div className="flex items-center gap-1">
                              <span className="px-1.5 py-0.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[10px] rounded">
                                Aprovado
                              </span>
                              <button
                                onClick={() => setConversionBudget(b)}
                                className="px-2 py-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-mono font-bold text-[10px] rounded flex items-center gap-0.5 cursor-pointer shadow-md shadow-orange-600/20 active:scale-95 transition-all"
                                title="Faturar Orçamento (Gerar Venda)"
                                id={`convert-btn-${b.id}`}
                              >
                                <DollarSign size={11} /> Faturar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleApproveBudget(b)}
                              className="px-2 py-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600 hover:text-white font-mono font-bold text-[10px] rounded flex items-center gap-0.5 transition-all cursor-pointer"
                              title="Aprovar Orçamento"
                              id={`approve-btn-${b.id}`}
                            >
                              <CheckCircle2 size={11} /> Aprovar
                            </button>
                          )}

                          {/* EDIT / DELETE */}
                          <button
                            onClick={() => handleOpenEditModal(b)}
                            className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                            id={`edit-btn-${b.id}`}
                            title="Editar Orçamento"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmDialog({ open: true, id: b.id, num: b.numero, invoiced })}
                            className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                            id={`delete-btn-${b.id}`}
                            title="Excluir Orçamento"
                          >
                            <Trash2 size={14} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
              <td colSpan={7} className="py-12 text-center text-neutral-500 font-mono text-xs">
                    Nenhum orçamento emitido ainda. Clique em "Gerar Novo Orçamento" para propor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- FORM MODAL (NEW / EDIT BUDGET) --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="5xl"
        title={
          <span className="flex items-center gap-2">
            <FileText className="text-orange-500" />
            {editingBudget ? `Editar Orçamento ${editingBudget.numero}` : 'Gerar Orçamento Comercial'}
          </span>
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-semibold rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                const formEl = document.getElementById('budget-form-element') as HTMLFormElement;
                if (formEl) formEl.requestSubmit();
              }}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl cursor-pointer shadow-md shadow-orange-600/20"
            >
              Gravar Proposta
            </button>
          </>
        }
      >
        <form id="budget-form-element" onSubmit={handleSubmit} className="space-y-5 font-mono text-xs text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            
            {/* Cliente */}
            <div className="lg:col-span-2">
              <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Cliente *</label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nome} ({c.cpfCnpj})</option>
                ))}
              </select>
            </div>

            {/* Data emissao */}
            <div>
              <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Emissão</label>
              <input
                type="date"
                value={dataEmissao}
                onChange={(e) => setDataEmissao(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Validade */}
            <div>
              <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Validade</label>
              <input
                type="date"
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Previsao Entrega */}
            <div>
              <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold text-orange-400">Previsão Entrega</label>
              <input
                type="date"
                value={previsaoEntrega}
                onChange={(e) => setPrevisaoEntrega(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-orange-500/30 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Desconto Geral % */}
            <div>
              <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Desconto %</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={descontoGeral}
                onChange={(e) => setDescontoGeral(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

          </div>

          {/* ITENS DO ORÇAMENTO (BOM / PRODUTOS) */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Package size={14} className="text-orange-500" /> Peças & Serviços do Orçamento
              </h4>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="py-1 px-3 bg-neutral-900 hover:bg-neutral-850 text-orange-400 border border-neutral-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                + Adicionar Peça
              </button>
            </div>

            {itens.map((item, index) => {
              const prod = products.find(p => p.id === item.produtoId);

              return (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-neutral-900 p-3 rounded-lg border border-neutral-850 relative">
                  
                  {/* Produto Select */}
                  <div className="md:col-span-5">
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider text-[10px]">Peça / Modelo 3D *</label>
                    <select
                      value={item.produtoId}
                      onChange={(e) => handleProductSelectionChange(index, e.target.value)}
                      className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-white text-[11px] focus:outline-none focus:border-orange-500"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.nome} ({p.categoria}) - R$ {p.precoVenda.toFixed(2)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Qtd */}
                  <div className="md:col-span-2">
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider text-[10px]">Qtd *</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantidade}
                      onChange={(e) => handleItemChange(index, 'quantidade', Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-white text-[11px] focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Preco Unitario */}
                  <div className="md:col-span-2">
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider text-[10px]">Valor Unit. (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.valorUnitario}
                      onChange={(e) => handleItemChange(index, 'valorUnitario', Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-white text-[11px] focus:outline-none focus:border-orange-500 font-bold text-orange-400"
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="md:col-span-3 flex items-center justify-between">
                    <div>
                      <span className="block text-neutral-500 text-[9px] uppercase">Subtotal</span>
                      <strong className="text-white text-xs font-mono font-bold">
                        R$ {(item.quantidade * (item.valorUnitario - item.desconto)).toFixed(2)}
                      </strong>
                    </div>

                    {itens.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        className="text-red-500 hover:text-red-400 p-1 bg-neutral-950 rounded border border-neutral-850 cursor-pointer"
                        title="Remover Peça"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

          {/* TOTAL SUMMARY CARD */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex justify-between items-center">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider font-semibold">Valor Total Líquido da Cotação:</span>
            <span className="text-xl font-black font-mono text-emerald-400">
              R$ {calculateTotal(itens, descontoGeral).toFixed(2)}
            </span>
          </div>

          {/* OBSERVATIONS */}
          <div>
            <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Observações / Termos de Pagamento</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>
        </form>
      </Modal>

      {/* --- CONVERSION TO SALE CONFIRMATION MODAL --- */}
      {conversionBudget && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in" id="conversion-to-sale-modal">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm p-5 sm:p-6 shadow-2xl text-left max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-1.5">
              <Check className="text-emerald-500 animate-bounce" /> Faturar Orçamento {conversionBudget.numero}
            </h3>
            <p className="text-xs text-neutral-400 font-mono mb-4 leading-relaxed">
              Você está prestes a converter este orçamento em uma venda finalizada. Escolha a forma de pagamento preferida pelo cliente.
            </p>

            <form onSubmit={handleConvertToSaleSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Forma de Pagamento *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none cursor-pointer"
                >
                  <option value="Pix">Pix</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Boleto">Boleto Bancário</option>
                  <option value="Dinheiro">Dinheiro físico</option>
                </select>
              </div>

              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-1">
                <span className="text-neutral-500 uppercase text-[9px] block">Valor Comercial do Pedido</span>
                <strong className="text-orange-500 text-sm">
                  R$ {calculateTotal(conversionBudget.itens, conversionBudget.descontoGeral).toFixed(2)}
                </strong>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConversionBudget(null)}
                  className="px-3 py-1.5 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Confirmar Faturamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MÓDULO 11: PDF PREVIEW MODAL --- */}
      <BudgetPreviewModal
        isOpen={!!pdfPreviewBudget}
        onClose={() => setPdfPreviewBudget(null)}
        budget={pdfPreviewBudget}
        company={company || null}
        client={clients.find(c => c.id === pdfPreviewBudget?.clienteId || c.nome === pdfPreviewBudget?.clienteNome) || null}
        onSendWhatsApp={(b) => handleShareWhatsApp(b)}
      />
    </div>
  );
}
