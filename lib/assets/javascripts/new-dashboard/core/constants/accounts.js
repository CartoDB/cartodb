export const accountsWithLimits = ['Individual', 'Annual Individual'];
export const freeAccountsWithLimits = ['Free 2020'];

export const accountsWithTableLimits = [...accountsWithLimits, ...freeAccountsWithLimits];
export const accountsWithPublicMapLimits = [...accountsWithLimits, ...freeAccountsWithLimits];
export const accountsWithPrivateMapsLimits = [...accountsWithLimits, ...freeAccountsWithLimits];
export const accountsWithApiKeysLimits = [...accountsWithLimits, ...freeAccountsWithLimits];
export const accountsWithApiKeysLimitsToZero = freeAccountsWithLimits;
