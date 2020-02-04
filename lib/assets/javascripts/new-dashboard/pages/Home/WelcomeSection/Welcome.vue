<template>
  <section class="welcome-section">
    <WelcomeFirst v-if="isFirst" :name="name" :userType="userType"></WelcomeFirst>
    <WelcomeCompact v-else :name="name" :userType="userType">
      <template>
        <a v-if="isFree2020User && accountUpgradeURL" :href="accountUpgradeURL" class="button is-primary">
          {{ $t('HomePage.WelcomeSection.upgradeNow') }}
        </a>
        <div v-else-if="trialEndDate">
          <span v-html="trialTimeLeft" class="title is-small"></span>
          <a class="title is-small" :href="accountUpgradeURL" v-if="accountUpgradeURL">
            {{ $t('HomePage.WelcomeSection.subscribeNow') }}
          </a>
        </div>
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
      accountUpgradeURL: state => state.config.upgrade_url,
      trialEndDate: state => state.user.trial_ends_at,
      user: state => state.user,
      name: state => state.user.name || state.user.username,
      organization: state => state.user.organization,
      notifications: state => state.user.organizationNotifications
    }),
    trialTimeLeft () {
      return this.$t(`HomePage.WelcomeSection.trialMessage`, { date: distanceInWordsStrict(this.trialEndDate, new Date(), { partialMethod: 'round' }) });
    },
    userType () {
      if (this.isOrganizationAdmin()) {
        return 'organizationAdmin';
      }

      if (this.isOrganizationUser()) {
        return 'organizationUser';
      }

      if (this.isIndividualUser()) {
        return 'individual';
      }

      if (this.isPersonal30()) {
        return '30day';
      }

      if (this.isFreeUser()) {
        return 'free';
      }

      if (this.isFree2020User()) {
        return 'free2020';
      }

      return 'unknown';
    }
  },
  methods: {
    isPersonal30 () {
      const personal30User = ['PERSONAL30'];
      return personal30User.includes(this.user.account_type);
    },
    isFreeUser () {
      const freeUser = ['FREE'];
      return freeUser.includes(this.user.account_type);
    },
    isIndividualUser () {
      const individualUsers = ['Individual'];
      return individualUsers.includes(this.user.account_type);
    },
    isFree2020User () {
      const free2020Users = ['Free2020'];
      return free2020Users.includes(this.user.account_type);
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
