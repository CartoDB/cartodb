<template>
  <ul class="app-tabs">
    <li class="app-tabs-item">
      <a :href="`${ baseUrl }/your_apps`" class="text is-small is-txtPrimary app-tabs-link">{{ $t(`SettingsPages.tabs.apiKeys`) }}</a>
    </li>

    <li class="app-tabs-item is-active">
      <router-link :to="{ name: 'oauth_apps_list' }" class="text is-small is-txtPrimary app-tabs-link">
        {{ $t(`SettingsPages.tabs.oAuthApps`) }}
      </router-link>
    </li>

    <li class="app-tabs-item" v-if="isMobileSDKEnabled">
      <a :href="`${ baseUrl }/your_apps/mobile`" class="text is-small is-txtPrimary app-tabs-link">{{ $t(`SettingsPages.tabs.mobileApps`) }}</a>
    </li>
  </ul>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
  name: 'AppTabs',
  computed: {
    ...mapState({ baseUrl: state => state.user.base_url }),
    ...mapGetters({ isMobileSDKEnabled: 'user/isMobileSDKEnabled' })
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.app-tabs {
  display: flex;
  margin-bottom: 26px;
  border-bottom: 1px solid $neutral--300;
}

.app-tabs-item {
  position: relative;
  margin-right: 32px;
  padding-bottom: 34px;
  transform: translate3d(0, 1px, 0);

  &.is-active {
    &::before {
      content: '';
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 1px;
      background: $neutral--800;
    }

    .app-tabs-link {
      color: $text__color;
    }
  }
}

.app-tabs-link {
  &.is-active {
    color: $text__color;
  }

  &:hover {
    text-decoration: underline;
  }
}

</style>
