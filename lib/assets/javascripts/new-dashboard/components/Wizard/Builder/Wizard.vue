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
  </div>
</template>

<script>
import Selector from 'new-dashboard/components/Wizard/Selector.vue';
import Step from 'new-dashboard/components/Wizard/Step.vue';
import Header from 'new-dashboard/components/Wizard/Header.vue';
import Footer from 'new-dashboard/components/Wizard/Footer.vue';
import Modal from 'new-dashboard/components/Modal.vue';

import props from '../shared/props';
import data from '../shared/data';
import methods from '../shared/methods';

export default {
  name: 'WizardCARTOVL',
  components: {
    Selector,
    Step,
    Header,
    Footer,
    Modal
  },
  props,
  data () {
    return {
      ...data(),
      stepNames: [
        'Intro',
        'Import your data',
        'Explore the dataset',
        'Create a map',
        'Publish your map',
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
