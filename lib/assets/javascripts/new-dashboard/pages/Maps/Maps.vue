<template>
  <Page class="page--maps">
    <SecondaryNavigation>
      <div class="tabs">
        <router-link :to="{ name: 'maps' }" class="tabs__item title is-small" exact active-class="is-active" :class="{'is-active': isCartoPage }">
          <span>{{ $t('MapsPage.tabs.carto') }}</span>
        </router-link>
        <router-link v-if="!isOnPremise" :to="{ name: 'external' }" class="tabs__item title is-small" active-class="is-active">
          <span>{{ $t('MapsPage.tabs.external') }}</span>
        </router-link>
      </div>
    </SecondaryNavigation>
    <router-view></router-view>
  </Page>
</template>

<script>

import Page from 'new-dashboard/components/Page';
import SecondaryNavigation from 'new-dashboard/components/SecondaryNavigation';
import { mapGetters } from 'vuex';

export default {
  name: 'MapsPage',
  components: {
    Page,
    SecondaryNavigation
  },
  computed: {
    ...mapGetters({
      isOnPremise: 'config/isOnPremise'
    }),
    isCartoPage () {
      return (this.$route || {}).name === 'maps';
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.tabs {
  display: flex;

  &__item {
    margin-right: 48px;
    padding: 24px 0 20px;
    border-bottom: 4px solid transparent;
    background: none;
    color: $color-primary;
    text-transform: none;

    &.is-active {
      border-color: currentColor;
      color: $black;
    }
  }
}

</style>
