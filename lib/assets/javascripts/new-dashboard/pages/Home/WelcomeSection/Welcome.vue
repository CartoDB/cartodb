<template>
  <section class="welcome-section" :class="{ 'is-user-notification': userNotification }">
    <WelcomeFirst v-if="isFirst" :name="name" :userType="userType"></WelcomeFirst>
    <WelcomeCompact v-if="!isFirst" :name="name" :userType="userType">
      <template v-if="trialEndDate">
        <span class="text is-small">{{ trialTimeLeft }}</span>
        <a class="button button--small button--outline" :href="`//${ accountUpdateURL }`" v-if="accountUpdateURL">
          {{ $t('HomePage.WelcomeSection.addPaymentMethod') }}
        </a>
      </template>
    </WelcomeCompact>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import distanceInWordsStrict from 'date-fns/distance_in_words_strict';
import WelcomeCompact from './WelcomeCompact';
import WelcomeFirst from './WelcomeFirst';
import WelcomeBasic from './WelcomeBasic';
import { isOrganizationAdmin } from 'new-dashboard/core/models/organization';

export default {
  name: 'Welcome',
  components: {
    WelcomeBasic,
    WelcomeCompact,
    WelcomeFirst
  },
  computed: {
    ...mapState({
      isFirst: state => state.config.isFirstTimeViewingDashboard,
      accountUpdateURL: state => state.config.account_update_url,
      trialEndDate: state => state.user.trial_ends_at,
      user: state => state.user,
      name: state => state.user.name || state.user.username,
      organization: state => state.user.organization,
      notifications: state => state.user.organizationNotifications
    }),
    userNotification () {
      return this.$store.getters['user/isNotificationVisible'];
    },
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
        return '30day';
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
      return freeUser.includes(this.user.account_type);
    },
    isProUser () {
      const noProUsers = ['internal', 'partner', 'ambassador', 'free'];
      return noProUsers.includes(this.user.account_type);
    },
    isOrganizationAdmin () {
      if (!this.isOrganizationUser()) {
        return false;
      }

      return isOrganizationAdmin(this.user.organization, this.user);
    },
    isOrganizationUser () {
      return Boolean(this.organization);
    }
  }
};
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.welcome-section.is-user-notification {
  margin-top: 60px;
}
</style>