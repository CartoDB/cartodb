<template>
  <ul class="settingstabs">
    <li class="settingstabs-item">
      <a :href="`${ baseUrl }/your_apps`" class="text is-small is-txtPrimary settingstabs-link">{{ $t(`SettingsPages.tabs.apiKeys`) }}</a>
    </li>
    <li class="settingstabs-item is-active">
      <router-link :to="{ name: 'oauth_apps_list' }" class="text is-small is-txtPrimary settingstabs-link">
        {{ $t(`SettingsPages.tabs.oAuthApps`) }}
      </router-link>
    </li>
    <li class="settingstabs-item">
      <a :href="`${ baseUrl }/your_apps/mobile`" class="text is-small is-txtPrimary settingstabs-link">{{ $t(`SettingsPages.tabs.mobileApps`) }}</a>
    </li>
  </ul>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'SettingsTabs',
  computed: {
    ...mapState({
      baseUrl: state => state.user.base_url
    })
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.settingstabs {
  display: flex;
  margin-bottom: 30px;
  border-bottom: 1px solid $neutral--300;
}

.settingstabs-item {
  position: relative;
  margin-right: 32px;
  padding-bottom: 34px;

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

    .settingstabs-link {
      color: $text__color;
    }
  }

}

.settingstabs-link {
  &.is-active {
    color: $text__color;
  }

  &:hover {
    text-decoration: underline;
  }
}

</style>
