<template>
  <section class="welcome-section">
    <WelcomeFirst v-if="isFirst" :username="username" :userType="userType"></WelcomeFirst>
    <WelcomeCompact v-if="!isFirst" :username="username" :userType="userType">
      <template v-if="trialEndDate">
        <span class="text is-small">{{ trialTimeLeft }}</span>
        <a class="button button--small button--outline" :href="accountUpdateURL">
          {{ $t('HomePage.WelcomeSection.addPaymentMethod') }}
        </a>
      </template>
    </WelcomeCompact>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import distanceInWordsStrict from 'date-fns/distance_in_words_strict';
import CreateButton from 'new-dashboard/components/CreateButton.vue';
import WelcomeCompact from './WelcomeCompact';
import WelcomeFirst from './WelcomeFirst';
import WelcomeBasic from './WelcomeBasic';
import { isOrganizationAdmin } from 'new-dashboard/core/organization';

export default {
  name: 'Welcome',
  components: {
    CreateButton,
    WelcomeBasic,
    WelcomeCompact,
    WelcomeFirst
  },
  computed: {
    ...mapState({
      isFirst: state => state.config.isFirstTimeViewingDashboard,
      accountUpdateURL: state => state.config.accountUpdateURL,
      trialEndDate: state => state.user.trial_ends_at,
      username: state => state.user.username,
      organization: state => state.user.organization,
      notifications: state => state.user.organizationNotifications
    }),
    trialTimeLeft () {
      return this.$t(`HomePage.WelcomeSection.trialMessage`, { date: distanceInWordsStrict(this.trialEndDate, new Date()) });
    },
    userType () {
      if (this.isOrganizationAdmin()) {
        return 'organizationAdmin';
      }

      if (this.isOrganizationUser()) {
        return 'organizationUser';
      }

      if (this.isProUser()) {
        return 'professional';
      }

      if (this.isInTrial()) {
        return 'trial';
      }

      if (this.isFreeUser()) {
        return 'free';
      }

      return 'unknown';
    }
  },
  methods: {
    isInTrial () {
      return Boolean(this.trialEndDate);
    },
    isFreeUser () {
      const freeUser = ['free'];
      return freeUser.includes(this.$store.state.user.account_type);
    },
    isProUser () {
      const noProUsers = ['internal', 'partner', 'ambassador', 'free'];
      return noProUsers.includes(this.$store.state.user.account_type);
    },
    isOrganizationAdmin () {
      if (!this.isOrganizationUser()) {
        return false;
      }

      return isOrganizationAdmin(this.$store.state.user.organization, this.$store.state.user);
    },
    isOrganizationUser () {
      return Boolean(this.organization);
    }
  }
};
</script>
