import { Client, FinancialAccount, FinancialEntry } from '../types';

export function useFinancialSummary(entries: FinancialEntry[], accounts: FinancialAccount[], clients: Client[], filters: { search: string; status: string; type: string }) {
  const activeEntries = entries.filter((entry) => !entry.isDeleted);
  const filteredEntries = activeEntries.filter((entry) => {
    if (filters.status !== 'all' && entry.status !== filters.status) return false;
    if (filters.type !== 'all' && entry.tipo !== filters.type) return false;
    if (!filters.search) return true;
    const query = filters.search.toLowerCase();
    const client = clients.find((item) => item.id === entry.clienteId)?.nome || '';
    return entry.numeroDocumento.toLowerCase().includes(query) || entry.fornecedor?.toLowerCase().includes(query) || client.toLowerCase().includes(query) || entry.observacoes?.toLowerCase().includes(query);
  });
  const paid = (type: FinancialEntry['tipo']) => activeEntries.filter((entry) => entry.tipo === type && ['Liquidado', 'Conciliado'].includes(entry.status)).reduce((total, entry) => total + (entry.valorPago || entry.valorLiquido), 0);
  const open = (type: FinancialEntry['tipo']) => activeEntries.filter((entry) => entry.tipo === type && ['Aberto', 'Pendente'].includes(entry.status)).reduce((total, entry) => total + entry.valorLiquido, 0);
  const totalReceitasMes = paid('Receita');
  const totalDespesasMes = paid('Despesa');
  return {
    activeEntries, filteredEntries, totalReceitasMes, totalDespesasMes,
    lucroLiquido: totalReceitasMes - totalDespesasMes,
    totalSaldoBancario: accounts.filter((account) => account.situacao === 'Ativa').reduce((total, account) => total + account.saldoAtual, 0),
    totalAReceber: open('Receita'), totalAPagar: open('Despesa'),
    totalVencidos: activeEntries.filter((entry) => ['Aberto', 'Pendente'].includes(entry.status) && new Date(entry.dataVencimento) < new Date()).reduce((total, entry) => total + entry.valorLiquido, 0),
  };
}
