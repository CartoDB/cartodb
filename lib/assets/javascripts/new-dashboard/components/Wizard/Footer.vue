<template>
  <div class="footer">
    <div class="container u-flex u-flex__justify--end">
      <button class="button button--outline" v-if="showPrevButton" @click="prev">&#60; Prev</button>
      <button class="button is-primary" v-if="showNextButton" @click="next">Next &#62;</button>
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
