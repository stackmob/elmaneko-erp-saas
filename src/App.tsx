import React, { useState, useEffect } from 'react';

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
import Supplies from './components/Supplies';
import BackupModule from './components/Backup';
import CompanyModule from './components/Company';
import Financial from './components/Financial';

// Icons
import { 
  LayoutDashboard, Users, Layers, ShoppingBag, Cpu, 
  Zap, FolderHeart, PlayCircle, FileCheck, DollarSign, LogOut, Shield, 
  AlertTriangle, Loader2, PanelLeftClose, PanelLeftOpen, Sparkles, Building2,
  Menu, X, Package, Wallet, Sun, Moon
} from 'lucide-react';

import { useAuth } from './context/AuthContext';
import { useData } from './hooks/useData';

export default function App() {
  const { session, loading, signOut } = useAuth();
  const { useFilamentos } = useData();
  const { data: filaments = [] } = useFilamentos();

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Theme Mode State (Dark / Light)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('elmaneko_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('elmaneko_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.body.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard HUD', icon: LayoutDashboard },
    { id: 'financial', label: 'Módulo Financeiro', icon: Wallet },
    { id: 'clients', label: 'Clientes (CRM)', icon: Users },
    { id: 'filaments', label: 'Estoque Filamentos', icon: Layers },
    { id: 'supplies', label: 'Catálogo de Insumos', icon: Package },
    { id: 'purchases', label: 'Compras Insumos', icon: ShoppingBag },
    { id: 'printers', label: 'Impressoras 3D', icon: Cpu },
    { id: 'tariffs', label: 'Tarifa de Energia', icon: Zap },
    { id: 'products', label: 'Produtos / BOM', icon: FolderHeart },
    { id: 'production', label: 'Produção (Fila)', icon: PlayCircle },
    { id: 'budgets', label: 'Orçamentos', icon: FileCheck },
    { id: 'sales', label: 'Vendas Realizadas', icon: DollarSign },
    { id: 'company', label: 'Dados da Empresa', icon: Building2 },
    { id: 'backup', label: 'Segurança / Backup', icon: Shield },
  ];

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-orange-500/30 overflow-hidden relative" id="app-root">
      
      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR NAVIGATION PANEL — RESPONSIVE DRAWER & COLLAPSIBLE */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 md:relative flex flex-col justify-between shrink-0 transition-all duration-300 bg-neutral-900/95 md:bg-neutral-900/80 backdrop-blur-xl border-r border-neutral-800/80 shadow-[4px_0_24px_rgba(0,0,0,0.6)] ${
          isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}`} 
        id="sidebar"
      >
        {/* LOGO & COLLAPSE TOGGLE */}
        <div className="p-4 sm:p-5 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20 shrink-0 border border-orange-400/30">
              E3
            </div>
            {(!isSidebarCollapsed || isMobileMenuOpen) && (
              <div className="animate-fade-in font-sans">
                <h1 className="text-sm font-black tracking-wider text-white flex items-center gap-1.5">
                  ELMANEKO <span className="text-orange-500 text-xs px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 font-mono">3D</span>
                </h1>
                <p className="text-[9px] font-mono tracking-widest text-neutral-400 font-semibold uppercase">ERP HUD v2.0</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:block p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800/80 rounded-lg transition-colors cursor-pointer shrink-0"
              title={isSidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
              id="sidebar-toggle-btn"
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800/80 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Fechar Menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-3 py-4 sm:py-5 space-y-1 overflow-y-auto font-mono text-xs scrollbar-thin" id="nav-links">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsMobileMenuOpen(false);
                }}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer border ${
                  isActive 
                    ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-orange-400 border-orange-500/40 font-bold shadow-lg shadow-orange-500/5' 
                    : 'text-neutral-400 border-transparent hover:bg-neutral-800/60 hover:text-neutral-100 hover:border-neutral-700/50'
                }`}
                id={`nav-item-${item.id}`}
              >
                <Icon size={18} className={`shrink-0 ${isActive ? 'text-orange-400 animate-pulse' : 'text-neutral-400'}`} />
                {(!isSidebarCollapsed || isMobileMenuOpen) && (
                  <span className="truncate text-xs tracking-wide font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* FOOTER USER TENANT PROFILE */}
        <div className="p-3 border-t border-neutral-800/80" id="sidebar-footer">
          <div className={`flex items-center gap-3 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/80 ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-xl bg-orange-950/60 border border-orange-500/30 flex items-center justify-center text-orange-400 text-xs font-bold uppercase shrink-0">
              {auth.email ? auth.email[0] : 'A'}
            </div>
            {(!isSidebarCollapsed || isMobileMenuOpen) && (
              <div className="overflow-hidden flex-1 font-mono">
                <p className="text-xs font-semibold text-neutral-200 truncate">Tenant Admin</p>
                <p className="text-[10px] text-neutral-500 truncate" title={auth.email}>{auth.email}</p>
              </div>
            )}
            <button 
              onClick={() => signOut()} 
              className="flex items-center justify-center p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-all cursor-pointer shrink-0" 
              title="Encerrar Sessão"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE CANVAS */}
      <main className="flex-1 bg-neutral-950 overflow-y-auto flex flex-col min-h-0 relative w-full" id="main-content-canvas">
        {/* HEADER BAR HUD */}
        <header className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/40 backdrop-blur-md sticky top-0 z-20" id="top-header">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl transition-colors cursor-pointer md:hidden shrink-0"
              title="Abrir Menu"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h2 className="text-[10px] font-mono uppercase text-neutral-400 tracking-widest font-semibold flex items-center gap-1.5 truncate">
                <Sparkles size={11} className="text-orange-400 shrink-0" />
                Painel Administrador SaaS
              </h2>
              <h1 className="text-sm font-bold tracking-tight text-white mt-0.5 truncate">ELMANEKO 3D ERP — Control Center</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {lowStockFilaments.length > 0 ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-mono shadow-lg shadow-amber-950/20 shrink-0">
                <AlertTriangle size={15} className="text-amber-400 animate-bounce shrink-0" />
                <span className="truncate">Aviso HUD: <strong className="text-amber-200">{lowStockFilaments.length} bobina(s)</strong> abaixo de 200g!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs font-mono shrink-0">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping shrink-0" />
                <span>Insumos & Impressoras operacionais</span>
              </div>
            )}

            <button
              onClick={toggleTheme}
              className={`py-1.5 px-3 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                theme === 'dark' 
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-md'
              }`}
              title={theme === 'dark' ? 'Mudar para Modo Claro (Light)' : 'Mudar para Modo Escuro (Dark)'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={15} className="text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon size={15} className="text-indigo-600 shrink-0" />
                  <span className="hidden sm:inline">Modo Escuro</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* VIEWPORT CONTENT CONTAINER */}
        <div className="flex-1 p-3 sm:p-4 md:p-6" id="workspace-viewport">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'financial' && <Financial />}
          {currentView === 'clients' && <Clients />}
          {currentView === 'filaments' && <Filaments />}
          {currentView === 'supplies' && <Supplies />}
          {currentView === 'purchases' && <Purchases />}
          {currentView === 'printers' && <Printers />}
          {currentView === 'tariffs' && <EnergyTariffModule />}
          {currentView === 'products' && <Products />}
          {currentView === 'production' && <Production />}
          {currentView === 'budgets' && <Budgets />}
          {currentView === 'sales' && <Sales />}
          {currentView === 'company' && <CompanyModule />}
          {currentView === 'backup' && <BackupModule />}
        </div>
      </main>
    </div>
  );
}

