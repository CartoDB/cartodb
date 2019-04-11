// Steps
import Step1 from './Step1.vue';
import Step2 from './Step2.vue';
import Step3 from './Step3.vue';
import Step4 from './Step4.vue';
import Step5 from './Step5.vue';
import Step6 from './Step6.vue';
import Step7 from './Step7.vue';

const wizardName = 'wizardCARTOframes';
const steps = [
  { stepName: 'Intro', component: Step1 },
  { stepName: 'Setup', component: Step2 },
  { stepName: 'Connect to CARTO', component: Step3 },
  { stepName: 'Read dataset', component: Step4 },
  { stepName: 'Add data layer', component: Step5 },
  { stepName: 'Display map', component: Step6 },
  { stepName: 'Download', component: Step7 }
];

export default { steps, wizardName };
