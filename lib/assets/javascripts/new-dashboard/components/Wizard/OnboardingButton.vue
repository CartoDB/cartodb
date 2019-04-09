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
    isFirstTimeViewingDashboard: Boolean
  },
  methods: {
    openOnboarding () {
      this.$router.push({ name: 'onboarding' });
    }
  }
};
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.button {
  &.button--ghost {
    margin-right: 36px;
    padding: 0;
  }
}
</style>
