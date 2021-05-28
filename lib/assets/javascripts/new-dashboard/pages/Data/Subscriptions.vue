<template>
  <section class="subscriptions-section">
    <div class="container grid">
      <div class="full-width">
        <SectionTitle class="grid-cell" :showActionButton="true">
          <template slot="icon">
            <img src="../../assets/icons/subscriptions/subscriptions_tick-icon.svg" width="18" height="20" />
          </template>
          <template slot="title">
            <VisualizationsTitle :defaultTitle="$t('DataPage.tabs.subscriptions')"/>
          </template>
          <template slot="actionButton">
            <router-link :to="{ name: 'spatial-data-catalog' }"  exact>
              <button class="button is-primary">{{$t('Subscriptions.new')}}</button>
            </router-link>
          </template>
        </SectionTitle>
      </div>
      <div v-if="loading" class="u-flex u-flex__direction--column u-flex__align--center u-width--100 u-mt--120">
        <span class="loading u-mb--12">
          <img svg-inline src="../../assets/icons/common/loading.svg" class="loading__svg"/>
        </span>
        <span class="text is-txtSoftGrey is-caption">
          Loading your subscriptions…
        </span>
      </div>
      <div class="u-width--100" v-if="!loading">
        <div v-if="count === 0" class="grid-cell grid-cell--col12">
          <EmptyState
            :text="$t('Subscriptions.emptyCase')"
            :subtitle="$t('Subscriptions.exploreDescription')"
          >
            <img svg-inline src="../../assets/icons/subscriptions/subscriptions-icon.svg">
          </EmptyState>
        </div>
        <template v-else>
          <ul>
            <div class="subscription-item u-flex" v-for="subscription in subscriptionsByPage" :key="subscription.slug">
              <DatasetListItem :dataset="subscription" :extra="true"></DatasetListItem>
            </div>
          </ul>
          <div class="u-mt--48 u-flex u-flex__justify--center">
            <Pager :count="count" :currentPage="currentPage" @goToPage="goToPage"></Pager>
          </div>
        </template>
      </div>
    </div>
    <SubscriptionAccess v-if="showAccessModal"></SubscriptionAccess>
  </section>
</template>

<script>

import { mapState } from 'vuex';
import EmptyState from 'new-dashboard/components/States/EmptyState';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import VisualizationsTitle from 'new-dashboard/components/VisualizationsTitle';
import SettingsDropdown from 'new-dashboard/components/Settings/Settings';
import DatasetListItem from 'new-dashboard/components/Catalog/browser/DatasetListItem';
import Pager from 'new-dashboard/components/Catalog/browser/Pager';
import SubscriptionAccess from '../../components/Subscriptions/SubscriptionAccess.vue';

export default {
  name: 'SubscriptionsPage',
  components: {
    EmptyState,
    SectionTitle,
    VisualizationsTitle,
    SubscriptionAccess,
    SettingsDropdown,
    DatasetListItem,
    Pager
  },
  data () {
    return {
      loading: true,
      currentPage: 0,
      id_interval: null
    };
  },
  computed: {
    ...mapState({
      subscriptions: state => state.catalog.subscriptionsList,
      currentSubscription: state => state.catalog.currentSubscription
    }),
    showAccessModal () {
      return !!this.currentSubscription;
    },
    pageSize () {
      return process.env.VUE_APP_PAGE_SIZE || 10;
    },
    count () {
      return this.subscriptions.filter(s => s.slug).length;
    },
    subscriptionsByPage () {
      return this.subscriptions.filter(s => s.slug).reverse().slice(
        this.currentPage * this.pageSize,
        (this.currentPage + 1) * this.pageSize
      );
    },
    isAnySubscriptionSyncing () {
      return this.subscriptions && this.subscriptions.find(s => s.sync_status === 'syncing');
    }
  },
  async mounted () {
    this.loading = true;
    window.scrollTo(0, 0);
    try {
      await this.$store.dispatch('catalog/fetchSubscriptionsList');
      await this.$store.dispatch('catalog/fetchSubscriptionsDetailsList', this.subscriptions.map(s => s.id));
    } catch (e) {
      this.loading = false;
    }
    this.loading = false;
  },
  methods: {
    goToPage (pageNum) {
      this.currentPage = pageNum;
      window.scrollTo(0, 0);
    }
  },
  watch: {
    isAnySubscriptionSyncing: {
      immediate: true,
      handler () {
        clearInterval(this.id_interval);
        if (this.isAnySubscriptionSyncing) {
          this.id_interval = setInterval(() => {
            this.$store.dispatch('catalog/fetchSubscriptionsList', true);
          }, 5000);
        }
      }
    }
  },
  destroyed () {
    clearInterval(this.id_interval);
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.full-width {
  width: 100%;
}

.subscriptions-section {
  min-height: 640px;
  margin-top: 64px;

  &__filter {
    justify-content: space-between;
    height: 168px;

    &--dropdown {
      position: relative;
    }
  }

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
  .loading {
    &__svg {
      width: 40px;
      stroke: $blue--500;
      g {
        stroke-width: 2px;
        circle {
          stroke:#36434A;
          stroke-opacity: 0.25;
        }
      }
    }
  }
}

</style>
