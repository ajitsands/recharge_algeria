export const OPERATORS = [
  {
    id: 1,
    code: 'mobilis',
    name: 'Mobilis',
    nameAr: 'موبيليس',
    prefixes: ['065', '066', '067', '069', '65', '66', '67', '69'],
    defaultCommission: 5.0,
    color: '#008a3e'
  },
  {
    id: 2,
    code: 'djezzy',
    name: 'Djezzy',
    nameAr: 'جازي',
    prefixes: ['077', '078', '079', '77', '78', '79'],
    defaultCommission: 4.5,
    color: '#e4002b'
  },
  {
    id: 3,
    code: 'ooredoo',
    name: 'Ooredoo',
    nameAr: 'أوريدو',
    prefixes: ['054', '055', '056', '54', '55', '56'],
    defaultCommission: 5.2,
    color: '#ed1c24'
  }
];

export function detectOperatorByPrefix(phoneNumber) {
  if (!phoneNumber) return null;
  const clean = phoneNumber.replace(/[^0-9]/g, '');
  
  for (const op of OPERATORS) {
    for (const pfx of op.prefixes) {
      if (clean.startsWith(pfx)) {
        return op;
      }
    }
  }
  return null;
}
