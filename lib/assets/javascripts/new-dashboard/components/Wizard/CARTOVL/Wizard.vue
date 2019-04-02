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
          :title="'CARTO VL Step 1 Title'"
          :subTitle="'CARTO VL Step 1 Subtitle'"
          :stepNum="1">
        </WizardStep>
        <WizardStep
          v-if="isCurrentStep(2)"
          :title="'Step 2 Title'"
          :subTitle="'Step 2 Subtitle'"
          :stepNum="2"></WizardStep>
        <WizardStep
          v-if="isCurrentStep(3)"
          :title="'Step 3'"
          :subTitle="'Step 3 Subtitle'"
          :stepNum="3"></WizardStep>
        <WizardStep
          v-if="isCurrentStep(4)"
          :title="'Step 4'"
          :subTitle="'Step 4 Subtitle'"
          :stepNum="4"></WizardStep>
        <WizardStep
          v-if="isCurrentStep(5)"
          :title="'Step 5'"
          :subTitle="'Step 5 Subtitle'"
          :stepNum="5"></WizardStep>
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
    Modal
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
