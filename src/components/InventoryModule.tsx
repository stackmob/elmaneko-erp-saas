import React, { useState } from 'react';
import { 
  Layers, FolderHeart, Cpu, PlayCircle, BarChart3, AlertTriangle, Sparkles
} from 'lucide-react';
import Filaments from './Filaments';
import Products from './Products';
import Printers from './Printers';
import Production from './Production';
import { useData } from '../hooks/useData';

export default function InventoryModule() {
  const [activeTab, setActiveTab] = useState<'filaments' | 'products' | 'printers' | 'production'>('filaments');

  const { useFilamentos, useImpressoras, useProdutos, useProducoes } = useData();
  const { data: filaments = [] } = useFilamentos();
  const { data: printers = [] } = useImpressoras();
  const { data: products = [] } = useProdutos();
  const { data: orders = [] } = useProducoes();

  const lowStock = filaments.filter(f => f.quantidadeDisponivel <= 200).length;
  const activePrinters = printers.filter(p => p.status === 'Ativa').length;

  return (
    <div className="space-y-6" id="inventory-module-root">
      
      {/* MODULE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="inventory-header">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="text-orange-500" size={24} />
            Módulo de Estoque, Ativos & Produção 3D
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Gestão integrada de Bobinas de Filamentos, Engenharia de Produtos (BOM), Parque de Impressoras e Fila de Produção.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lowStock > 0 && (
            <span className="px-3 py-1.5 bg-amber-950/40 border border-amber-500/30 rounded-xl font-mono text-xs text-amber-300 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-400" />
              <strong>{lowStock} bobina(s)</strong> em nível crítico
            </span>
          )}
          <span className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl font-mono text-xs text-neutral-300 flex items-center gap-1.5">
            <Cpu size={14} className="text-orange-400" />
            <strong className="text-white">{activePrinters}/{printers.length}</strong> Impressoras Ativas
          </span>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex overflow-x-auto gap-2 border-b border-neutral-800 pb-2 scrollbar-none" id="inventory-tabs">
        {[
          { id: 'filaments', label: '🧵 Estoque de Filamentos', icon: Layers },
          { id: 'products', label: '🧩 Produtos & Engenharia BOM', icon: FolderHeart },
          { id: 'printers', label: '🖨️ Parque de Impressoras 3D', icon: Cpu },
          { id: 'production', label: '⚙️ Fila de Produção 3D', icon: PlayCircle },
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

      {/* TAB 1: FILAMENTOS */}
      {activeTab === 'filaments' && (
        <div className="animate-fade-in">
          <Filaments />
        </div>
      )}

      {/* TAB 2: PRODUTOS / BOM */}
      {activeTab === 'products' && (
        <div className="animate-fade-in">
          <Products />
        </div>
      )}

      {/* TAB 3: IMPRESSORAS */}
      {activeTab === 'printers' && (
        <div className="animate-fade-in">
          <Printers />
        </div>
      )}

      {/* TAB 4: PRODUÇÃO */}
      {activeTab === 'production' && (
        <div className="animate-fade-in">
          <Production />
        </div>
      )}

    </div>
  );
}
