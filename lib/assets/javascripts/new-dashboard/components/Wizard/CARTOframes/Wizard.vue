<template>
  <div>
    <div @click="openModal">
      <WizardSelector
        :title="'Integrate a spatial analysis in your notebook'"
        :text="'Improve your analysis adding powers to your scripts.'"
        :tags="['Python', 'Jupyter', 'CARTOframes']"
        :iconModifier="'notebook'"></WizardSelector>
    </div>
    <Modal :name="'wizardCARTOframes'" :isOpen="isModalOpen" @closeModal="closeModal">
      <div class="wizard">
        <Header :stepNames="stepNames" :currentStep="step"></Header>
        <WizardStep
          v-if="isCurrentStep(1)"
          :title="'CARTOframes Step 1 Title'"
          :subTitle="'CARTOframes Step 1 Subtitle'"
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
import WizardSelector from 'new-dashboard/components/Wizard/WizardSelector.vue';
import WizardStep from 'new-dashboard/components/Wizard/WizardStep.vue';
import Header from 'new-dashboard/components/Wizard/Header.vue';
import Footer from 'new-dashboard/components/Wizard/Footer.vue';
import Modal from 'new-dashboard/components/Modal.vue';

export default {
  name: 'WizardCARTOVL',
  components: {
    WizardSelector,
    WizardStep,
    Header,
    Footer,
    Modal
  },
  props: {
    maxSteps: {
      type: Number,
      default: 5
    }
  },
  data () {
    return {
      step: 1,
      stepNames: [
        'Intro',
        'Setup',
        'List datasets',
        'Read dataset',
        'Display map',
        'Download'
      ],
      isModalOpen: false
    };
  },
  methods: {
    goToStep (stepNum) {
      this.step = stepNum;
    },
    isCurrentStep (stepNum) {
      return this.step === stepNum;
    },
    openModal () {
      console.log('openModal');
      this.isModalOpen = true;
    },
    closeModal () {
      this.isModalOpen = false;
      this.step = 1;
      this.$emit('closeModal');
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
  overflow: scroll;
  background-color: $onboarding__bg-color;
}
</style>
