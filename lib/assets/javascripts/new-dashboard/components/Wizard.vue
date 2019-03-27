<template>
  <div class="wizard">
    <WizardStep
      v-if="isCurrentStep(1)"
      :title="'Step 1 Title'"
      :subTitle="'Step 2 Subtitle'"
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
    <button v-if="showPrevButton" @click="prev">Prev</button>
    <button v-if="showNextButton" @click="next">Next</button>
  </div>
</template>

<script>
import WizardStep from 'new-dashboard/components/WizardStep.vue';

export default {
  name: 'Wizard',
  components: {
    WizardStep,
  },
  props: {
    maxSteps: {
      type: Number,
      default: 3
    }
  },
  data () {
    return {
      step: 2
    };
  },
  computed: {
    showNextButton () {
      return this.step < this.maxSteps;
    },
    showPrevButton () {
      return this.step > 1;
    }
  },
  methods:{
    prev() {
      this.step--;
    },
    next() {
      this.step++;
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