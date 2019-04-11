import { importFilesFrom } from 'new-dashboard/utils/dynamic-import';

const folderContext = require.context('./', true, /\.vue$/);
const stepComponents = importFilesFrom(folderContext, /^\.\/(.*)\.vue$/);

// Steps
const wizardName = 'wizardCARTOVL';
const steps = [
  { stepName: 'Intro', component: stepComponents['Step1'] },
  { stepName: 'Load CARTO VL', component: stepComponents['Step2'] },
  { stepName: 'Define container', component: stepComponents['Step3'] },
  { stepName: 'Create map', component: stepComponents['Step4'] },
  { stepName: 'Add data layer', component: stepComponents['Step5'] },
  { stepName: 'Style features', component: stepComponents['Step6'] },
  { stepName: 'Download', component: stepComponents['Step7'] }
];

export default { steps, wizardName };
