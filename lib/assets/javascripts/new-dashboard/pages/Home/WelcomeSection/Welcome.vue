<template>
  <section class="welcome-section">
    <WelcomeFirst v-if="isFirst" :name="name" :userType="userType"></WelcomeFirst>
    <WelcomeCompact v-else :name="name" :organization="organization" :userType="userType" @newDatesetClicked="onNewDatesetClicked" @newMapClicked="onNewMapClicked">
      <template>
        <a v-if="showUpgrade" :href="accountUpgradeURL" class="button is-primary">
          {{ $t('HomePage.WelcomeSection.upgradeNow') }}
        </a>
        <div v-else-if="showTrialReminder && isFree2020User()">
          <span v-html="accountTimeLeft" class="title is-small"></span>
          <a class="title is-small" :href="accountUpgradeURL" v-if="accountUpgradeURL">
            {{ $t('HomePage.WelcomeSection.upgradeNow') }}
          </a>
        </div>
        <div v-else-if="showTrialReminder">
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
import moment from 'moment';
import WelcomeCompact from './WelcomeCompact';
import WelcomeFirst from './WelcomeFirst';
import WelcomeBasic from './WelcomeBasic';
import { isOrganizationAdmin } from 'new-dashboard/core/models/organization';
import * as accounts from 'new-dashboard/core/constants/accounts';

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
      const days = this.getTimeLeft(this.trialEndDate);
      return this.$t(`HomePage.WelcomeSection.trialMessage`, { date: days });
    },
    accountTimeLeft () {
      const days = this.getTimeLeft(this.trialEndDate);
      return this.$t(`HomePage.WelcomeSection.accountMessage`, { date: days });
    },
    showUpgrade () {
      return this.isFree2020User() && this.accountUpgradeURL && !this.showTrialReminder;
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
      return accounts.individual.includes(this.user.account_type);
    },
    isFree2020User () {
      return accounts.free2020.includes(this.user.account_type);
    },
    isOrganizationAdmin () {
      if (!this.isOrganizationUser()) {
        return false;
      }

      return isOrganizationAdmin(this.user.organization, this.user);
    },
    isOrganizationUser () {
      return Boolean(this.organization);
    },
    getTimeLeft (finishDate) {
      const endDate = moment(finishDate);
      const now = moment();
      return Math.ceil(endDate.diff(now, 'days', true));
    },
    onNewDatesetClicked () {
      this.$emit('newDatesetClicked');
    },
    onNewMapClicked () {
      this.$emit('newMapClicked');
    }
  }
};
</script>
