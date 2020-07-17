<template>
  <section class="subscriptions-section">
    <div class="container grid">
      <div class="u-width--100" v-if="!loading">
        <div v-if="subscriptions.length === 0" class="grid-cell grid-cell--col12">
          <EmptyState
            :text="$t('Subscriptions.emptyCase')"
            :subtitle="$t('Subscriptions.exploreDescription')"
          >
            <img svg-inline src="../../assets/icons/subscriptions/subscriptions-icon.svg">
          </EmptyState>
          <router-link :to="{ name: 'spatial-data-catalog' }">
            <button class="button is-primary goDo">{{$t('Subscriptions.goDo')}}</button>
          </router-link>
        </div>
        <template v-else>
          <SectionTitle class="grid-cell" :showActionButton="true">
            <template slot="icon">
              <img src="../../assets/icons/subscriptions/subscriptions_tick-icon.svg" width="18" height="20" />
            </template>

            <template slot="title">
              <VisualizationsTitle :defaultTitle="$t(`DataPage.tabs.yourSubscriptions`)"/>
            </template>

            <template slot="dropdownButton">
              <SettingsDropdown>
                <img svg-inline src="../../assets/icons/common/filter.svg">
              </SettingsDropdown>
            </template>

            <template slot="actionButton">
              <button class="button is-primary">{{$t('Subscriptions.new')}}</button>
            </template>
          </SectionTitle>
          <ul>
            <div class="subscription-item u-flex" v-for="subscription in subscriptions" :key="subscription.slug">
              <DatasetListItem :dataset="subscription"></DatasetListItem>
              <DatasetListItemExtra></DatasetListItemExtra>
            </div>
          </ul>
        </template>
      </div>
    </div>
  </section>
</template>

<script>

import { mapState } from 'vuex';
import EmptyState from 'new-dashboard/components/States/EmptyState';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import VisualizationsTitle from 'new-dashboard/components/VisualizationsTitle';
import SettingsDropdown from 'new-dashboard/components/Settings/Settings';
import DatasetListItem from '@carto/common-ui/do-catalog/src/components/catalogSearch/DatasetListItem';
import DatasetListItemExtra from 'new-dashboard/components/Subscriptions/DatasetListItemExtra';

export default {
  name: 'SubscriptionsPage',
  components: {
    EmptyState,
    SectionTitle,
    VisualizationsTitle,
    SettingsDropdown,
    DatasetListItem,
    DatasetListItemExtra
  },
  data () {
    return {
      loading: true
    };
  },
  computed: {
    ...mapState({
      subscriptions: state => state.doCatalog.subscriptionsList
    })
  },
  async mounted () {
    await this.$store.dispatch('doCatalog/fetchSubscriptionsList', true);
    this.loading = false;
  },
  beforeDestroy () {},
  beforeRouteUpdate (to, from, next) {},
  methods: {}
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.subscriptions-section {
  margin-top: 64px;
  .empty-state {
    margin: 20vh 0 58px;
    /deep/ h6 {
      font-weight: 600;
      color: $neutral--800;
    }
  }
  .goDo {
    margin: 0 auto 20vh auto;
  }
  ul {
    border-top: 1px solid $neutral--300;
  }
  .subscription-item {
    &:hover {
      background-color: transparentize($color: $blue--100, $amount: 0.52);
    }
    .dataset-listItem-extra-container {
      border-bottom: 1px solid $neutral--300;
    }
    .list-item {
      &:hover {
        background-color: transparent;
      }
    }
  }
}

</style>
