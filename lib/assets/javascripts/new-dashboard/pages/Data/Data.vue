<template>
  <Page class="page--data">
    <SecondaryNavigation v-if="showDataCatalog">
      <div class="tabs">
        <router-link :to="{ name: 'datasets' }" class="tabs__item title is-small" exact active-class="is-active" :class="{'is-active': isDatasetPage }">
          <span>{{ $t('DataPage.tabs.yourDatasets') }}</span>
        </router-link>
        <!-- <router-link :to="{ name: 'subscriptions' }" class="tabs__item title is-small" exact active-class="is-active">
          <span>{{ $t('DataPage.tabs.yourSubscriptions') }}</span>
        </router-link> -->
      </div>
      <router-link :to="{ name: 'do-catalog' }" class="tabs__item title is-small" exact active-class="is-active" style="margin-left: auto;">
        <span>{{ $t('DataPage.tabs.spatialDataCatalog') }}</span>
      </router-link>
    </SecondaryNavigation>
    <router-view></router-view>
  </Page>
</template>

<script>
import { mapState } from 'vuex';
import Page from 'new-dashboard/components/Page';
import SecondaryNavigation from 'new-dashboard/components/SecondaryNavigation';
import { isAllowed } from 'new-dashboard/core/configuration/filters';
import * as accounts from 'new-dashboard/core/constants/accounts';

export default {
  name: 'DataPage',
  components: {
    Page,
    SecondaryNavigation
  },
  computed: {
    ...mapState({
      planAccountType: state => state.user.account_type
    }),
    isDatasetPage () {
      return isAllowed(this.$route.params.filter);
    },
    showDataCatalog () {
      return true;
      // return !accounts.accountsWithDataCatalogLimits.includes(this.planAccountType);
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
