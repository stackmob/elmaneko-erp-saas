import { useEmpresa, useUpdateEmpresa } from './data/useCompanyData';
import { 
  useFilamentos, useAddFilamento, useUpdateFilamento, useDeleteFilamento,
  useInsumos, useAddInsumo, useUpdateInsumo, useDeleteInsumo,
  useCompras, useAddCompra 
} from './data/useFilamentsData';
import { 
  useImpressoras, useAddImpressora, useUpdateImpressora, useDeleteImpressora,
  useTarifasEnergia, useAddTarifaEnergia 
} from './data/usePrintersData';
import { 
  useProdutos, useAddProduto, useUpdateProduto, useDeleteProduto,
  useProducoes, useAddProducao, useUpdateProducaoStatus 
} from './data/useProductsData';
import { 
  useClientes, useAddCliente, useUpdateCliente, useDeleteCliente,
  useOrcamentos, useAddOrcamento, useUpdateOrcamento, useDeleteOrcamento,
  useVendas, useAddVenda 
} from './data/useSalesData';
import { 
  useContasFinanceiras, useAddContaFinanceira, useUpdateContaFinanceira, useDeleteContaFinanceira,
  useCategoriasFinanceiras, useAddCategoriaFinanceira, useUpdateCategoriaFinanceira, useDeleteCategoriaFinanceira,
  useCentrosCusto, useAddCentroCusto, useUpdateCentroCusto, useDeleteCentroCusto,
  useLancamentosFinanceiros, useAddLancamentoFinanceiro, useLiquidarLancamento, useCancelLancamento, useDeleteLancamento,
  useMovimentacoesFinanceiras, useTransferenciasFinanceiras, useAddTransferenciaFinanceira,
  useAuditoriaFinanceira, useSyncFinancialEntries 
} from './data/useFinancialData';

export function useData() {
  return {
    // Company
    useEmpresa,
    useUpdateEmpresa,
    // Filaments & Supplies & Purchases
    useFilamentos,
    useAddFilamento,
    useUpdateFilamento,
    useDeleteFilamento,
    useInsumos,
    useAddInsumo,
    useUpdateInsumo,
    useDeleteInsumo,
    useCompras,
    useAddCompra,
    // Printers & Tariffs
    useImpressoras,
    useAddImpressora,
    useUpdateImpressora,
    useDeleteImpressora,
    useTarifasEnergia,
    useAddTarifaEnergia,
    // Products & Production
    useProdutos,
    useAddProduto,
    useUpdateProduto,
    useDeleteProduto,
    useProducoes,
    useAddProducao,
    useUpdateProducaoStatus,
    // Clients & Sales & Budgets
    useClientes,
    useAddCliente,
    useUpdateCliente,
    useDeleteCliente,
    useOrcamentos,
    useAddOrcamento,
    useUpdateOrcamento,
    useDeleteOrcamento,
    useVendas,
    useAddVenda,
    // Financial
    useContasFinanceiras,
    useAddContaFinanceira,
    useUpdateContaFinanceira,
    useDeleteContaFinanceira,
    useCategoriasFinanceiras,
    useAddCategoriaFinanceira,
    useUpdateCategoriaFinanceira,
    useDeleteCategoriaFinanceira,
    useCentrosCusto,
    useAddCentroCusto,
    useUpdateCentroCusto,
    useDeleteCentroCusto,
    useLancamentosFinanceiros,
    useAddLancamentoFinanceiro,
    useLiquidarLancamento,
    useCancelLancamento,
    useDeleteLancamento,
    useMovimentacoesFinanceiras,
    useTransferenciasFinanceiras,
    useAddTransferenciaFinanceira,
    useAuditoriaFinanceira,
    useSyncFinancialEntries
  };
}

export {
  useEmpresa,
  useUpdateEmpresa,
  useFilamentos,
  useAddFilamento,
  useUpdateFilamento,
  useDeleteFilamento,
  useInsumos,
  useAddInsumo,
  useUpdateInsumo,
  useDeleteInsumo,
  useCompras,
  useAddCompra,
  useImpressoras,
  useAddImpressora,
  useUpdateImpressora,
  useDeleteImpressora,
  useTarifasEnergia,
  useAddTarifaEnergia,
  useProdutos,
  useAddProduto,
  useUpdateProduto,
  useDeleteProduto,
  useProducoes,
  useAddProducao,
  useUpdateProducaoStatus,
  useClientes,
  useAddCliente,
  useUpdateCliente,
  useDeleteCliente,
  useOrcamentos,
  useAddOrcamento,
  useUpdateOrcamento,
  useDeleteOrcamento,
  useVendas,
  useAddVenda,
  useContasFinanceiras,
  useAddContaFinanceira,
  useUpdateContaFinanceira,
  useDeleteContaFinanceira,
  useCategoriasFinanceiras,
  useAddCategoriaFinanceira,
  useUpdateCategoriaFinanceira,
  useDeleteCategoriaFinanceira,
  useCentrosCusto,
  useAddCentroCusto,
  useUpdateCentroCusto,
  useDeleteCentroCusto,
  useLancamentosFinanceiros,
  useAddLancamentoFinanceiro,
  useLiquidarLancamento,
  useCancelLancamento,
  useDeleteLancamento,
  useMovimentacoesFinanceiras,
  useTransferenciasFinanceiras,
  useAddTransferenciaFinanceira,
  useAuditoriaFinanceira,
  useSyncFinancialEntries
};
