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
          :title="'CARTOframes Step 1 Title'"
          :subTitle="'CARTOframes Step 1 Subtitle'"
          :stepNum="1">
        </Step>
        <Step
          v-if="isCurrentStep(2)"
          :title="'Step 2 Title'"
          :subTitle="'Step 2 Subtitle'"
          :stepNum="2"></Step>
        <Step
          v-if="isCurrentStep(3)"
          :title="'Step 3'"
          :subTitle="'Step 3 Subtitle'"
          :stepNum="3"></Step>
        <Step
          v-if="isCurrentStep(4)"
          :title="'Step 4'"
          :subTitle="'Step 4 Subtitle'"
          :stepNum="4"></Step>
        <Step
          v-if="isCurrentStep(5)"
          :title="'Step 5'"
          :subTitle="'Step 5 Subtitle'"
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
        'Setup',
        'List datasets',
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
