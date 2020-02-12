<template>
  <section class="welcome-section">
    <WelcomeFirst v-if="isFirst" :name="name" :userType="userType"></WelcomeFirst>
    <WelcomeCompact v-if="!isFirst" :name="name" :userType="userType">
      <template v-if="showTrialReminder">
        <span v-html="trialTimeLeft" class="title is-small"></span>
        <a class="title is-small" :href="accountUpgradeURL" v-if="accountUpgradeURL">
          {{ $t('HomePage.WelcomeSection.subscribeNow') }}
        </a>
      </template>
    </WelcomeCompact>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import moment from 'moment';
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
      showTrialReminder: state => state.user.show_trial_reminder,      
      user: state => state.user,
      name: state => state.user.name || state.user.username,
      organization: state => state.user.organization,
      notifications: state => state.user.organizationNotifications
    }),
    trialTimeLeft () {
      const endDate = moment(this.trialEndDate);
      const now = moment();
      const days = Math.ceil(endDate.diff(now, 'days', true));
      return this.$t(`HomePage.WelcomeSection.trialMessage`, { date: days });
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
