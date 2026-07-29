import React from 'react';
import { Budget, Company, Client } from '../../types';
import { Modal } from '../ui/Modal';
import { Printer, Download, MessageSquare, Building2, User, CheckCircle, Calendar, Hash, ShieldCheck, FileText } from 'lucide-react';

interface BudgetPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: Budget | null;
  company: Company | null;
  client: Client | null;
  onSendWhatsApp?: (budget: Budget) => void;
}

export const BudgetPreviewModal: React.FC<BudgetPreviewModalProps> = ({
  isOpen,
  onClose,
  budget,
  company,
  client,
  onSendWhatsApp,
}) => {
  if (!budget) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pré-visualização da Proposta Comercial"
      size="2xl"
    >
      <div className="space-y-6 text-neutral-200">
        {/* ACTION BAR (PRINT / DOWNLOAD / SEND) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-950 border border-neutral-800 rounded-xl print:hidden">
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
            <FileText size={15} className="text-orange-500" />
            Visualização de Impressão / PDF
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono rounded-lg transition-colors cursor-pointer text-white"
            >
              <Printer size={14} />
              Imprimir / PDF
            </button>
            {onSendWhatsApp && (
              <button
                onClick={() => onSendWhatsApp(budget)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer text-white"
              >
                <MessageSquare size={14} />
                Enviar WhatsApp
              </button>
            )}
          </div>
        </div>

        {/* PRINTABLE DOCUMENT AREA */}
        <div className="bg-neutral-950 border border-neutral-800 p-6 sm:p-8 rounded-2xl space-y-6 font-mono print:bg-white print:text-black print:border-none print:shadow-none">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-neutral-800 pb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-wider print:text-black">
                {company?.nome || 'ELMANEKO 3D'}
              </h2>
              <p className="text-xs text-neutral-400 print:text-neutral-600">{company?.slogan || 'Impressão 3D & Prototipagem'}</p>
              <p className="text-xs text-neutral-500 mt-1 print:text-neutral-600">CNPJ: {company?.cnpj || '12.345.678/0001-99'}</p>
              <p className="text-xs text-neutral-500 print:text-neutral-600">Contato: {company?.telefone || company?.whatsapp || '(11) 99999-9999'}</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold text-xs rounded-lg uppercase print:border-black print:text-black">
                Orçamento #{budget.numero || budget.id.slice(0, 8)}
              </span>
              <p className="text-xs text-neutral-400 mt-2 print:text-neutral-600">
                Data: {new Date(budget.createdAt).toLocaleDateString('pt-BR')}
              </p>
              <p className="text-xs text-neutral-400 print:text-neutral-600">
                Validade: 15 dias
              </p>
            </div>
          </div>

          {/* CLIENT INFO */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 p-4 rounded-xl space-y-1 print:bg-neutral-100 print:border-neutral-300">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold block mb-1">Cliente / Destinatário</span>
            <p className="text-sm font-bold text-white print:text-black">{client?.nome || budget.clienteNome || 'Cliente Não Especificado'}</p>
            {client?.whatsapp && <p className="text-xs text-neutral-400 print:text-neutral-700">WhatsApp: {client.whatsapp}</p>}
            {client?.email && <p className="text-xs text-neutral-400 print:text-neutral-700">Email: {client.email}</p>}
          </div>

          {/* BUDGET ITEMS */}
          <div>
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 print:text-black">Itens Solicitados</h4>
            <div className="border border-neutral-800 rounded-xl overflow-hidden print:border-neutral-300">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-900 text-neutral-400 font-bold border-b border-neutral-800 print:bg-neutral-200 print:text-black">
                  <tr>
                    <th className="p-3">Descrição do Item</th>
                    <th className="p-3 text-center">Qtd</th>
                    <th className="p-3 text-right">Valor Unit.</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 print:divide-neutral-300">
                  {budget.itens && budget.itens.length > 0 ? (
                    budget.itens.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 text-white font-medium print:text-black">{item.descricao || item.nome}</td>
                        <td className="p-3 text-center text-neutral-300 print:text-black">{item.quantidade}</td>
                        <td className="p-3 text-right text-neutral-400 print:text-black">R$ {Number(item.valorUnitario || 0).toFixed(2)}</td>
                        <td className="p-3 text-right text-white font-bold print:text-black">
                          R$ {(Number(item.quantidade) * Number(item.valorUnitario || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-3 text-white font-medium print:text-black">{budget.descricao || 'Serviço de Impressão 3D Personalizado'}</td>
                      <td className="p-3 text-center text-neutral-300 print:text-black">1</td>
                      <td className="p-3 text-right text-neutral-400 print:text-black">R$ {Number(budget.valorTotal || 0).toFixed(2)}</td>
                      <td className="p-3 text-right text-white font-bold print:text-black">R$ {Number(budget.valorTotal || 0).toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TOTALS & PAYMENT INFO */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pt-4 border-t border-neutral-800 gap-4 print:border-neutral-300">
            <div className="text-xs text-neutral-400 space-y-1 max-w-sm print:text-neutral-700">
              <p className="font-bold text-white print:text-black">Condições de Pagamento:</p>
              <p>• PIX (50% de entrada + 50% na retirada/envio)</p>
              <p>• Chave PIX: {company?.pixChave || company?.cnpj || 'contato@elmaneko3d.com'}</p>
            </div>
            <div className="text-right w-full sm:w-auto bg-orange-950/30 border border-orange-500/20 p-4 rounded-xl print:bg-neutral-100 print:border-neutral-300">
              <span className="text-xs text-orange-400 uppercase font-bold block print:text-black">Valor Total da Proposta</span>
              <span className="text-2xl font-bold text-white print:text-black">
                R$ {Number(budget.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
