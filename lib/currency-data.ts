
export const defaultCurrencies = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    rate: 1.0000,
    enabled: true,
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    rate: 0.8500,
    enabled: true,
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    rate: 0.7300,
    enabled: true,
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    rate: 150.0000,
    enabled: false,
  },
  {
    code: 'BDT',
    name: 'Bangladeshi Taka',
    symbol: '৳',
    rate: 110.0000,
    enabled: true,
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    rate: 83.0000,
    enabled: false,
  },
];

export const defaultCurrencySettings = {
  defaultCurrency: 'USD',
  displayDecimals: 2,
  currencyPosition: 'left',
  thousandsSeparator: ',',
  decimalSeparator: '.',
};
export const formatCurrency = (
  amount: number,
  currencyCode: string,
  settings: any
) => {
  const currency = defaultCurrencies.find(c => c.code === currencyCode);
  if (!currency) return `${amount}`;

  const { symbol } = currency;
  const { displayDecimals, currencyPosition, thousandsSeparator, decimalSeparator } = settings;
  const parts = amount.toFixed(displayDecimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
  const formattedAmount = parts.join(decimalSeparator);
  switch (currencyPosition) {
    case 'left':
      return `${symbol}${formattedAmount}`;
    case 'right':
      return `${formattedAmount}${symbol}`;
    case 'left_space':
      return `${symbol} ${formattedAmount}`;
    case 'right_space':
      return `${formattedAmount} ${symbol}`;
    default:
      return `${symbol}${formattedAmount}`;
  }
};
