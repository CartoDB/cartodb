import { importFilesFrom } from 'new-dashboard/utils/dynamic-import';

const folderContext = require.context('./', true, /Step.*\.vue$/);

const wizardName = 'wizardCARTOframes';
const showFooter = false;
const steps = importFilesFrom(folderContext, /^\.\/(.*)\.vue$/);

export default { steps, showFooter, wizardName };
