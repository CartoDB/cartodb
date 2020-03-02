<template>
  <section class="welcome-first">
    <div class="container">
      <div class="welcome-first__greeting title is-title">{{ greeting }}</div>
      <div class="welcome-first__text text is-body" v-html="text"></div>
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
import differenceInDays from 'date-fns/difference_in_days';
import OnboardingButton from 'new-dashboard/components/Onboarding/OnboardingButton.vue';

export default {
  name: 'WelcomeFirst',
  components: {
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
      if (this.isFree2020User) {
        return this.$t(`HomePage.WelcomeSection.firstTime.planMessage.${this.userType}`);
      }
      const organizationName = this.$store.state.user.organization && this.$store.state.user.organization.name;

      const firstTimeMessage = this.$t('HomePage.WelcomeSection.firstTime.message');
      const planMessage = this.$t(`HomePage.WelcomeSection.firstTime.planMessage.${this.userType}`, {
        organizationName,
        trialLength: this.trialLength
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
    isFree2020User () {
      return this.userType === 'free2020';
    },
    organizationMail () {
      const organization = this.$store.state.user.organization;
      return organization.admin_email;
    },
    canCreateDatasets () {
      return this.$store.getters['user/canCreateDatasets'];
    },
    trialLength () {
      const trialEndDate = this.$store.state.user.trial_ends_at;
      const createdAt = this.$store.state.user.created_at;
      return trialEndDate ? differenceInDays(trialEndDate, createdAt) : null;
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
