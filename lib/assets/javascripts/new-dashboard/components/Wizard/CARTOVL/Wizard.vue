<template>
  <div>
    <div @click="openModal">
      <Selector
        :title="'Develop an interactive map'"
        :text="'Build impresive map visualizations to enrich your website and apps.'"
        :tags="['JavaScript', 'CARTO VL']"
        :iconModifier="'map'"></Selector>
    </div>
    <Modal :name="'wizardCARTOVL'" :isOpen="isModalOpen" @closeModal="closeModal">
      <div class="wizard">
        <Header :stepNames="stepNames" :currentStep="step"></Header>
        <WizardStep
          v-if="isCurrentStep(1)"
          :stepNum="1">
          <Step1></Step1>
        </WizardStep>
        <WizardStep
          v-if="isCurrentStep(2)"
          :stepNum="2">
          <Step2></Step2>
        </WizardStep>
        <WizardStep
          v-if="isCurrentStep(3)"
          :stepNum="3">
          <Step3></Step3>
        </WizardStep>
        <WizardStep
          v-if="isCurrentStep(4)"
          :stepNum="4">
          <Step4></Step4>
        </WizardStep>
        <WizardStep
          v-if="isCurrentStep(5)"
          :stepNum="5">
          <Step5></Step5>
        </WizardStep>
        <Footer
          :stepNames="stepNames"
          :currentStep="step"
          @goToStep="goToStep"
          @closeModal="closeModal"></Footer>
      </div>
    </Modal>
  </div>
</template>

<script>
import Selector from 'new-dashboard/components/Wizard/Selector.vue';
import WizardStep from 'new-dashboard/components/Wizard/WizardStep.vue';
import Header from 'new-dashboard/components/Wizard/Header.vue';
import Footer from 'new-dashboard/components/Wizard/Footer.vue';
import Modal from 'new-dashboard/components/Modal.vue';

// Steps
import Step1 from './Step1.vue';
import Step2 from './Step2.vue';
import Step3 from './Step3.vue';
import Step4 from './Step4.vue';
import Step5 from './Step5.vue';

import props from '../shared/props';
import data from '../shared/data';
import methods from '../shared/methods';

export default {
  name: 'WizardCARTOVL',
  components: {
    Selector,
    WizardStep,
    Header,
    Footer,
    Modal,
    Step1,
    Step2,
    Step3,
    Step4,
    Step5
  },
  props,
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
  overflow: scroll;
  background-color: $onboarding__bg-color;
}
</style>
