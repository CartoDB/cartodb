<template>
  <div>
    <div @click="openModal">
      <Selector
        :title="$t('Wizards.builder.title')"
        :text="$t('Wizards.builder.subtitle')"
        :tags="$t('Wizards.builder.tags')"
        :iconModifier="'window'"></Selector>
    </div>
    <Modal :name="'wizardBuilder'" :isOpen="isModalOpen" @closeModal="closeModal">
      <div class="wizard">
        <Header :stepNames="stepNames" :currentStep="step"></Header>
        <template v-for="step in 7">
          <Step
            v-if="isCurrentStep(step)"
            :stepNum="step"
            :key="step"
            :fullWidth="step === maxSteps">
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

import props from '../shared/props';
import data from '../shared/data';
import methods from '../shared/methods';

export default {
  name: 'WizardBuilder',
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
    Step5
  },
  props,
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
  overflow: scroll;
  background-color: $onboarding__bg-color;
}
</style>
