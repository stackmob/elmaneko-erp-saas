import React, { useState } from 'react';

// Component Imports
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import Filaments from './components/Filaments';
import Purchases from './components/Purchases';
import Printers from './components/Printers';
import EnergyTariffModule from './components/EnergyTariff';
import Products from './components/Products';
import Production from './components/Production';
import Budgets from './components/Budgets';
import Sales from './components/Sales';
import Clients from './components/Clients';
import BackupModule from './components/Backup';

// Icons
import { 
  LayoutDashboard, Users, Layers, ShoppingBag, Cpu, 
  Zap, FolderHeart, PlayCircle, FileCheck, DollarSign, ShieldAlert, LogOut, Shield, AlertTriangle, Loader2 
} from 'lucide-react';

import { useAuth } from './context/AuthContext';
import { useData } from './hooks/useData';

export default function App() {
  const { session, loading, signOut } = useAuth();
  const { useFilamentos } = useData();
  const { data: filaments = [] } = useFilamentos();

  const [currentView, setCurrentView] = useState<string>('dashboard');

  const auth = {
    isAuthenticated: !!session,
    email: session?.user?.email || ''
  };

  const lowStockFilaments = filaments.filter(f => f.quantidadeDisponivel <= 200);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500 w-12 h-12" />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-orange-500/30 overflow-hidden" id="app-root">
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-full md:w-64 bg-neutral-900/50 border-r border-neutral-800 flex flex-col justify-between shrink-0" id="sidebar">
        <div className="p-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center font-bold text-white shadow-md shadow-orange-600/10">
              E3
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">ELMANEKO <span className="text-orange-500">SaaS</span></h1>
              <p className="text-[9px] font-mono tracking-widest text-neutral-500 font-semibold uppercase">ERP CONTROL 2.0</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto font-mono text-xs" id="nav-links">
          <button onClick={() => setCurrentView('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer border ${currentView === 'dashboard' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 font-semibold' : 'text-neutral-400 border-transparent hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
            <LayoutDashboard size={16} /> <span>Dashboard</span>
          </button>
          <button onClick={() => setCurrentView('clients')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer border ${currentView === 'clients' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 font-semibold' : 'text-neutral-400 border-transparent hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
            <Users size={16} /> <span>Clientes (CRM)</span>
          </button>
          <button onClick={() => setCurrentView('filaments')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer border ${currentView === 'filaments' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 font-semibold' : 'text-neutral-400 border-transparent hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
            <Layers size={16} /> <span>Estoque Filamentos</span>
          </button>
          <button onClick={() => setCurrentView('purchases')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer border ${currentView === 'purchases' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 font-semibold' : 'text-neutral-400 border-transparent hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
            <ShoppingBag size={16} /> <span>Compras Insumos</span>
          </button>
          <button onClick={() => setCurrentView('printers')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer border ${currentView === 'printers' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 font-semibold' : 'text-neutral-400 border-transparent hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
            <Cpu size={16} /> <span>Impressoras</span>
          </button>
          <button onClick={() => setCurrentView('tariffs')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer border ${currentView === 'tariffs' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 font-semibold' : 'text-neutral-400 border-transparent hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
            <Zap size={16} /> <span>Tarifa de Energia</span>
          </button>
          <button onClick={() => setCurrentView('products')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer border ${currentView === 'products' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 font-semibold' : 'text-neutral-400 border-transparent hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
            <FolderHeart size={16} /> <span>Produtos / BOM</span>
          </button>
          <button onClick={() => setCurrentView('production')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer border ${currentView === 'production' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 font-semibold' : 'text-neutral-400 border-transparent hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
            <PlayCircle size={16} /> <span>Produção (Fila)</span>
          </button>
          <button onClick={() => setCurrentView('budgets')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer border ${currentView === 'budgets' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 font-semibold' : 'text-neutral-400 border-transparent hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
            <FileCheck size={16} /> <span>Orçamentos</span>
          </button>
          <button onClick={() => setCurrentView('sales')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer border ${currentView === 'sales' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 font-semibold' : 'text-neutral-400 border-transparent hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
            <DollarSign size={16} /> <span>Vendas Realizadas</span>
          </button>
          <button onClick={() => setCurrentView('backup')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer border ${currentView === 'backup' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 font-semibold' : 'text-neutral-400 border-transparent hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
            <Shield size={16} /> <span>Segurança / Backup</span>
          </button>
        </nav>

        <div className="p-4 border-t border-neutral-800" id="sidebar-footer">
          <div className="flex items-center gap-3 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/60">
            <div className="w-8 h-8 rounded-full bg-orange-600/15 border border-orange-500/25 flex items-center justify-center text-orange-500 text-xs font-bold uppercase shrink-0">
              {auth.email ? auth.email[0] : 'A'}
            </div>
            <div className="overflow-hidden flex-1 font-mono">
              <p className="text-xs font-semibold text-neutral-200">Tenant Admin</p>
              <p className="text-[10px] text-neutral-500 truncate" title={auth.email}>{auth.email}</p>
            </div>
            <button onClick={() => signOut()} className="flex items-center justify-center p-2 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-all cursor-pointer" title="Encerrar Sessão">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 bg-neutral-950 overflow-y-auto flex flex-col min-h-0" id="main-content-canvas">
        <header className="px-8 py-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/20" id="top-header">
          <div>
            <h2 className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider font-semibold">Painel Administrador SaaS</h2>
            <h1 className="text-base font-bold tracking-tight text-white mt-0.5">ELMANEKO 3D ERP - SaaS v2.0</h1>
          </div>

          {lowStockFilaments.length > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/30 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-mono">
              <AlertTriangle size={15} className="text-amber-500 animate-pulse" />
              <span>Aviso: <strong>{lowStockFilaments.length} bobina(s)</strong> abaixo de 200g!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/30 border border-emerald-500/10 rounded-xl text-emerald-400 text-xs font-mono">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span>Insumos estocados conformes</span>
            </div>
          )}
        </header>

        <div className="flex-1 px-8 py-8" id="workspace-viewport">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'clients' && <Clients />}
          {currentView === 'filaments' && <Filaments />}
          {currentView === 'purchases' && <Purchases />}
          {currentView === 'printers' && <Printers />}
          {currentView === 'tariffs' && <EnergyTariffModule />}
          {currentView === 'products' && <Products />}
          {currentView === 'production' && <Production />}
          {currentView === 'budgets' && <Budgets />}
          {currentView === 'sales' && <Sales />}
          {currentView === 'backup' && <BackupModule />}
        </div>
      </main>
    </div>
  );
}
