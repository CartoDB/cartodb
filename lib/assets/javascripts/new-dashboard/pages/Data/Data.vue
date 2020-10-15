<template>
  <Page class="page--data">
    <SecondaryNavigation>
      <div class="tabs">
        <router-link :to="{ name: 'datasets' }" class="tabs__item title is-small" exact active-class="is-active" :class="{'is-active': isDatasetPage }">
          <span>{{ $t('DataPage.tabs.datasets') }}</span>
        </router-link>
        <router-link :to="{ name: 'subscriptions' }" class="tabs__item title is-small" exact active-class="is-active" v-if="isDOEnabled">
          <span>{{ $t('DataPage.tabs.subscriptions') }}</span>
        </router-link>
      </div>
      <router-link :to="{ name: 'spatial-data-catalog' }" class="tabs__item title is-small right" exact active-class="is-active">
        <span>{{ $t('DataPage.tabs.catalog') }}</span>
      </router-link>
    </SecondaryNavigation>
    <router-view></router-view>
  </Page>
</template>

<script>
import Page from 'new-dashboard/components/Page';
import SecondaryNavigation from 'new-dashboard/components/SecondaryNavigation';
import { isAllowed } from 'new-dashboard/core/configuration/filters';

export default {
  name: 'DataPage',
  components: {
    Page,
    SecondaryNavigation
  },
  computed: {
    isDatasetPage () {
      return isAllowed(this.$route.params.filter);
    },
    isDOEnabled () {
      return this.$store.state.user.do_enabled;
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

.right {
  margin-left: auto;
  margin-right: 0;
}
</style>
