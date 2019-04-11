// Steps
import Step1 from './Step1.vue';
import Step2 from './Step2.vue';
import Step3 from './Step3.vue';
import Step4 from './Step4.vue';
import Step5 from './Step5.vue';
import Step6 from './Step6.vue';

const wizardName = 'wizardBuilder';
const steps = [
  { stepName: 'Intro', component: Step1 },
  { stepName: 'Import your data', component: Step2 },
  { stepName: 'Explore the dataset', component: Step3 },
  { stepName: 'Create a map', component: Step4 },
  { stepName: 'Publish your map', component: Step5 },
  { stepName: 'Final', component: Step6 },
];

export default { steps, wizardName };
