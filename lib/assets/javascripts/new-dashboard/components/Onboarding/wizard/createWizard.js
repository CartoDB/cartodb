import Step from 'new-dashboard/components/Onboarding/components/Step.vue';
import Header from 'new-dashboard/components/Onboarding/components/Header.vue';
import Footer from 'new-dashboard/components/Onboarding/components/Footer.vue';
import Modal from 'new-dashboard/components/Modal.vue';

import mixin from '../tutorials/mixin';
import template from 'raw-loader!./template.html';
import './style.scss';

const defaultComponentConfiguration = {
  template,
  components: {
    Step,
    Header,
    Footer,
    Modal
  },
  mixins: [mixin]
};

// Step configuration
// { stepName: '', component: <Step1> }

export function createWizard (name = '', steps = []) {
  if (!steps || !steps.length) {
    throw new Error('Steps components are needed to generate a Wizard');
  }

  const wizardConfiguration = generateWizardConfiguration(name, steps);

  return {
    ...defaultComponentConfiguration,
    ...wizardConfiguration
  };
}

function generateWizardConfiguration (name, steps) {
  // Generate Wizard configuration
  const { components, stepNames } = parseSteps(steps);

  const wizardComponents = {
    ...defaultComponentConfiguration.components,
    ...components
  };

  return {
    name,
    components: wizardComponents,
    data () {
      return { stepNames };
    }
  };
}

function parseSteps (steps) {
  const components = {};
  const stepNames = [];

  steps.forEach(step => {
    components[step.component.name] = step.component;
    stepNames.push(step.stepName);
  });

  return { components, stepNames };
}
