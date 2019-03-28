<template>
  <div class="wizard">
    <Header :stepNames="stepNames" :currentStep="step"></Header>
    <WizardStep
      v-if="isCurrentStep(1)"
      :title="'Step 1 Title'"
      :subTitle="'Step 1 Subtitle'"
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
    <Footer :currentStep="step"  @goToStep="goToStep"></Footer>
  </div>
</template>

<script>
import WizardStep from 'new-dashboard/components/Wizard/WizardStep.vue';
import Header from 'new-dashboard/components/Wizard/Header.vue';
import Footer from 'new-dashboard/components/Wizard/Footer.vue';

export default {
  name: 'Wizard',
  components: {
    WizardStep,
    Header,
    Footer
  },
  props: {
    maxSteps: {
      type: Number,
      default: 5
    }
  },
  data () {
    return {
      step: 2,
      stepNames: [
        'Load CARTO VL',
        'Define container',
        'Create the map',
        'Add data layer',
        'Download'
      ]
    };
  },
  methods:{
    goToStep (stepNum) {
      console.log('stepNum', stepNum);
      this.step = stepNum;
      console.log('step', this.step);
      console.log('-----');
    },
    isCurrentStep (stepNum) {
      return this.step == stepNum;
    }
  }
}
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.wizard {
  height: 1000px;
  background-color: $softblue;
}

</style>