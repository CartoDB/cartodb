<template>
    <ul class="settingssidebar">
      <li class="settingssidebar-item">
        <a :href="`${ baseUrl }/profile`" class="text is-txtPrimary settingssidebar-link">{{ $t(`SettingsPages.sidebar.profile`) }}</a>
      </li>
      <li class="settingssidebar-item">
        <a :href="`${ baseUrl }/account`" class="text is-txtPrimary settingssidebar-link">{{ $t(`SettingsPages.sidebar.account`) }}</a>
      </li>
      <li class="settingssidebar-item">
        <router-link :to="{ name: 'connected_apps' }" class="text is-txtPrimary settingssidebar-link" :class="{'is-active': isConnectedAppsPage()}">{{ $t(`SettingsPages.sidebar.connectedApps`) }} </router-link>
      </li>
      <li v-if="isOrgAdmin || !isInsideOrg" class="settingssidebar-item">
        <a :href="planUrl" class="text is-txtPrimary settingssidebar-link">{{ $t(`SettingsPages.sidebar.billing`) }}</a>
      </li>
      <li v-if="isOrgAdmin" class="settingssidebar-item">
        <a :href="`${ baseUrl }/organization`" class="text is-txtPrimary settingssidebar-link">{{ $t(`SettingsPages.sidebar.organizationSettings`) }}</a>
      </li>
      <span class="settingssidebar-separator"></span>
      <li class="settingssidebar-item">
        <a :href="`${ baseUrl }/your_apps`" class="text is-txtPrimary settingssidebar-link" :class="{'is-active': isDevelopersSettingsPage()}">{{ $t(`SettingsPages.sidebar.developerSettings`) }}</a>
      </li>
   </ul>
</template>

<script>
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
      isOrgAdmin () {
        return this.user.org_admin;
      },
      isInsideOrg () {
        return Boolean(this.user.organization);
      }
    })
  },
  methods: {
    isConnectedAppsPage () {
      return (this.$route || {}).name === 'connected_apps';
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
  margin: 14px 0;
  background-color: rgba(0, 0, 0, 0.1);
}

</style>
