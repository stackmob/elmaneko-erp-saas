/**
 * Centralized Formatter & Data Sanitizer Utilities for Elmaneko 3D ERP
 */

/**
 * Formats a number to Brazilian Real currency format (R$ 0,00)
 */
export const formatCurrency = (value: number | undefined | null): string => {
  const numericVal = Number(value || 0);
  return numericVal.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Formats a number with 2 decimal places without currency symbol (0,00)
 */
export const formatNumber = (value: number | undefined | null, decimals = 2): string => {
  const numericVal = Number(value || 0);
  return numericVal.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Formats a date string (YYYY-MM-DD or ISO) into Brazilian DD/MM/YYYY format
 */
export const formatDateBR = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '—';
  try {
    const cleanDateStr = dateStr.split('T')[0];
    const parts = cleanDateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-BR');
  } catch (e) {
    return dateStr;
  }
};

/**
 * Returns a safe YYYY-MM-DD date string for date inputs
 */
export const safeDateString = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return new Date().toISOString().split('T')[0];
  if (typeof dateInput === 'string') {
    return dateInput.split('T')[0];
  }
  try {
    return dateInput.toISOString().split('T')[0];
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Sanitizes and shortens document identifiers or UUIDs
 */
export const formatDocNumber = (prefix: string, id: string | undefined | null): string => {
  if (!id) return `${prefix}-000000`;
  const cleanId = String(id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
  return `${prefix}-${cleanId}`;
};
