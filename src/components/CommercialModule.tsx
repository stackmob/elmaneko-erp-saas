import React, { useState } from 'react';
import { 
  DollarSign, FileCheck, Users, BarChart3, TrendingUp, Sparkles, Plus, Clock, CheckCircle
} from 'lucide-react';
import Budgets from './Budgets';
import Sales from './Sales';
import Clients from './Clients';
import { useData } from '../hooks/useData';
import { formatCurrency } from '../utils/formatters';

export default function CommercialModule() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'budgets' | 'sales' | 'clients'>('budgets');

  const { useOrcamentos, useVendas, useClientes } = useData();
  const { data: budgets = [] } = useOrcamentos();
  const { data: sales = [] } = useVendas();
  const { data: clients = [] } = useClientes();

  // KPIs
  const totalOrcamentos = budgets.length;
  const orcamentosAprovados = budgets.filter(b => b.status === 'Aprovado' || b.status === 'Faturado').length;
  const taxaConversao = totalOrcamentos > 0 ? Math.round((orcamentosAprovados / totalOrcamentos) * 100) : 0;
  const faturamentoTotal = sales.reduce((acc, s) => acc + (s.valorTotal || 0), 0);
  const valorPendenteAprovacao = budgets
    .filter(b => b.status === 'Aberto')
    .reduce((acc, b) => acc + b.itens.reduce((total, item) => total + item.quantidade * item.valorUnitario - item.desconto, 0) - b.descontoGeral, 0);

  return (
    <div className="space-y-6" id="commercial-module-root">
      
      {/* MODULE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="commercial-header">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <DollarSign className="text-orange-500" size={24} />
            Módulo Comercial & Vendas
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Gestão unificada de Orçamentos, Propostas Comerciais, Vendas Realizadas e CRM de Clientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl font-mono text-xs text-neutral-300 flex items-center gap-2">
            <Sparkles size={14} className="text-orange-400" />
            <strong className="text-white">{clients.length}</strong> Clientes Ativos
          </span>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex overflow-x-auto gap-2 border-b border-neutral-800 pb-2 scrollbar-none" id="commercial-tabs">
        {[
          { id: 'dashboard', label: '📊 Dashboard Comercial', icon: BarChart3 },
          { id: 'budgets', label: '📄 Orçamentos & Propostas', icon: FileCheck },
          { id: 'sales', label: '💰 Vendas Realizadas', icon: DollarSign },
          { id: 'clients', label: '👥 Clientes (CRM)', icon: Users },
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

      {/* TAB 1: DASHBOARD COMERCIAL */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in" id="commercial-tab-dashboard">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase block">Total de Propostas</span>
                <strong className="text-2xl font-black font-mono text-white mt-1 block">
                  {totalOrcamentos}
                </strong>
                <span className="text-[10px] text-neutral-500 mt-0.5 block">Orçamentos gerados</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-950/50 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <FileCheck size={22} />
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase block">Taxa de Conversão</span>
                <strong className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
                  {taxaConversao}%
                </strong>
                <span className="text-[10px] text-neutral-500 mt-0.5 block">{orcamentosAprovados} propostas aprovadas</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <TrendingUp size={22} />
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase block">Faturamento Bruto</span>
                <strong className="text-xl font-black font-mono text-emerald-400 mt-1 block">
                  {formatCurrency(faturamentoTotal)}
                </strong>
                <span className="text-[10px] text-neutral-500 mt-0.5 block">Vendas consolidadas</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <DollarSign size={22} />
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase block">Provisão em Aberto</span>
                <strong className="text-xl font-black font-mono text-amber-400 mt-1 block">
                  {formatCurrency(valorPendenteAprovacao)}
                </strong>
                <span className="text-[10px] text-neutral-500 mt-0.5 block">Aguardando aprovação</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-950/50 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Clock size={22} />
              </div>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => setActiveTab('budgets')}
              className="p-5 bg-neutral-900 border border-neutral-800 hover:border-orange-500/50 rounded-2xl cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between text-neutral-400 group-hover:text-orange-400">
                <FileCheck size={20} />
                <span className="text-xs font-mono">Gerenciar ➔</span>
              </div>
              <h4 className="text-base font-bold text-white">Orçamentos & Propostas</h4>
              <p className="text-xs text-neutral-400">Emita cotações com cálculo automático de BOM, validade e aprovação em 1 clique.</p>
            </div>

            <div 
              onClick={() => setActiveTab('sales')}
              className="p-5 bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 rounded-2xl cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between text-neutral-400 group-hover:text-emerald-400">
                <DollarSign size={20} />
                <span className="text-xs font-mono">Visualizar ➔</span>
              </div>
              <h4 className="text-base font-bold text-white">Vendas Realizadas</h4>
              <p className="text-xs text-neutral-400">Acompanhe faturamento em tempo real e lançamento automático no Financeiro.</p>
            </div>

            <div 
              onClick={() => setActiveTab('clients')}
              className="p-5 bg-neutral-900 border border-neutral-800 hover:border-blue-500/50 rounded-2xl cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between text-neutral-400 group-hover:text-blue-400">
                <Users size={20} />
                <span className="text-xs font-mono">Acessar CRM ➔</span>
              </div>
              <h4 className="text-base font-bold text-white">Cadastro de Clientes</h4>
              <p className="text-xs text-neutral-400">Base de clientes com histórico de compras, WhatsApp direto e dados de faturamento.</p>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: ORÇAMENTOS */}
      {activeTab === 'budgets' && (
        <div className="animate-fade-in">
          <Budgets />
        </div>
      )}

      {/* TAB 3: VENDAS */}
      {activeTab === 'sales' && (
        <div className="animate-fade-in">
          <Sales />
        </div>
      )}

      {/* TAB 4: CLIENTES */}
      {activeTab === 'clients' && (
        <div className="animate-fade-in">
          <Clients />
        </div>
      )}

    </div>
  );
}
