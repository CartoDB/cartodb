import { importFilesFrom } from 'new-dashboard/utils/dynamic-import';

const folderContext = require.context('./', true, /\.vue$/);

const wizardName = 'wizardCARTOframes';
const steps = importFilesFrom(folderContext, /^\.\/(.*)\.vue$/);

export default { steps, wizardName };
