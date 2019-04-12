<template>
  <div class="footer">
    <div class="container u-flex u-flex__justify--end">
      <button class="button button--ghost js-prev" v-if="showPrevButton" @click="prev">
        {{ $t('Wizards.footer.back') }}
      </button>
      <button class="button is-primary js-next" v-if="showNextButton" @click="next">
        {{ $t('Wizards.footer.next', { nextStep: this.stepNames[this.currentStep] }) }}
      </button>
      <button class="button is-primary js-goToDashboard" v-if="!showNextButton" @click="goToDashboard">
        {{ $t('Wizards.footer.goToDashboard') }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Footer',
  props: {
    stepNames: Array,
    currentStep: {
      type: Number,
      default: 1
    }
  },
  computed: {
    maxSteps () {
      return this.stepNames.length;
    },
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
    },
    goToDashboard () {
      this.$router.push({ name: 'home' });
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.footer {
  padding: 2em;
  background: $white;
}
</style>
