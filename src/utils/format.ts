export const formatCurrency = (amount: number, currency = 'NGN') => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency === 'NGN' ? 'NGN' : 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (date: string | Date, format: 'short' | 'long' | 'time' = 'short') => {
  const d = new Date(date);
  
  switch (format) {
    case 'long':
      return d.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'time':
      return d.toLocaleTimeString('en-NG', {
        hour: '2-digit',
        minute: '2-digit'
      });
    default:
      return d.toLocaleDateString('en-NG');
  }
};

export const formatNumber = (num: number, decimals = 0) => {
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};