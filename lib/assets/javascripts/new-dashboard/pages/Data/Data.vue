<template>
  <Page class="page--data">
    <SecondaryNavigation>
      <div class="tabs">
        <router-link :to="{ name: 'datasets' }" class="tabs__item title is-small" exact active-class="is-active" :class="{'is-active': isDatasetPage }">
          <span>{{ $t('DataPage.tabs.yourDatasets') }}</span>
        </router-link>
        <router-link :to="{ name: 'catalog' }" class="tabs__item title is-small" active-class="is-active">
          <span>{{ $t('DataPage.tabs.catalog') }}</span>
        </router-link>
      </div>
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
