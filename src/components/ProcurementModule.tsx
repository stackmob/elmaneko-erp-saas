import React, { useState } from 'react';
import { 
  ShoppingBag, Package, BarChart3, Plus, Sparkles
} from 'lucide-react';
import Purchases from './Purchases';
import Supplies from './Supplies';
import { useData } from '../hooks/useData';
import { formatCurrency } from '../utils/formatters';

export default function ProcurementModule() {
  const [activeTab, setActiveTab] = useState<'purchases' | 'supplies'>('purchases');

  const { useCompras, useInsumos } = useData();
  const { data: purchases = [] } = useCompras();
  const { data: supplies = [] } = useInsumos();

  const totalGastoCompras = purchases.reduce((acc, p) => acc + (p.valorPago || 0), 0);
  const totalInsumosCadastrados = supplies.length;

  return (
    <div className="space-y-6" id="procurement-module-root">
      
      {/* MODULE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="procurement-header">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="text-orange-500" size={24} />
            Módulo de Compras & Suprimentos
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Gestão unificada de Aquisição de Filamentos, Matérias-Primas, Peças de Reposição e Catálogo de Insumos Diversos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl font-mono text-xs text-neutral-300">
            Total Compras: <strong className="text-emerald-400">{formatCurrency(totalGastoCompras)}</strong>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex overflow-x-auto gap-2 border-b border-neutral-800 pb-2 scrollbar-none" id="procurement-tabs">
        {[
          { id: 'purchases', label: '🛒 Registrar Compras & Histórico', icon: ShoppingBag },
          { id: 'supplies', label: '📦 Catálogo de Insumos Diversos', icon: Package },
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

      {/* TAB 1: REGISTRO DE COMPRAS */}
      {activeTab === 'purchases' && (
        <div className="animate-fade-in">
          <Purchases />
        </div>
      )}

      {/* TAB 2: CATÁLOGO DE INSUMOS */}
      {activeTab === 'supplies' && (
        <div className="animate-fade-in">
          <Supplies />
        </div>
      )}

    </div>
  );
}
