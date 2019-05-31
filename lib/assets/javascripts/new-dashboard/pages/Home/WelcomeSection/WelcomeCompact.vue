<template>
  <SecondaryNavigation :leftText="greeting">
    <template slot="buttons">
      <OnboardingButton :isFirstTimeViewingDashboard="false"></OnboardingButton>
      <CreateButton class="button--ghost" visualizationType="map" :disabled="isViewer">{{ $t(`HomePage.WelcomeSection.actions.createMap`) }}</CreateButton>
      <CreateButton class="button--ghost" visualizationType="dataset" :disabled="!canCreateDatasets">{{ $t(`HomePage.WelcomeSection.actions.createDataset`) }}</CreateButton>
    </template>
    <template slot="trialEndDate">
      <slot />
    </template>
  </SecondaryNavigation>
</template>

<script>
import CreateButton from 'new-dashboard/components/CreateButton.vue';
import OnboardingButton from 'new-dashboard/components/Onboarding/OnboardingButton.vue';
import SecondaryNavigation from 'new-dashboard/components/NavigationBar/SecondaryNavigation.vue';

export default {
  name: 'WelcomeCompact',
  components: {
    CreateButton,
    OnboardingButton,
    SecondaryNavigation
  },
  props: {
    name: String
  },
  computed: {
    greeting () {
      return this.$t('HomePage.WelcomeSection.greeting', {name: this.$props.name});
    },
    canCreateDatasets () {
      return this.$store.getters['user/canCreateDatasets'];
    },
    isViewer () {
      return this.$store.getters['user/isViewer'];
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.button--ghost {
  margin-right: 48px;
  padding: 0;
  background: none;
  color: #047AE6;
  text-transform: none;
}

.button--outline {
  margin-left: 24px;
  padding: 9px 16px;
}
</style>
