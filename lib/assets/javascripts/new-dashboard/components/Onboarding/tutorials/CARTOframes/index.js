import { importFilesFrom } from 'new-dashboard/utils/dynamic-import';

const folderContext = require.context('./', true, /\.vue$/);
const stepComponents = importFilesFrom(folderContext, /^\.\/(.*)\.vue$/);

const wizardName = 'wizardCARTOframes';
const steps = [
  { stepName: 'Intro', component: stepComponents['Step1'] },
  { stepName: 'Setup', component: stepComponents['Step2'] },
  { stepName: 'Connect to CARTO', component: stepComponents['Step3'] },
  { stepName: 'Read dataset', component: stepComponents['Step4'] },
  { stepName: 'Add data layer', component: stepComponents['Step5'] },
  { stepName: 'Display map', component: stepComponents['Step6'] },
  { stepName: 'Download', component: stepComponents['Step7'] }
];

export default { steps, wizardName };
