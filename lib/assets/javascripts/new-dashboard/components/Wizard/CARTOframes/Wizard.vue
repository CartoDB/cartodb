<template>
  <div>
    <div @click="openModal">
      <Selector
        :title="$t('Wizards.cartoframes.title')"
        :text="$t('Wizards.cartoframes.subtitle')"
        :tags="$t('Wizards.cartoframes.tags')"
        iconModifier="notebook"></Selector>
    </div>
    <Modal :name="'wizardCARTOframes'" :isOpen="isModalOpen" @closeModal="closeModal">
      <div class="wizard">
        <Header :stepNames="stepNames" :currentStep="step"></Header>
        <Step
          v-if="isCurrentStep(1)"
          :stepNum="1">
          <Step1></Step1>
        </Step>
        <Step
          v-if="isCurrentStep(2)"
          :stepNum="2">
          <Step2></Step2>
        </Step>
        <Step
          v-if="isCurrentStep(3)"
          :stepNum="3">
          <Step3></Step3>
        </Step>
        <Step
          v-if="isCurrentStep(4)"
          :stepNum="4">
          <Step4></Step4>
        </Step>
        <Step
          v-if="isCurrentStep(5)"
          :stepNum="5">
          <Step5></Step5>
        </Step>
        <Step
          v-if="isCurrentStep(6)"
          :stepNum="6">
          <Step6></Step6>
        </Step>
        <Step
          v-if="isCurrentStep(7)"
          :stepNum="7"
          :fullWidth="true">
          <Step7></Step7>
        </Step>
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
import Step from 'new-dashboard/components/Wizard/Step.vue';
import Header from 'new-dashboard/components/Wizard/Header.vue';
import Footer from 'new-dashboard/components/Wizard/Footer.vue';
import Modal from 'new-dashboard/components/Modal.vue';

// Steps
import Step1 from './Step1.vue';
import Step2 from './Step2.vue';
import Step3 from './Step3.vue';
import Step4 from './Step4.vue';
import Step5 from './Step5.vue';
import Step6 from './Step6.vue';
import Step7 from './Step7.vue';

import props from '../shared/props';
import data from '../shared/data';
import methods from '../shared/methods';

export default {
  name: 'WizardCARTOframes',
  components: {
    Selector,
    Step,
    Header,
    Footer,
    Modal,
    Step1,
    Step2,
    Step3,
    Step4,
    Step5,
    Step6,
    Step7
  },
  props,
  data () {
    return {
      ...data(),
      stepNames: [
        'Intro',
        'Setup',
        'Connect to CARTO',
        'List sample data',
        'Read dataset',
        'Display map',
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
