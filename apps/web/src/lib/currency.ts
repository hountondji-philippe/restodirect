export const CURRENCIES: Record<string, { symbol: string; locale: string }> = {
  XOF: { symbol: 'FCFA', locale: 'fr-FR' },
  EUR: { symbol: '€', locale: 'fr-FR' },
  USD: { symbol: '$', locale: 'en-US' },
};

export function formatPrice(amount: number, currency: string = 'XOF'): string {
  const currencyInfo = CURRENCIES[currency] || CURRENCIES.XOF;
  
  if (currency === 'XOF') {
    return `${amount.toLocaleString('fr-FR')} ${currencyInfo.symbol}`;
  }
  
  return `${amount.toLocaleString(currencyInfo.locale, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })} ${currencyInfo.symbol}`;
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCIES[currency]?.symbol || 'FCFA';
}