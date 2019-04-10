<template>
  <Modal :name="'wizardBuilder'" :isOpen="isModalOpen" @closeModal="closeModal">
    <div class="wizard">
      <Header :stepNames="stepNames" :currentStep="step" @goToStep="goToStep"></Header>
      <Step
        v-if="isCurrentStep(1)"
        :stepNum="1">
      </Step>
      <Step
        v-if="isCurrentStep(2)"
        :stepNum="2"></Step>
      <Step
        v-if="isCurrentStep(3)"
        :stepNum="3"></Step>
      <Step
        v-if="isCurrentStep(4)"
        :stepNum="4"></Step>
      <Step
        v-if="isCurrentStep(5)"
        :stepNum="5"></Step>
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

import data from '../shared/data';
import methods from '../shared/methods';

export default {
  name: 'WizardBuilder',
  components: {
    Step,
    Header,
    Footer,
    Modal
  },
  data () {
    return {
      ...data(),
      stepNames: [
        'Intro',
        'Import your data',
        'Explore the dataset',
        'Create & publish a map',
        'Final'
      ]
    };
  },
  methods
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
  /* stylelint-disable */
  transform: translate3d(0, 0, 0);
  /* stylelint-enable */
}
</style>
