import React from 'react';
import { Product } from '../../types';
import { Package, Clock, DollarSign, Edit, Trash2, Layers } from 'lucide-react';

interface ProductsCatalogProps {
  products: Product[];
  onOpenAddModal: () => void;
  onEditProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export const ProductsCatalog: React.FC<ProductsCatalogProps> = ({
  products,
  onOpenAddModal,
  onEditProduct,
  onDeleteProduct
}) => {
  return (
    <div className="space-y-6 animate-fade-in" id="products-catalog-container">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(prod => (
          <div key={prod.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors shadow-sm flex flex-col justify-between relative group">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  {prod.imagem ? (
                    <img src={prod.imagem} alt={prod.nome} className="w-12 h-12 rounded-xl object-cover border border-neutral-800" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-500">
                      <Package size={22} />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-white">{prod.nome}</h4>
                    <span className="text-[11px] text-neutral-400 font-mono block">{prod.categoria || 'Geral'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditProduct(prod)}
                    className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Editar Produto & BOM"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => onDeleteProduct(prod.id)}
                    className="p-1.5 hover:bg-red-950/50 text-neutral-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                    title="Excluir Produto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="text-xs text-neutral-400 space-y-1.5 mb-4 font-mono">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Clock size={13} /> Tempo Impressão:</span>
                  <span className="text-neutral-200">{prod.tempoImpressao}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Layers size={13} /> Consumo Filamento:</span>
                  <span className="text-neutral-200">
                    {(prod.materials || []).reduce((acc, m) => acc + (m.quantidadeGrams || 0), 0)}g
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-800 text-white font-bold text-sm">
                  <span>Preço Sugerido:</span>
                  <span className="text-emerald-400">R$ {Number(prod.precoVenda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
