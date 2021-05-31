<template>
  <Page class="page--data">
    <SecondaryNavigation>
      <div class="tabs">
        <router-link :to="{ name: 'datasets' }" class="tabs__item title is-small" exact active-class="is-active" :class="{'is-active': isDatasetPage }">
          <span>{{ $t('DataPage.tabs.datasets') }}</span>
        </router-link>
        <router-link  v-if="hasBigqueryConnection" :to="{ name: 'tilesets' }" class="tabs__item title is-small" exact active-class="is-active">
          <span>{{ $t('DataPage.tabs.tilesets') }}</span>
        </router-link>
        <router-link :to="{ name: 'your-connections' }" class="tabs__item title is-small" exact active-class="is-active">
          <span>{{ $t('DataPage.tabs.connections') }}</span>
        </router-link>
        <router-link :to="{ name: 'subscriptions' }" class="tabs__item title is-small" exact active-class="is-active" v-if="isDOEnabled">
          <span>{{ $t('DataPage.tabs.subscriptions') }}</span>
        </router-link>
      </div>
      <router-link v-if="!isOnPremise" :to="{ name: 'spatial-data-catalog' }" class="tabs__item title is-small u-flex u-flex__align--center right" exact active-class="is-active">
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
import { mapGetters, mapState } from 'vuex';

export default {
  name: 'DataPage',
  components: {
    Page,
    SecondaryNavigation
  },
  computed: {
    ...mapState({
      connections: state => state.connectors.connections
    }),
    ...mapGetters({
      hasBigqueryConnection: 'connectors/hasBigqueryConnection',
      isOnPremise: 'config/isOnPremise'
    }),
    isDatasetPage () {
      return isAllowed(this.$route.params.filter);
    },
    isDOEnabled () {
      return this.$store.state.user.do_enabled;
    }
  },
  mounted () {
    this.fetchConnections();
  },
  methods: {
    async fetchConnections () {
      await this.$store.dispatch('connectors/fetchConnectionsList');
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
  padding-bottom: 13px;
  &:before {
    content: url('../../assets/icons/section-title/catalog_blue.svg');
    margin-right: 8px;
  }
  &.is-active {
    &:before {
      content: url('../../assets/icons/section-title/catalog.svg');
    }
  }
}
</style>
