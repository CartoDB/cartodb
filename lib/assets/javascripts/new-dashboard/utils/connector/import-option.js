import { IMPORT_OPTIONS } from 'builder/components/modals/add-layer/content/imports/import-options';

export function getImportOption (connector) {
  return Object.values(IMPORT_OPTIONS).find(({ name, options }) => connector === name || connector === (options && options.service));
}
