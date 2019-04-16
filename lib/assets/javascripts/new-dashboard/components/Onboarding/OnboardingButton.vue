<template>
  <button
    class="button"
    :class="[isFirstTimeViewingDashboard ? 'button--cta' : 'button--ghost']"
    @click="openOnboarding()">
    {{ $t('Wizards.Distributor.cta') }}
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
  methods: {
    openOnboarding () {
      this.$router.push({ name: 'onboarding' });
    }
  }
};
</script>
