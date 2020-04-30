<template>
    <ul class="settingssidebar">
      <li class="settingssidebar-item">
        <a :href="`${ baseUrl }/profile`" class="text is-txtPrimary settingssidebar-link">{{ $t(`SettingsPages.sidebar.profile`) }}</a>
      </li>
      <li class="settingssidebar-item">
        <a :href="`${ baseUrl }/account`" class="text is-txtPrimary settingssidebar-link">{{ $t(`SettingsPages.sidebar.account`) }}</a>
      </li>
      <li class="settingssidebar-item">
        <router-link :to="{ name: 'app_permissions' }" class="text is-txtPrimary settingssidebar-link" :class="{'is-active': isAppPermissionsPage()}">{{ $t(`SettingsPages.sidebar.connectedApps`) }}</router-link>
      </li>
      <li v-if="!isLocallyHosted && (isOrgAdmin || !isInsideOrg)" class="settingssidebar-item">
        <a :href="planUrl" class="text is-txtPrimary settingssidebar-link">{{ $t(`SettingsPages.sidebar.billing`) }}</a>
      </li>
      <li v-if="isOrgAdmin" class="settingssidebar-item">
        <a :href="`${ baseUrl }/organization`" class="text is-txtPrimary settingssidebar-link">{{ $t(`SettingsPages.sidebar.organizationSettings`) }}</a>
      </li>
      <span class="settingssidebar-separator"></span>
      <li class="settingssidebar-item" v-if="hasDirectDBConnection">
        <router-link :to="{ name: 'connections' }" class="text is-txtPrimary settingssidebar-link" :class="{'is-active': isConnectionsPage()}">{{ $t(`SettingsPages.sidebar.connections`) }}</router-link>
      </li>
      <li class="settingssidebar-item">
        <a :href="`${ baseUrl }/your_apps`" class="text is-txtPrimary settingssidebar-link" :class="{'is-active': isDevelopersSettingsPage()}">{{ $t(`SettingsPages.sidebar.developerSettings`) }}</a>
      </li>
   </ul>
</template>

<script>
import { hasFeatureEnabled } from 'new-dashboard/core/models/user';
import { mapState } from 'vuex';

export default {
  name: 'SettingsSidebar',
  data () {
    return {
      developerSettingsPages: [
        'oauth_apps',
        'oauth_app_new',
        'oauth_app_edit',
        'oauth_apps_list'
      ]
    };
  },
  computed: {
    ...mapState({
      baseUrl: state => state.user.base_url,
      user: state => state.user,
      planUrl: state => state.config.plan_url,
      isLocallyHosted: state => state.config.cartodb_com_hosted,
      hasDirectDBConnection: state => hasFeatureEnabled(state.user, 'dbdirect')
    }),
    isInsideOrg () {
      return this.$store.getters['user/isOrganizationUser'];
    },
    isOrgAdmin () {
      return this.user.org_admin;
    }
  },
  methods: {
    isAppPermissionsPage () {
      return (this.$route || {}).name === 'app_permissions';
    },
    isConnectionsPage () {
      return (this.$route || {}).name === 'connections';
    },
    isDevelopersSettingsPage () {
      return this.developerSettingsPages.includes((this.$route || {}).name);
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.settingssidebar-item {
  margin-bottom: 20px;
}

.settingssidebar-link {
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }

  &.is-active {
    color: #333;
    font-weight: 700;
  }
}

.settingssidebar-separator {
  display: flex;
  width: 240px;
  height: 1px;
  margin: 20px 0;
  background-color: rgba(0, 0, 0, 0.1);
}

</style>
