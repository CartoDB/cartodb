import { importFilesFrom } from 'new-dashboard/utils/dynamic-import';

const folderContext = require.context('./', true, /\.vue$/);
const stepComponents = importFilesFrom(folderContext, /^\.\/(.*)\.vue$/);

const wizardName = 'wizardBuilder';
const steps = [
  { stepName: 'Intro', component: stepComponents['Step1'] },
  { stepName: 'Import your data', component: stepComponents['Step2'] },
  { stepName: 'Explore the dataset', component: stepComponents['Step3'] },
  { stepName: 'Create a map', component: stepComponents['Step4'] },
  { stepName: 'Publish your map', component: stepComponents['Step5'] },
  { stepName: 'Final', component: stepComponents['Step6'] }
];

export default { steps, wizardName };
