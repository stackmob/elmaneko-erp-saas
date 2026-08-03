import React, { useState } from 'react';
import { 
  FinancialAccount, FinancialCategory, CostCenter, FinancialEntry, 
  FinancialMovement, FinancialTransfer, FinancialAuditLog, Client, 
  FinancialEntryStatus, FinancialAccountType, PurchaseCategory, SupplyUnit
} from '../types';
import { 
  DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, ArrowUpRight, 
  ArrowDownLeft, RefreshCw, Calendar, Search, Filter, Plus, CheckCircle, 
  XCircle, Clock, Shield, FileText, Download, Building, Users, AlertTriangle, 
  ChevronRight, Layers, PieChart, BarChart3, Lock, Check, ArrowRightLeft, Eye,
  Edit, Trash2, X
} from 'lucide-react';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import Toast from './ui/Toast';
import ConfirmDialog from './ui/ConfirmDialog';
import { DataList } from './ui/DataList';
import { formatDateBR } from '../utils/formatters';
import { useFinancialSummary } from '../hooks/useFinancialSummary';

export default function Financial() {
  const { 
    useContasFinanceiras, useAddContaFinanceira, useUpdateContaFinanceira, useDeleteContaFinanceira,
    useCategoriasFinanceiras, useAddCategoriaFinanceira, useUpdateCategoriaFinanceira, useDeleteCategoriaFinanceira,
    useCentrosCusto, useAddCentroCusto, useUpdateCentroCusto, useDeleteCentroCusto,
    useLancamentosFinanceiros, useAddLancamentoFinanceiro, useLiquidarLancamento, useConciliateLancamento, useDeleteLancamento, useSyncFinancialEntries,
    useMovimentacoesFinanceiras, useTransferenciasFinanceiras, useAddTransferenciaFinanceira,
    useAuditoriaFinanceira, useAddAuditLog,
    useClientes
  } = useData();

  const { data: accounts = [] } = useContasFinanceiras();
  const { data: categories = [] } = useCategoriasFinanceiras();
  const { data: costCenters = [] } = useCentrosCusto();
  const { data: entries = [] } = useLancamentosFinanceiros();
  const { data: transfers = [] } = useTransferenciasFinanceiras();
  const { data: auditLogs = [] } = useAuditoriaFinanceira();
  const { data: clients = [] } = useClientes();

  const addAccountMutation = useAddContaFinanceira();
  const updateAccountMutation = useUpdateContaFinanceira();
  const deleteAccountMutation = useDeleteContaFinanceira();

  const addCatMutation = useAddCategoriaFinanceira();
  const updateCatMutation = useUpdateCategoriaFinanceira();
  const deleteCatMutation = useDeleteCategoriaFinanceira();

  const addCCMutation = useAddCentroCusto();
  const updateCCMutation = useUpdateCentroCusto();
  const deleteCCMutation = useDeleteCentroCusto();

  const addEntryMutation = useAddLancamentoFinanceiro();
  const liquidateMutation = useLiquidarLancamento();
  const conciliateMutation = useConciliateLancamento();
  const deleteEntryMutation = useDeleteLancamento();
  const syncMutation = useSyncFinancialEntries();
  const addTransferMutation = useAddTransferenciaFinanceira();
  const addAuditMutation = useAddAuditLog();

  const handleSyncFinancial = () => {
    syncMutation.mutate(undefined, {
      onSuccess: (res) => {
        if (res && res.total > 0) {
          showToast(`Sincronização concluída! ${res.syncedSales} faturamento(s) de vendas e ${res.syncedPurchases} compra(s) alimentaram o Financeiro.`, 'success');
        } else {
          showToast('Todos os faturamentos de vendas e compras já estão alimentados no Financeiro!', 'info');
        }
      },
      onError: () => {
        showToast('Erro ao sincronizar faturamentos com o financeiro.', 'error');
      }
    });
  };

  const { toast, showToast, hideToast } = useToast();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'entries' | 'accounts' | 'transfers' | 'categories' | 'reports' | 'audit'
  >('dashboard');

  // Filters for Entries
  const [entrySearch, setEntrySearch] = useState('');
  const [entryStatusFilter, setEntryStatusFilter] = useState<string>('all');
  const [entryTypeFilter, setEntryTypeFilter] = useState<string>('all');

  // Modals state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isLiquidateModalOpen, setIsLiquidateModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isCCModalOpen, setIsCCModalOpen] = useState(false);
  const [selectedEntryForAction, setSelectedEntryForAction] = useState<FinancialEntry | null>(null);

  // Edit Objects State
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [editingCategory, setEditingCategory] = useState<FinancialCategory | null>(null);
  const [editingCC, setEditingCC] = useState<CostCenter | null>(null);

  // Form: Manual Entry
  const [entryTipo, setEntryTipo] = useState<'Receita' | 'Despesa'>('Receita');
  const [entryDoc, setEntryDoc] = useState('');
  const [entryClienteId, setEntryClienteId] = useState('');
  const [entryFornecedor, setEntryFornecedor] = useState('');
  const [entryDataVencimento, setEntryDataVencimento] = useState(new Date().toISOString().split('T')[0]);
  const [entryDataEmissao, setEntryDataEmissao] = useState(new Date().toISOString().split('T')[0]);
  const [entryValorBruto, setEntryValorBruto] = useState(150.00);
  const [entryDesconto, setEntryDesconto] = useState(0);
  const [entryAcrescimo, setEntryAcrescimo] = useState(0);
  const [entryFormaPagamento, setEntryFormaPagamento] = useState('PIX');
  const [entryContaId, setEntryContaId] = useState('');
  const [entryCategoriaId, setEntryCategoriaId] = useState('');
  const [entryCentroCustoId, setEntryCentroCustoId] = useState('');
  const [entryTotalParcelas, setEntryTotalParcelas] = useState(1);
  const [entryObservacoes, setEntryObservacoes] = useState('');

  // Form: Liquidação
  const [liqContaId, setLiqContaId] = useState('');
  const [liqData, setLiqData] = useState(new Date().toISOString().split('T')[0]);
  const [liqValorPago, setLiqValorPago] = useState(0);
  const [liqJuros, setLiqJuros] = useState(0);
  const [liqObs, setLiqObs] = useState('');

  // Form: Account
  const [accNome, setAccNome] = useState('');
  const [accTipo, setAccTipo] = useState<FinancialAccountType>('Conta Bancaria');
  const [accBanco, setAccBanco] = useState('Itaú');
  const [accAgencia, setAccAgencia] = useState('');
  const [accConta, setAccConta] = useState('');
  const [accDigito, setAccDigito] = useState('');
  const [accBandeira, setAccBandeira] = useState('Mastercard');
  const [accLimite, setAccLimite] = useState(5000);
  const [accSaldoInicial, setAccSaldoInicial] = useState(0);
  const [accSaldoAtual, setAccSaldoAtual] = useState(0);
  const [accSituacao, setAccSituacao] = useState<'Ativa' | 'Inativa'>('Ativa');

  // Form: Transfer
  const [trOrigemId, setTrOrigemId] = useState('');
  const [trDestinoId, setTrDestinoId] = useState('');
  const [trValor, setTrValor] = useState(500);
  const [trData, setTrData] = useState(new Date().toISOString().split('T')[0]);
  const [trObs, setTrObs] = useState('');

  // Form: Category & CC
  const [catNome, setCatNome] = useState('');
  const [catTipo, setCatTipo] = useState<'Receita' | 'Despesa'>('Despesa');
  const [catDesc, setCatDesc] = useState('');

  const [ccCodigo, setCcCodigo] = useState('');
  const [ccNome, setCcNome] = useState('');
  const [ccDesc, setCcDesc] = useState('');

  // Confirm Dialog
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; desc: string; action: () => void }>({ open: false, title: '', desc: '', action: () => {} });

  const { activeEntries, filteredEntries, totalReceitasMes, totalDespesasMes, lucroLiquido, totalSaldoBancario, totalAReceber, totalAPagar, totalVencidos } = useFinancialSummary(entries, accounts, clients, { search: entrySearch, status: entryStatusFilter, type: entryTypeFilter });

  // Handlers for Accounts (Edit & Delete)
  const handleOpenAccountModal = (acc?: FinancialAccount) => {
    if (acc) {
      setEditingAccount(acc);
      setAccNome(acc.nome);
      setAccTipo(acc.tipo);
      setAccBanco(acc.banco || '');
      setAccAgencia(acc.agencia || '');
      setAccConta(acc.conta || '');
      setAccDigito(acc.digito || '');
      setAccBandeira(acc.bandeira || 'Mastercard');
      setAccLimite(acc.limite || 0);
      setAccSaldoInicial(acc.saldoInicial || 0);
      setAccSaldoAtual(acc.saldoAtual || 0);
      setAccSituacao(acc.situacao || 'Ativa');
    } else {
      setEditingAccount(null);
      setAccNome('');
      setAccTipo('Conta Bancaria');
      setAccBanco('Itaú');
      setAccAgencia('');
      setAccConta('');
      setAccDigito('');
      setAccBandeira('Mastercard');
      setAccLimite(5000);
      setAccSaldoInicial(0);
      setAccSaldoAtual(0);
      setAccSituacao('Ativa');
    }
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accNome) return;

    if (editingAccount) {
      const updated: FinancialAccount = {
        ...editingAccount,
        nome: accNome,
        tipo: accTipo,
        banco: accBanco,
        agencia: accAgencia,
        conta: accConta,
        digito: accDigito,
        bandeira: accBandeira,
        limite: Number(accLimite),
        saldoInicial: Number(accSaldoInicial),
        saldoAtual: Number(accSaldoAtual),
        situacao: accSituacao
      };

      updateAccountMutation.mutate(updated, {
        onSuccess: () => {
          setIsAccountModalOpen(false);
          showToast('Conta / Cartão atualizado com sucesso!', 'success');
        }
      });
    } else {
      const newAcc: FinancialAccount = {
        id: crypto.randomUUID(),
        nome: accNome,
        tipo: accTipo,
        banco: accBanco,
        agencia: accAgencia,
        conta: accConta,
        digito: accDigito,
        bandeira: accBandeira,
        limite: Number(accLimite),
        limiteDisponivel: Number(accLimite),
        saldoInicial: Number(accSaldoInicial),
        saldoAtual: Number(accSaldoInicial),
        situacao: accSituacao
      };

      addAccountMutation.mutate(newAcc, {
        onSuccess: () => {
          setIsAccountModalOpen(false);
          showToast('Nova conta financeira cadastrada com sucesso!', 'success');
        }
      });
    }
  };

  const handleDeleteAccount = (acc: FinancialAccount) => {
    setConfirmDialog({
      open: true,
      title: 'Excluir Conta Financeira',
      desc: `Tem certeza que deseja excluir a conta "${acc.nome}"? Os lançamentos associados permanecerão no histórico.`,
      action: () => {
        deleteAccountMutation.mutate(acc.id, {
          onSuccess: () => showToast('Conta financeira excluída.', 'warning')
        });
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
  };

  // Handlers for Categories (Edit & Delete)
  const handleOpenCatModal = (cat?: FinancialCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setCatNome(cat.nome);
      setCatTipo(cat.tipo);
      setCatDesc(cat.descricao || '');
    } else {
      setEditingCategory(null);
      setCatNome('');
      setCatTipo('Despesa');
      setCatDesc('');
    }
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNome) return;

    if (editingCategory) {
      updateCatMutation.mutate(
        { ...editingCategory, nome: catNome, tipo: catTipo, descricao: catDesc },
        {
          onSuccess: () => {
            setIsCatModalOpen(false);
            showToast('Categoria do Plano de Contas atualizada!', 'success');
          }
        }
      );
    } else {
      addCatMutation.mutate(
        { nome: catNome, tipo: catTipo, descricao: catDesc },
        {
          onSuccess: () => {
            setIsCatModalOpen(false);
            showToast('Categoria adicionada ao Plano de Contas!', 'success');
          }
        }
      );
    }
  };

  const handleDeleteCategory = (cat: FinancialCategory) => {
    setConfirmDialog({
      open: true,
      title: 'Excluir Categoria',
      desc: `Deseja excluir a categoria "${cat.nome}" do Plano de Contas?`,
      action: () => {
        deleteCatMutation.mutate(cat.id, {
          onSuccess: () => showToast('Categoria excluída do Plano de Contas.', 'warning')
        });
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
  };

  // Handlers for Cost Centers (Edit & Delete)
  const handleOpenCCModal = (cc?: CostCenter) => {
    if (cc) {
      setEditingCC(cc);
      setCcCodigo(cc.codigo);
      setCcNome(cc.nome);
      setCcDesc(cc.descricao || '');
    } else {
      setEditingCC(null);
      setCcCodigo(`CC-0${costCenters.length + 1}`);
      setCcNome('');
      setCcDesc('');
    }
    setIsCCModalOpen(true);
  };

  const handleSaveCostCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ccNome || !ccCodigo) return;

    if (editingCC) {
      updateCCMutation.mutate(
        { ...editingCC, codigo: ccCodigo, nome: ccNome, descricao: ccDesc },
        {
          onSuccess: () => {
            setIsCCModalOpen(false);
            showToast('Centro de Custo atualizado com sucesso!', 'success');
          }
        }
      );
    } else {
      addCCMutation.mutate(
        { codigo: ccCodigo, nome: ccNome, descricao: ccDesc },
        {
          onSuccess: () => {
            setIsCCModalOpen(false);
            showToast('Centro de Custo cadastrado!', 'success');
          }
        }
      );
    }
  };

  const handleDeleteCostCenter = (cc: CostCenter) => {
    setConfirmDialog({
      open: true,
      title: 'Excluir Centro de Custo',
      desc: `Deseja excluir o centro de custo "${cc.nome}" (${cc.codigo})?`,
      action: () => {
        deleteCCMutation.mutate(cc.id, {
          onSuccess: () => showToast('Centro de Custo excluído.', 'warning')
        });
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
  };

  // Manual Entries Handler
  const handleOpenEntryModal = () => {
    setEntryTipo('Receita');
    setEntryDoc(`DOC-${Date.now().toString().slice(-6)}`);
    setEntryClienteId('');
    setEntryFornecedor('');
    setEntryDataVencimento(new Date().toISOString().split('T')[0]);
    setEntryValorBruto(150.00);
    setEntryDesconto(0);
    setEntryFormaPagamento('PIX');
    setEntryContaId(accounts.length > 0 ? accounts[0].id : '');
    setEntryCategoriaId(categories.length > 0 ? categories[0].id : '');
    setEntryCentroCustoId(costCenters.length > 0 ? costCenters[0].id : '');
    setEntryTotalParcelas(1);
    setEntryObservacoes('');
    setIsEntryModalOpen(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (entryValorBruto <= 0) {
      showToast('O valor do lançamento deve ser maior que zero.', 'error');
      return;
    }

    const valorLiquido = entryValorBruto - entryDesconto + entryAcrescimo;
    const isParcelado = entryTotalParcelas > 1;

    if (isParcelado) {
      const valorParcela = Number((valorLiquido / entryTotalParcelas).toFixed(2));
      const parentId = crypto.randomUUID();

      for (let i = 1; i <= entryTotalParcelas; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + (i - 1));

        const parcelEntry: FinancialEntry = {
          id: i === 1 ? parentId : crypto.randomUUID(),
          numeroDocumento: `${entryDoc}-${i}/${entryTotalParcelas}`,
          tipo: entryTipo,
          origem: 'Avulso',
          clienteId: entryClienteId || undefined,
          fornecedor: entryFornecedor || undefined,
          dataEmissao: entryDataEmissao,
          dataVencimento: dueDate.toISOString().split('T')[0],
          valorBruto: Number((entryValorBruto / entryTotalParcelas).toFixed(2)),
          desconto: Number((entryDesconto / entryTotalParcelas).toFixed(2)),
          acrescimo: Number((entryAcrescimo / entryTotalParcelas).toFixed(2)),
          valorLiquido: valorParcela,
          formaPagamento: entryFormaPagamento,
          contaFinanceiraId: entryContaId || undefined,
          categoriaId: entryCategoriaId || undefined,
          centroCustoId: entryCentroCustoId || undefined,
          parcelaAtual: i,
          totalParcelas: entryTotalParcelas,
          parcelaPaiId: i > 1 ? parentId : undefined,
          status: 'Aberto',
          conciliado: false,
          observacoes: entryObservacoes
        };

        addEntryMutation.mutate(parcelEntry);
      }
    } else {
      const singleEntry: FinancialEntry = {
        id: crypto.randomUUID(),
        numeroDocumento: entryDoc,
        tipo: entryTipo,
        origem: 'Avulso',
        clienteId: entryClienteId || undefined,
        fornecedor: entryFornecedor || undefined,
        dataEmissao: entryDataEmissao,
        dataVencimento: entryDataVencimento,
        valorBruto: Number(entryValorBruto),
        desconto: Number(entryDesconto),
        acrescimo: Number(entryAcrescimo),
        valorLiquido,
        formaPagamento: entryFormaPagamento,
        contaFinanceiraId: entryContaId || undefined,
        categoriaId: entryCategoriaId || undefined,
        centroCustoId: entryCentroCustoId || undefined,
        parcelaAtual: 1,
        totalParcelas: 1,
        status: 'Aberto',
        conciliado: false,
        observacoes: entryObservacoes
      };

      addEntryMutation.mutate(singleEntry);
    }

    addAuditMutation.mutate({
      id: crypto.randomUUID(),
      dataHora: new Date().toISOString(),
      usuario: 'Administrador ERP',
      ip: '127.0.0.1',
      operacao: `Criou Lançamento (${entryTipo})`,
      entidade: 'FinancialEntry',
      entidadeId: entryDoc,
      valorNovo: `R$ ${valorLiquido.toFixed(2)}`
    });

    setIsEntryModalOpen(false);
    showToast(isParcelado ? `${entryTotalParcelas} parcelas geradas com sucesso!` : 'Lançamento registrado!', 'success');
  };

  const handleOpenLiquidate = (entry: FinancialEntry) => {
    setSelectedEntryForAction(entry);
    setLiqContaId(accounts.length > 0 ? accounts[0].id : '');
    setLiqData(new Date().toISOString().split('T')[0]);
    setLiqValorPago(entry.valorLiquido);
    setLiqJuros(0);
    setLiqObs('');
    setIsLiquidateModalOpen(true);
  };

  const handleSaveLiquidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntryForAction || !liqContaId) {
      showToast('Selecione a conta para liquidação.', 'error');
      return;
    }

    liquidateMutation.mutate(
      {
        id: selectedEntryForAction.id,
        contaFinanceiraId: liqContaId,
        valorPago: Number(liqValorPago),
        dataLiquidacao: liqData,
        jurosMulta: Number(liqJuros)
      },
      {
        onSuccess: () => {
          addAuditMutation.mutate({
            id: crypto.randomUUID(),
            dataHora: new Date().toISOString(),
            usuario: 'Administrador ERP',
            ip: '127.0.0.1',
            operacao: 'Liquidou Título',
            entidade: 'FinancialEntry',
            entidadeId: selectedEntryForAction.id,
            valorAnterior: selectedEntryForAction.status,
            valorNovo: 'Liquidado'
          });
          setIsLiquidateModalOpen(false);
          showToast('Título liquidado e saldo bancário atualizado!', 'success');
        },
        onError: () => showToast('Erro ao liquidar título.', 'error')
      }
    );
  };

  const handleConciliate = (entry: FinancialEntry) => {
    conciliateMutation.mutate(
      { id: entry.id, tipoConciliacao: 'Extrato Bancário / PIX' },
      {
        onSuccess: () => {
          showToast('Lançamento marcado como Conciliado!', 'success');
        }
      }
    );
  };

  const handleSaveTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trOrigemId || !trDestinoId || trValor <= 0) {
      showToast('Selecione contas de origem e destino válidas e valor maior que zero.', 'error');
      return;
    }
    if (trOrigemId === trDestinoId) {
      showToast('A conta de origem e destino não podem ser iguais.', 'error');
      return;
    }

    addTransferMutation.mutate(
      {
        data: trData,
        contaOrigemId: trOrigemId,
        contaDestinoId: trDestinoId,
        valor: Number(trValor),
        observacoes: trObs
      },
      {
        onSuccess: () => {
          setIsTransferModalOpen(false);
          showToast('Transferência efetuada e saldos atualizados!', 'success');
        },
        onError: () => showToast('Erro ao efetuar transferência.', 'error')
      }
    );
  };

  // Export Helpers
  const exportToCSV = (dataList: any[], filename: string) => {
    if (!dataList || dataList.length === 0) {
      showToast('Nenhum dado para exportar.', 'error');
      return;
    }
    const keys = Object.keys(dataList[0]);
    const csvRows = [
      keys.join(';'),
      ...dataList.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(';'))
    ];
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    showToast(`Arquivo ${filename}.csv exportado com sucesso!`, 'success');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="financial-module-root">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        description={confirmDialog.desc}
        confirmLabel="Confirmar Operação"
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
      />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="financial-header">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <DollarSign className="text-orange-500" size={24} />
            Módulo Financeiro Integral (ERP Enterprise)
          </h2>
          <p className="text-sm text-neutral-400 mt-1">Gestão unificada de Contas a Receber, Contas a Pagar, Conciliação, Fluxo de Caixa, Bancos, Cartões e Auditoria.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncFinancial}
            className="py-2.5 px-3 bg-emerald-950/80 border border-emerald-500/30 hover:bg-emerald-900 text-emerald-300 font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer text-xs transition-colors"
            title="Sincronizar faturamentos de vendas e compras retroativas para o financeiro"
          >
            <RefreshCw size={15} className={syncMutation.isPending ? 'animate-spin' : ''} />
            Sincronizar Faturamentos
          </button>

          <button
            onClick={handleOpenEntryModal}
            className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl shadow-md shadow-orange-600/10 flex items-center gap-2 cursor-pointer text-xs"
          >
            <Plus size={16} />
            + Novo Lançamento Manual
          </button>

          <button
            onClick={() => {
              setTrOrigemId(accounts.length > 0 ? accounts[0].id : '');
              setTrDestinoId(accounts.length > 1 ? accounts[1].id : '');
              setTrValor(500);
              setIsTransferModalOpen(true);
            }}
            className="py-2.5 px-3 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-200 font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <ArrowRightLeft size={15} />
            Transferência
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex overflow-x-auto gap-2 border-b border-neutral-800 pb-2 scrollbar-none" id="financial-tabs">
        {[
          { id: 'dashboard', label: '📊 Dashboard & Fluxo', icon: BarChart3 },
          { id: 'entries', label: '💰 Contas A Receber / Pagar', icon: DollarSign },
          { id: 'accounts', label: '🏦 Bancos & Cartões', icon: Wallet },
          { id: 'transfers', label: '💸 Transferências', icon: ArrowRightLeft },
          { id: 'categories', label: '🏷️ Plano de Contas & CC', icon: Layers },
          { id: 'reports', label: '📄 Relatórios & Exportação', icon: FileText },
          { id: 'audit', label: '🛡️ Trilha de Auditoria', icon: Shield },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 px-4 rounded-xl font-mono text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DASHBOARD & FLUXO DE CAIXA */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in" id="financial-tab-dashboard">
          
          {/* TOP SUMMARY KPIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase block">Receitas Acumuladas</span>
                <strong className="text-xl font-black font-mono text-emerald-400 mt-1 block">
                  R$ {totalReceitasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
                <span className="text-[10px] text-neutral-500 mt-0.5 block">Liquidado / Recebido</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ArrowUpRight size={22} />
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase block">Despesas Acumuladas</span>
                <strong className="text-xl font-black font-mono text-red-400 mt-1 block">
                  R$ {totalDespesasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
                <span className="text-[10px] text-neutral-500 mt-0.5 block">Pago / Insumos & Infra</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-400">
                <ArrowDownLeft size={22} />
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase block">Lucro Líquido Realizado</span>
                <strong className={`text-xl font-black font-mono mt-1 block ${lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  R$ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
                <span className="text-[10px] text-neutral-500 mt-0.5 block">Receitas - Despesas</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-950/50 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <DollarSign size={22} />
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase block">Saldo Total em Contas</span>
                <strong className="text-xl font-black font-mono text-white mt-1 block">
                  R$ {totalSaldoBancario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
                <span className="text-[10px] text-neutral-500 mt-0.5 block">{accounts.length} contas bancárias/carteiras</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-950/50 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Wallet size={22} />
              </div>
            </div>

          </div>

          {/* SECONDARY KPIS: A RECEBER, A PAGAR & INADIMPLÊNCIA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <TrendingUp size={20} />
              </div>
              <div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase block">Contas A Receber (Em Aberto)</span>
                <strong className="text-lg font-mono text-emerald-400 font-bold block">
                  R$ {totalAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-950/40 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <TrendingDown size={20} />
              </div>
              <div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase block">Contas A Pagar (Em Aberto)</span>
                <strong className="text-lg font-mono text-red-400 font-bold block">
                  R$ {totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-950/40 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase block">Títulos Vencidos / Inadimplência</span>
                <strong className="text-lg font-mono text-amber-400 font-bold block">
                  R$ {totalVencidos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>

          </div>

          {/* DYNAMIC CASH FLOW CHART & BREAKDOWN */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* CASH FLOW PROJECTION BAR CHART */}
            <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 size={16} className="text-orange-500" />
                  Fluxo de Caixa & Projeção Real (Últimos 6 Meses)
                </h3>
                <span className="text-xs font-mono text-neutral-500">Dados reais consolidados</span>
              </div>

              {(() => {
                const getLast6MonthsData = () => {
                  const months = [];
                  const now = new Date();
                  for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short' });
                    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

                    const receita = activeEntries
                      .filter(e => e.tipo === 'Receita' && (e.status === 'Liquidado' || e.status === 'Conciliado') && (e.dataLiquidacao || e.dataVencimento).startsWith(yearMonth))
                      .reduce((acc, e) => acc + (e.valorPago || e.valorLiquido), 0);

                    const despesa = activeEntries
                      .filter(e => e.tipo === 'Despesa' && (e.status === 'Liquidado' || e.status === 'Conciliado') && (e.dataLiquidacao || e.dataVencimento).startsWith(yearMonth))
                      .reduce((acc, e) => acc + (e.valorPago || e.valorLiquido), 0);

                    months.push({
                      month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1).replace('.', ''),
                      receita,
                      despesa
                    });
                  }
                  return months;
                };

                const chartData = getLast6MonthsData();
                const maxVal = Math.max(100, ...chartData.map(m => Math.max(m.receita, m.despesa)));

                return (
                  <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2 border-b border-neutral-800 pb-2">
                    {chartData.map((item, idx) => {
                      const recH = maxVal > 0 ? Math.min(100, (item.receita / maxVal) * 100) : 0;
                      const desH = maxVal > 0 ? Math.min(100, (item.despesa / maxVal) * 100) : 0;

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                          <div className="flex items-end gap-1.5 w-full justify-center h-full">
                            <div
                              style={{ height: `${Math.max(recH, 4)}%` }}
                              className={`w-4 sm:w-6 rounded-t transition-all relative ${item.receita > 0 ? 'bg-emerald-500/80 group-hover:bg-emerald-400' : 'bg-neutral-800'}`}
                              title={`Receitas ${item.month}: R$ ${item.receita.toFixed(2)}`}
                            />
                            <div
                              style={{ height: `${Math.max(desH, 4)}%` }}
                              className={`w-4 sm:w-6 rounded-t transition-all relative ${item.despesa > 0 ? 'bg-red-500/80 group-hover:bg-red-400' : 'bg-neutral-800'}`}
                              title={`Despesas ${item.month}: R$ ${item.despesa.toFixed(2)}`}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-neutral-400 font-bold">{item.month}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              <div className="flex justify-center gap-6 font-mono text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-emerald-500 rounded" />
                  <span>Receitas Realizadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded" />
                  <span>Despesas Realizadas</span>
                </div>
              </div>
            </div>

            {/* EXPENSES BY CATEGORY */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
                <PieChart size={16} className="text-orange-500" />
                Despesas por Categoria
              </h3>

              {(() => {
                const categoryMap: { [key: string]: number } = {};
                activeEntries
                  .filter(e => e.tipo === 'Despesa' && (e.status === 'Liquidado' || e.status === 'Conciliado'))
                  .forEach(e => {
                    const catObj = categories.find(c => c.id === e.categoriaId);
                    const catName = catObj ? catObj.nome : 'Outras Despesas';
                    categoryMap[catName] = (categoryMap[catName] || 0) + (e.valorPago || e.valorLiquido);
                  });

                const totalExp = Object.values(categoryMap).reduce((a, b) => a + b, 0);
                const items = Object.entries(categoryMap).map(([cat, val], idx) => {
                  const colors = ['bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-red-500'];
                  return {
                    cat,
                    valor: val,
                    pct: totalExp > 0 ? Math.round((val / totalExp) * 100) : 0,
                    color: colors[idx % colors.length]
                  };
                });

                if (items.length === 0) {
                  return (
                    <div className="py-12 text-center text-neutral-500 font-mono text-xs italic">
                      Nenhuma despesa liquidada registrada no momento.
                    </div>
                  );
                }

                return (
                  <div className="space-y-3 font-mono text-xs">
                    {items.map((c, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-neutral-300">
                          <span className="truncate max-w-[160px]">{c.cat}</span>
                          <strong className="text-white">R$ {c.valor.toFixed(2)} ({c.pct}%)</strong>
                        </div>
                        <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${c.color}`} style={{ width: `${c.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: CONTAS A RECEBER E A PAGAR (LANÇAMENTOS) */}
      {activeTab === 'entries' && (
        <div className="space-y-4 animate-fade-in" id="financial-tab-entries">
          
          {/* SEARCH & FILTERS BAR */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
              <input
                type="text"
                value={entrySearch}
                onChange={(e) => setEntrySearch(e.target.value)}
                placeholder="Pesquisar por documento, cliente, fornecedor ou observações..."
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <select
              value={entryTypeFilter}
              onChange={(e) => setEntryTypeFilter(e.target.value)}
              className="px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white font-mono focus:outline-none cursor-pointer"
            >
              <option value="all">Todos os Tipos (Receitas & Despesas)</option>
              <option value="Receita">Apenas Receitas (+)</option>
              <option value="Despesa">Apenas Despesas (-)</option>
            </select>

            <select
              value={entryStatusFilter}
              onChange={(e) => setEntryStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white font-mono focus:outline-none cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="Aberto">Aberto</option>
              <option value="Pendente">Pendente</option>
              <option value="Liquidado">Liquidado</option>
              <option value="Conciliado">Conciliado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          {/* TABLE OF FINANCIAL ENTRIES */}
          <DataList<FinancialEntry>
            data={filteredEntries}
            rowKey={(e) => e.id}
            columns={[
              {
                key: 'documento',
                header: 'Documento / Origem',
                render: (e) => (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded ${e.tipo === 'Receita' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-red-950 text-red-400 border border-red-500/30'}`}>
                        {e.tipo === 'Receita' ? '+ Receita' : '- Despesa'}
                      </span>
                      <strong className="text-white font-mono text-sm">{e.numeroDocumento}</strong>
                    </div>
                    <span className="text-[11px] text-neutral-500 font-mono block mt-0.5">Origem: {e.origem}</span>
                  </div>
                )
              },
              {
                key: 'entidade',
                header: 'Cliente / Fornecedor',
                render: (e) => {
                  const clientObj = clients.find(c => c.id === e.clienteId);
                  return (
                    <span className="text-neutral-200 font-semibold text-xs">
                      {clientObj ? clientObj.nome : (e.fornecedor || 'Geral')}
                    </span>
                  );
                }
              },
              {
                key: 'vencimento',
                header: 'Vencimento',
                align: 'center',
                render: (e) => (
                  <span className={`font-mono text-xs font-bold ${new Date(e.dataVencimento) < new Date() && e.status === 'Aberto' ? 'text-amber-400' : 'text-neutral-300'}`}>
                    {formatDateBR(e.dataVencimento)}
                  </span>
                )
              },
              {
                key: 'valor',
                header: 'Valor Líquido',
                align: 'right',
                render: (e) => (
                  <div className="text-right font-mono">
                    <span className={`font-black text-sm ${e.tipo === 'Receita' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {e.tipo === 'Receita' ? '+' : '-'} R$ {e.valorLiquido.toFixed(2)}
                    </span>
                    {e.totalParcelas && e.totalParcelas > 1 && (
                      <span className="text-[10px] text-neutral-500 block">Parc {e.parcelaAtual}/{e.totalParcelas}</span>
                    )}
                  </div>
                )
              },
              {
                key: 'status',
                header: 'Situação / Status',
                align: 'center',
                render: (e) => {
                  let badge = 'bg-neutral-800 text-neutral-400';
                  if (e.status === 'Aberto') badge = 'bg-blue-950 text-blue-400 border border-blue-500/30';
                  if (e.status === 'Liquidado') badge = 'bg-emerald-950 text-emerald-400 border border-emerald-500/30';
                  if (e.status === 'Conciliado') badge = 'bg-purple-950 text-purple-400 border border-purple-500/30';
                  if (e.status === 'Cancelado') badge = 'bg-neutral-900 text-neutral-600 line-through';

                  return (
                    <span className={`px-2.5 py-1 text-[10px] font-bold font-mono rounded-lg ${badge}`}>
                      {e.status}
                    </span>
                  );
                }
              },
              {
                key: 'acoes',
                header: 'Ações Financeiras',
                align: 'right',
                render: (e) => (
                  <div className="flex items-center justify-end gap-1.5">
                    {e.status !== 'Liquidado' && e.status !== 'Conciliado' && e.status !== 'Cancelado' && (
                      <button
                        onClick={() => handleOpenLiquidate(e)}
                        className="py-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold font-mono cursor-pointer shadow"
                      >
                        Liquidar / Baixar
                      </button>
                    )}

                    {e.status === 'Liquidado' && !e.conciliado && (
                      <button
                        onClick={() => handleConciliate(e)}
                        className="py-1 px-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-[11px] font-bold font-mono cursor-pointer shadow"
                      >
                        Conciliar
                      </button>
                    )}
                  </div>
                )
              }
            ]}
            extraColumns={[
              {
                key: 'observacoes',
                header: 'Observações',
                render: (e) => <span className="text-neutral-300 font-mono text-xs">{e.observacoes || '—'}</span>
              }
            ]}
            onDelete={(e) => {
              setConfirmDialog({
                open: true,
                title: 'Excluir Título Financeiro',
                desc: `Deseja realizar o soft-delete do título ${e.numeroDocumento}? O histórico de auditoria será mantido.`,
                action: () => {
                  deleteEntryMutation.mutate(e.id, {
                    onSuccess: () => showToast('Título removido com soft delete.', 'warning')
                  });
                  setConfirmDialog({ ...confirmDialog, open: false });
                }
              });
            }}
            emptyMessage={entrySearch ? 'Nenhum lançamento encontrado para a pesquisa.' : 'Nenhum lançamento financeiro cadastrado.'}
          />

        </div>
      )}

      {/* TAB 3: CONTAS BANCÁRIAS, CARTÕES E CARTEIRAS */}
      {activeTab === 'accounts' && (
        <div className="space-y-6 animate-fade-in" id="financial-tab-accounts">
          
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Wallet className="text-orange-500" size={20} />
              Contas Bancárias, Cartões de Crédito & Carteiras Digitais
            </h3>
            <button
              onClick={() => handleOpenAccountModal()}
              className="py-2 px-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={15} /> Nova Conta / Cartão
            </button>
          </div>

          {/* ACCOUNTS CARDS GRID WITH EDIT & DELETE ACTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {accounts.map(acc => (
              <div key={acc.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-orange-400 font-bold block">{acc.tipo}</span>
                      <h4 className="text-base font-bold text-white mt-0.5">{acc.nome}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${acc.situacao === 'Ativa' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-950 text-neutral-500'}`}>
                      {acc.situacao}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-neutral-800 mt-2">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase block">Saldo Atual em Conta</span>
                    <strong className="text-2xl font-black font-mono text-emerald-400 block mt-0.5">
                      R$ {acc.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>

                  {acc.tipo === 'Cartao Credito' && (
                    <div className="text-xs font-mono text-neutral-400 space-y-1 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 mt-2">
                      <div className="flex justify-between">
                        <span>Limite Total:</span>
                        <strong className="text-white">R$ {acc.limite?.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Fechamento / Venc:</span>
                        <strong className="text-orange-400">Dia {acc.diaFechamento || 15} / Dia {acc.diaVencimento || 25}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* EDIT & DELETE ACTION BAR */}
                <div className="flex justify-end items-center gap-2 pt-2 border-t border-neutral-800/80">
                  <button
                    onClick={() => handleOpenAccountModal(acc)}
                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-mono"
                    title="Editar Conta / Cartão"
                  >
                    <Edit size={14} /> Editar
                  </button>
                  <button
                    onClick={() => handleDeleteAccount(acc)}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-mono"
                    title="Excluir Conta"
                  >
                    <Trash2 size={14} /> Excluir
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 4: TRANSFERÊNCIAS ENTRE CONTAS */}
      {activeTab === 'transfers' && (
        <div className="space-y-6 animate-fade-in" id="financial-tab-transfers">
          
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="text-orange-500" size={20} />
              Histórico de Transferências entre Contas & Carteiras
            </h3>
            <button
              onClick={() => {
                setTrOrigemId(accounts.length > 0 ? accounts[0].id : '');
                setTrDestinoId(accounts.length > 1 ? accounts[1].id : '');
                setTrValor(500);
                setIsTransferModalOpen(true);
              }}
              className="py-2 px-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={15} /> Nova Transferência
            </button>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/40 uppercase text-neutral-400">
                  <th className="p-3.5">Data</th>
                  <th className="p-3.5">Conta Origem (Débito)</th>
                  <th className="p-3.5">Conta Destino (Crédito)</th>
                  <th className="p-3.5 text-right">Valor Transferido</th>
                  <th className="p-3.5">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-300">
                {transfers.length > 0 ? (
                  transfers.map(tr => {
                    const orig = accounts.find(a => a.id === tr.contaOrigemId);
                    const dest = accounts.find(a => a.id === tr.contaDestinoId);

                    return (
                      <tr key={tr.id} className="hover:bg-neutral-800/20">
                        <td className="p-3.5">{formatDateBR(tr.data)}</td>
                        <td className="p-3.5 font-bold text-red-400">{orig?.nome || tr.contaOrigemId}</td>
                        <td className="p-3.5 font-bold text-emerald-400">{dest?.nome || tr.contaDestinoId}</td>
                        <td className="p-3.5 text-right font-black text-white">R$ {tr.valor.toFixed(2)}</td>
                        <td className="p-3.5 text-neutral-500">{tr.observacoes || '—'}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-neutral-500 italic">
                      Nenhuma transferência realizada entre contas ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 5: PLANO DE CONTAS & CENTROS DE CUSTO WITH EDIT & DELETE */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in" id="financial-tab-categories">
          
          {/* PLANO DE CONTAS (CATEGORIAS) */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-orange-500" />
                Plano de Contas (Categorias)
              </h3>
              <button
                onClick={() => handleOpenCatModal()}
                className="py-1.5 px-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1"
              >
                <Plus size={14} /> + Categoria
              </button>
            </div>

            <div className="space-y-2 font-mono text-xs max-h-96 overflow-y-auto">
              {categories.map(cat => (
                <div key={cat.id} className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{cat.nome}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${cat.tipo === 'Receita' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                        {cat.tipo}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 block mt-0.5">{cat.descricao || 'Sem descrição'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenCatModal(cat)}
                      className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                      title="Editar Categoria"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Categoria"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CENTROS DE CUSTO */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Building size={16} className="text-orange-500" />
                Centros de Custo
              </h3>
              <button
                onClick={() => handleOpenCCModal()}
                className="py-1.5 px-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1"
              >
                <Plus size={14} /> + Centro de Custo
              </button>
            </div>

            <div className="space-y-2 font-mono text-xs max-h-96 overflow-y-auto">
              {costCenters.map(cc => (
                <div key={cc.id} className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 text-orange-400 text-[10px] font-bold rounded">
                        {cc.codigo}
                      </span>
                      <strong className="text-white">{cc.nome}</strong>
                    </div>
                    <span className="text-[10px] text-neutral-500 block mt-1">{cc.descricao || 'Sem descrição'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenCCModal(cc)}
                      className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                      title="Editar Centro de Custo"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteCostCenter(cc)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Centro de Custo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 6: RELATÓRIOS & EXPORTAÇÃO */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-fade-in" id="financial-tab-reports">
          
          <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
              <FileText size={18} className="text-orange-500" />
              Central de Relatórios & Exportação Financeira
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <strong className="text-white text-sm block">Contas a Receber & Pagar</strong>
                <p className="text-neutral-400 text-[11px]">Listagem completa de títulos lançados com vencimentos e status.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportToCSV(filteredEntries, 'lancamentos_financeiros')}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded cursor-pointer"
                  >
                    Exportar CSV / Excel
                  </button>
                  <button
                    onClick={handlePrintPDF}
                    className="py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded cursor-pointer"
                  >
                    Imprimir PDF
                  </button>
                </div>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <strong className="text-white text-sm block">Saldos & Extrato de Contas</strong>
                <p className="text-neutral-400 text-[11px]">Saldos consolidados de todas as contas bancárias, cartões e caixas.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportToCSV(accounts, 'extrato_contas_bancarias')}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded cursor-pointer"
                  >
                    Exportar CSV / Excel
                  </button>
                  <button
                    onClick={handlePrintPDF}
                    className="py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded cursor-pointer"
                  >
                    Imprimir PDF
                  </button>
                </div>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <strong className="text-white text-sm block">Trilha de Auditoria</strong>
                <p className="text-neutral-400 text-[11px]">Histórico imutável de todas as movimentações e ações de usuários.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportToCSV(auditLogs, 'auditoria_financeira')}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded cursor-pointer"
                  >
                    Exportar CSV / Excel
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TAB 7: AUDITORIA */}
      {activeTab === 'audit' && (
        <div className="space-y-4 animate-fade-in" id="financial-tab-audit">
          
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-neutral-950/40 border-b border-neutral-800 flex justify-between items-center">
              <h3 className="text-xs font-mono uppercase text-neutral-400 tracking-wider font-semibold flex items-center gap-2">
                <Shield size={16} className="text-orange-500" />
                Trilha de Auditoria Imutável
              </h3>
              <span className="text-xs text-neutral-500 font-mono">Regra de Negócio: Exclusão Lógica Ativa</span>
            </div>

            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/20 uppercase text-neutral-400">
                  <th className="p-3.5">Data / Hora</th>
                  <th className="p-3.5">Usuário</th>
                  <th className="p-3.5">Operação</th>
                  <th className="p-3.5">Entidade</th>
                  <th className="p-3.5">Valor Novo / Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-300">
                {auditLogs.length > 0 ? (
                  auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-neutral-800/20">
                      <td className="p-3.5 text-neutral-400">{new Date(log.dataHora).toLocaleString('pt-BR')}</td>
                      <td className="p-3.5 font-bold text-white">{log.usuario}</td>
                      <td className="p-3.5 font-bold text-orange-400">{log.operacao}</td>
                      <td className="p-3.5 text-neutral-400">{log.entidade} ({log.entidadeId.slice(0, 8)})</td>
                      <td className="p-3.5 font-bold text-emerald-400">{log.valorNovo || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-neutral-500 italic">
                      Nenhum registro na trilha de auditoria ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* MODAL: NOVO LANÇAMENTO MANUAL (AVULSO) */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-neutral-100 font-sans">
            
            {/* STICKY HEADER */}
            <div className="p-4 sm:p-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-900 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Plus size={20} className="text-orange-500" />
                Novo Lançamento Financeiro Manual
              </h3>
              <button
                type="button"
                onClick={() => setIsEntryModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Fechar Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* SCROLLABLE FORM BODY */}
            <form onSubmit={handleSaveEntry} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 font-mono text-xs flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase font-semibold">Tipo *</label>
                    <select
                      value={entryTipo}
                      onChange={(e) => setEntryTipo(e.target.value as any)}
                      className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white font-bold"
                    >
                      <option value="Receita">Receita (+ Entrar)</option>
                      <option value="Despesa">Despesa (- Sair)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase font-semibold">Nº Documento *</label>
                    <input
                      type="text"
                      required
                      value={entryDoc}
                      onChange={(e) => setEntryDoc(e.target.value)}
                      className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 uppercase font-semibold">Fornecedor / Pagador / Descrição *</label>
                  <input
                    type="text"
                    required
                    value={entryFornecedor}
                    onChange={(e) => setEntryFornecedor(e.target.value)}
                    placeholder="Ex: Compra de Bobinas / Pagamento Cliente X"
                    className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase font-semibold">Data Emissão *</label>
                    <input
                      type="date"
                      required
                      value={entryDataEmissao}
                      onChange={(e) => setEntryDataEmissao(e.target.value)}
                      className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase font-semibold">Data Vencimento *</label>
                    <input
                      type="date"
                      required
                      value={entryDataVencimento}
                      onChange={(e) => setEntryDataVencimento(e.target.value)}
                      className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase font-semibold">Valor Bruto R$ *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={entryValorBruto}
                      onChange={(e) => setEntryValorBruto(Number(e.target.value))}
                      className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase font-semibold">Desconto R$</label>
                    <input
                      type="number"
                      step="0.01"
                      value={entryDesconto}
                      onChange={(e) => setEntryDesconto(Number(e.target.value))}
                      className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase font-semibold">Acréscimo R$</label>
                    <input
                      type="number"
                      step="0.01"
                      value={entryAcrescimo}
                      onChange={(e) => setEntryAcrescimo(Number(e.target.value))}
                      className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase font-semibold">Forma de Pagamento *</label>
                    <select
                      value={entryFormaPagamento}
                      onChange={(e) => setEntryFormaPagamento(e.target.value)}
                      className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white"
                    >
                      <option value="PIX">PIX</option>
                      <option value="Boleto">Boleto Bancário</option>
                      <option value="Cartao Credito">Cartão de Crédito</option>
                      <option value="Dinheiro">Dinheiro Físico</option>
                      <option value="Transferencia">Transferência TED/DOC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase font-semibold">Conta Financeira *</label>
                    <select
                      value={entryContaId}
                      onChange={(e) => setEntryContaId(e.target.value)}
                      className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white"
                    >
                      <option value="">Nenhuma (Pendência)</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase font-semibold">Categoria (Plano de Contas)</label>
                    <select
                      value={entryCategoriaId}
                      onChange={(e) => setEntryCategoriaId(e.target.value)}
                      className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white"
                    >
                      <option value="">Sem categoria</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.tipo})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase font-semibold">Centro de Custo</label>
                    <select
                      value={entryCentroCustoId}
                      onChange={(e) => setEntryCentroCustoId(e.target.value)}
                      className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white"
                    >
                      <option value="">Sem centro de custo</option>
                      {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.codigo} - {cc.nome}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 uppercase font-semibold">Observações</label>
                  <textarea
                    value={entryObservacoes}
                    onChange={(e) => setEntryObservacoes(e.target.value)}
                    rows={2}
                    className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white resize-none"
                  />
                </div>
              </div>

              {/* STICKY ACTIONS FOOTER */}
              <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2 border border-neutral-800 text-neutral-400 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-md shadow-orange-600/20"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LIQUIDAÇÃO / BAIXA */}
      {isLiquidateModalOpen && selectedEntryForAction && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle size={20} className="text-emerald-500" />
              Liquidar Título: {selectedEntryForAction.numeroDocumento}
            </h3>

            <form onSubmit={handleSaveLiquidate} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 uppercase font-semibold">Conta Financeira para Baixa *</label>
                <select
                  required
                  value={liqContaId}
                  onChange={(e) => setLiqContaId(e.target.value)}
                  className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white font-bold"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.nome} (Saldo: R$ {a.saldoAtual.toFixed(2)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase font-semibold">Data da Liquidação *</label>
                <input
                  type="date"
                  required
                  value={liqData}
                  onChange={(e) => setLiqData(e.target.value)}
                  className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase font-semibold">Valor Pago R$ *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={liqValorPago}
                  onChange={(e) => setLiqValorPago(Number(e.target.value))}
                  className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-emerald-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase font-semibold">Juros / Multa R$</label>
                <input
                  type="number"
                  step="0.01"
                  value={liqJuros}
                  onChange={(e) => setLiqJuros(Number(e.target.value))}
                  className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLiquidateModalOpen(false)}
                  className="px-4 py-2 border border-neutral-800 text-neutral-400 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Confirmar Liquidação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONTA BANCÁRIA (CRIAR E EDITAR) */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              {editingAccount ? 'Editar Conta / Cartão' : 'Nova Conta / Cartão de Crédito'}
            </h3>
            <form onSubmit={handleSaveAccount} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 uppercase font-semibold">Nome da Conta *</label>
                <input
                  type="text"
                  required
                  value={accNome}
                  onChange={(e) => setAccNome(e.target.value)}
                  placeholder="Ex: Itaú Empresa / Nubank Corporate"
                  className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase font-semibold">Tipo *</label>
                <select
                  value={accTipo}
                  onChange={(e) => setAccTipo(e.target.value as any)}
                  className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white font-bold"
                >
                  <option value="Conta Bancaria">Conta Bancária</option>
                  <option value="Cartao Credito">Cartão de Crédito</option>
                  <option value="Carteira Digital">Carteira Digital (Mercado Pago, etc.)</option>
                  <option value="Caixa Fisico">Caixa Físico (Dinheiro)</option>
                </select>
              </div>

              {accTipo === 'Conta Bancaria' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase font-semibold">Banco</label>
                    <input
                      type="text"
                      value={accBanco}
                      onChange={(e) => setAccBanco(e.target.value)}
                      placeholder="Itaú"
                      className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase font-semibold">Agência</label>
                    <input
                      type="text"
                      value={accAgencia}
                      onChange={(e) => setAccAgencia(e.target.value)}
                      placeholder="0001"
                      className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase font-semibold">Conta / Dígito</label>
                    <input
                      type="text"
                      value={accConta}
                      onChange={(e) => setAccConta(e.target.value)}
                      placeholder="12345-6"
                      className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white"
                    />
                  </div>
                </div>
              )}

              {accTipo === 'Cartao Credito' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase font-semibold">Bandeira</label>
                    <input
                      type="text"
                      value={accBandeira}
                      onChange={(e) => setAccBandeira(e.target.value)}
                      placeholder="Mastercard / Visa"
                      className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase font-semibold">Limite Total R$</label>
                    <input
                      type="number"
                      value={accLimite}
                      onChange={(e) => setAccLimite(Number(e.target.value))}
                      className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-400 mb-1 uppercase font-semibold">Saldo Atual R$ *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={accSaldoAtual}
                    onChange={(e) => setAccSaldoAtual(Number(e.target.value))}
                    className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1 uppercase font-semibold">Situação</label>
                  <select
                    value={accSituacao}
                    onChange={(e) => setAccSituacao(e.target.value as any)}
                    className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white font-bold"
                  >
                    <option value="Ativa">Ativa</option>
                    <option value="Inativa">Inativa</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAccountModalOpen(false)} className="px-4 py-2 border border-neutral-800 text-neutral-400 rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl cursor-pointer">
                  {editingAccount ? 'Atualizar Conta' : 'Salvar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFERÊNCIA ENTRE CONTAS */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <ArrowRightLeft className="text-orange-500" size={18} />
              Transferência entre Contas / Carteiras
            </h3>

            <form onSubmit={handleSaveTransfer} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 uppercase font-semibold">Conta Origem (Débito) *</label>
                <select
                  value={trOrigemId}
                  onChange={(e) => setTrOrigemId(e.target.value)}
                  className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-red-400 font-bold"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.nome} (R$ {a.saldoAtual.toFixed(2)})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase font-semibold">Conta Destino (Crédito) *</label>
                <select
                  value={trDestinoId}
                  onChange={(e) => setTrDestinoId(e.target.value)}
                  className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-emerald-400 font-bold"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.nome} (R$ {a.saldoAtual.toFixed(2)})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase font-semibold">Valor R$ *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={trValor}
                  onChange={(e) => setTrValor(Number(e.target.value))}
                  className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsTransferModalOpen(false)} className="px-4 py-2 border border-neutral-800 text-neutral-400 rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl cursor-pointer">Confirmar Transferência</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CATEGORIA (CRIAR E EDITAR) */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              {editingCategory ? 'Editar Categoria' : 'Adicionar Categoria (Plano de Contas)'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 uppercase font-semibold">Nome da Categoria *</label>
                <input
                  type="text"
                  required
                  value={catNome}
                  onChange={(e) => setCatNome(e.target.value)}
                  className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1 uppercase font-semibold">Tipo *</label>
                <select
                  value={catTipo}
                  onChange={(e) => setCatTipo(e.target.value as any)}
                  className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white font-bold"
                >
                  <option value="Receita">Receita</option>
                  <option value="Despesa">Despesa</option>
                </select>
              </div>
              <div>
                <label className="block text-neutral-400 mb-1 uppercase font-semibold">Descrição</label>
                <textarea
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsCatModalOpen(false)} className="px-4 py-2 border border-neutral-800 text-neutral-400 rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl cursor-pointer">
                  {editingCategory ? 'Atualizar Categoria' : 'Salvar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CENTRO DE CUSTO (CRIAR E EDITAR) */}
      {isCCModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              {editingCC ? 'Editar Centro de Custo' : 'Adicionar Centro de Custo'}
            </h3>
            <form onSubmit={handleSaveCostCenter} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 uppercase font-semibold">Código *</label>
                <input
                  type="text"
                  required
                  value={ccCodigo}
                  onChange={(e) => setCcCodigo(e.target.value)}
                  className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1 uppercase font-semibold">Nome do Centro de Custo *</label>
                <input
                  type="text"
                  required
                  value={ccNome}
                  onChange={(e) => setCcNome(e.target.value)}
                  className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1 uppercase font-semibold">Descrição</label>
                <textarea
                  value={ccDesc}
                  onChange={(e) => setCcDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded text-white resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsCCModalOpen(false)} className="px-4 py-2 border border-neutral-800 text-neutral-400 rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl cursor-pointer">
                  {editingCC ? 'Atualizar Centro de Custo' : 'Salvar Centro de Custo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />
    </div>
  );
}
