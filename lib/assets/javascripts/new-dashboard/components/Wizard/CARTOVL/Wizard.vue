<template>
  <Modal :name="'wizardCARTOVL'" :isOpen="isModalOpen" @closeModal="closeModal">
    <div ref="wizard" class="wizard">
      <Header :stepNames="stepNames" :currentStep="step" @goToStep="goToStep"></Header>

      <template v-for="step in 7">
        <Step
          v-if="isCurrentStep(step)"
          :stepNum="step"
          :key="step"
          :fullWidth="step === stepNames.length">
          <component :is="`Step${step}`"></component>
        </Step>
      </template>

      <Footer
        :stepNames="stepNames"
        :currentStep="step"
        @goToStep="goToStep"
        @closeModal="closeModal"></Footer>
    </div>
  </Modal>
</template>

<script>
import Step from 'new-dashboard/components/Wizard/Step.vue';
import Header from 'new-dashboard/components/Wizard/onboarding-modals/Header.vue';
import Footer from 'new-dashboard/components/Wizard/onboarding-modals/Footer.vue';
import Modal from 'new-dashboard/components/Modal.vue';

// Steps
import Step1 from './Step1.vue';
import Step2 from './Step2.vue';
import Step3 from './Step3.vue';
import Step4 from './Step4.vue';
import Step5 from './Step5.vue';
import Step6 from './Step6.vue';

import data from '../shared/data';
import methods from '../shared/methods';

export default {
  name: 'WizardCARTOVL',
  components: {
    Step,
    Header,
    Footer,
    Modal,
    Step1,
    Step2,
    Step3,
    Step4,
    Step5,
    Step6
  },
  data () {
    return {
      ...data(),
      stepNames: [
        'Intro',
        'Load CARTO VL',
        'Define container',
        'Create map',
        'Add data layer',
        'Download'
      ]
    };
  },
  methods,
  updated () {
    if (this.$refs.wizard) {
      this.$refs.wizard.scrollTo({ top: 0, left: 0 });
    }
  }
};
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.wizard {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  overflow: auto;
  background-color: $onboarding__bg-color;

  // Fix for Safari Scrolling with GPU acceleration
  transform: translate3d(0, 0, 0);
}
</style>
