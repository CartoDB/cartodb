<template>
  <button
    class="button"
    :class="[{'not-visited': !(hasVisitedOnboarding || isFirstTimeViewingDashboard)}, isFirstTimeViewingDashboard ? 'button--cta' : 'button--ghost']"
    @click="openOnboarding()">
    {{ buttonText }}
  </button>
</template>

<script>
export default {
  name: 'OnboardingButton',
  props: {
    isFirstTimeViewingDashboard: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      hasVisitedOnboarding: false
    };
  },
  mounted () {
    this.hasVisitedOnboarding = this.setHasVisitedOnboarding();
  },
  computed: {
    buttonText () {
      if (this.isFirstTimeViewingDashboard) {
        return this.$t('Wizards.Distributor.extendedCta');
      }
      return this.$t('Wizards.Distributor.cta');
    }
  },
  methods: {
    openOnboarding () {
      this.updateHasVisitedOnboarding(true);
      this.$router.push({ name: 'onboarding' });
    },
    setHasVisitedOnboarding () {
      if (localStorage.hasOwnProperty('hasVisitedOnboarding')) {
        return JSON.parse(window.localStorage.getItem('hasVisitedOnboarding'));
      } else {
        return false;
      }
    },
    updateHasVisitedOnboarding (visited) {
      this.hasVisitedOnboarding = visited;
      localStorage.hasVisitedOnboarding = JSON.stringify(visited);
    }
  }
};
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

button.button--ghost {
  position: relative;

  &.not-visited::after {
    content: '';
    position: absolute;
    top: -4px;
    right: -12px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: $onboarding-notification;
  }
}
</style>
