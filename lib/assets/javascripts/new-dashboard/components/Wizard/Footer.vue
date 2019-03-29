<template>
  <div class="footer">
    <div class="container u-flex u-flex__justify--end">
      <button class="button button--ghost" v-if="showPrevButton" @click="prev">Back</button>
      <button class="button is-primary" v-if="showNextButton" @click="next">Next: {{ this.stepNames[this.currentStep]}}</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Footer',
  props: {
    maxSteps: {
      type: Number,
      default: 5
    },
    stepNames: Array,
    currentStep: Number
  },
  computed: {
    showNextButton () {
      return this.currentStep < this.maxSteps;
    },
    showPrevButton () {
      return this.currentStep > 1;
    }
  },
  methods: {
    prev () {
      this.$emit('goToStep', this.currentStep - 1);
    },
    next () {
      this.$emit('goToStep', this.currentStep + 1);
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.footer {
  padding: 2em;
  border-top: 1px solid $grey;
  background: $white;
}
</style>
