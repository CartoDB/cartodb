<template>
  <section class="welcome-first">
    <div class="container">
      <div class="welcome-first__greeting title is-title">{{ greeting }}</div>
      <div class="welcome-first__text text is-caption" v-html="text"></div>
      <div class="welcome-first__actions">
        <OnboardingButton v-if="!isOrganizationAdmin" :isFirstTimeViewingDashboard="true"></OnboardingButton>
        <a class="button button--border"
          :href="`${ baseUrl }/organization`"
          v-if="isOrganizationAdmin">
          {{ $t('HomePage.WelcomeSection.firstTime.manageOrganization') }}
        </a>
      </div>
    </div>
  </section>
</template>

<script>
import CreateButton from 'new-dashboard/components/CreateButton.vue';
import OnboardingButton from 'new-dashboard/components/Onboarding/OnboardingButton.vue';

export default {
  name: 'WelcomeFirst',
  components: {
    CreateButton,
    OnboardingButton
  },
  props: {
    name: String,
    userType: String
  },
  computed: {
    greeting () {
      return this.$t('HomePage.WelcomeSection.greeting', {name: this.$props.name});
    },
    text () {
      const organizationName = this.$store.state.user.organization && this.$store.state.user.organization.name;

      const firstTimeMessage = this.$t('HomePage.WelcomeSection.firstTime.message');
      const planMessage = this.$t(`HomePage.WelcomeSection.firstTime.planMessage.${this.userType}`, {
        organizationName
      });

      return `${firstTimeMessage} ${planMessage}`;
    },
    baseUrl () {
      return this.$store.state.user.base_url;
    },
    isOrganizationAdmin () {
      return this.userType === 'organizationAdmin';
    },
    isOrganizationUser () {
      return this.userType === 'organizationUser';
    },
    organizationMail () {
      const organization = this.$store.state.user.organization;
      return organization.admin_email;
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

.welcome-first {
  position: relative;
  padding: 124px 0;
  background: $primary-color;
  color: $white;
  text-align: center;

  &__text {
    max-width: 724px;
    margin: 16px auto 48px;
  }

  &__actions {
    display: flex;
    justify-content: center;
  }

  .button.button--border {
    border: 1px solid $white;
    background: none;
    color: $white;
    text-transform: uppercase;

    &:not(:last-child) {
      margin-right: 36px;
    }
  }
}
</style>
