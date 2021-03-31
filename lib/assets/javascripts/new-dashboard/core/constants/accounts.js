export const individual = ['Individual', 'Annual Individual'];
export const free2020 = ['Free 2020'];
export const free = ['FREE'];
export const student = ['CARTO for the Classroom - Annual', 'CARTO for students - Annual'];

export const accountsWithTableLimits = [...individual, ...free2020];
export const accountsWithPublicMapLimits = [...individual, ...free2020];
export const accountsWithPrivateMapsLimits = free2020;
export const accountsWithApiKeysLimits = [...individual, ...free2020];
export const accountsWithApiKeysLimitsToZero = free2020;

export const accountsWithDataCatalogLimits = [...free2020, ...free, ...student];
export const accountsWithOauthAppsLimits = [...free2020, ...free, ...student];
export const accountsWithDefaultPublic = [...free2020, ...free, ...student];
