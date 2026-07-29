import { useCompanyData } from './data/useCompanyData';
import { useFilamentsData } from './data/useFilamentsData';
import { usePrintersData } from './data/usePrintersData';
import { useProductsData } from './data/useProductsData';
import { useSalesData } from './data/useSalesData';
import { useFinancialData } from './data/useFinancialData';

export function useData() {
  const company = useCompanyData();
  const filaments = useFilamentsData();
  const printers = usePrintersData();
  const products = useProductsData();
  const sales = useSalesData();
  const financial = useFinancialData();

  return {
    ...company,
    ...filaments,
    ...printers,
    ...products,
    ...sales,
    ...financial,
  };
}

export {
  useCompanyData,
  useFilamentsData,
  usePrintersData,
  useProductsData,
  useSalesData,
  useFinancialData,
};
