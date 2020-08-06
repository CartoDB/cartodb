<template>
  <div class="u-pb--72">
    <div class="grid grid-cell u-flex__justify--center">
      <div class="grid-cell--col12 navigation-header">
        <router-link
          class="title is-small is-txtNavyBlue back-link"
          :to="{ name: 'do-catalog' }"
        >
          <img class="u-mr--12" src="../../../assets/icons/catalog/back-arrow.svg" alt="back" />
          Datasets list
        </router-link>
      </div>
    </div>
    <div v-if="loading" class="u-flex u-flex__align--center u-flex__direction--column u-mt--120">
      <span class="loading u-mr--12">
        <svg viewBox="0 0 38 38">
          <g transform="translate(1 1)" fill="none" fill-rule="evenodd">
            <circle stroke-opacity=".5" cx="18" cy="18" r="18"/>
            <path d="M36 18c0-9.94-8.06-18-18-18">
              <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite"/>
            </path>
          </g>
        </svg>
      </span>
      <span class="text is-txtSoftGrey is-caption u-mt--12">
        Loading dataset details…
      </span>
    </div>
    <transition name="fade">
      <div v-if="!loading">
        <DatasetActionsBar
          v-if="subscription"
          :subscription="subscription"
          :slug="dataset.slug"
          class="u-mt--12"
        ></DatasetActionsBar>
        <DatasetHeader></DatasetHeader>
        <div class="grid grid-cell u-flex__justify--center">
          <NavigationTabs class="grid-cell--col12">
            <router-link :to="{ name: 'do-dataset-summary' }">Summary</router-link>
            <router-link :to="{ name: 'do-dataset-data' }">Data</router-link>
          </NavigationTabs>
        </div>
        <router-view :key="$route.fullPath"></router-view>
        <GoUpButton></GoUpButton>
      </div>
    </transition>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import DatasetActionsBar from 'new-dashboard/components/Catalog/datasetDetail/DatasetActionsBar';
import DatasetHeader from 'new-dashboard/components/Catalog/datasetDetail/DatasetHeader';
import NavigationTabs from 'new-dashboard/components/Catalog/datasetDetail/NavigationTabs';
import GoUpButton from 'new-dashboard/components/Catalog/GoUpButton';

export default {
  name: 'DatasetDetail',
  components: {
    DatasetActionsBar,
    DatasetHeader,
    NavigationTabs,
    GoUpButton
  },
  data() {
    return {
      loading: false,
      id_interval: null
    };
  },
  computed: {
    ...mapState({
      dataset: state => state.catalog.dataset
    }),
    subscription() {
      return this.$store.getters['catalog/getSubscriptionByDataset'](
        this.dataset.id
      );
    },
    isGeography() {
      return this.$route.params.type === 'geography';
    },
    isSubscriptionSyncing() {
      return this.subscription && this.subscription.sync_status === 'syncing';
    }
  },
  methods: {},
  mounted() {
    if (!this.dataset || this.dataset.slug !== this.$route.params.datasetId) {
      this.loading = true;
      Promise.all([
        this.$store.dispatch('catalog/fetchSubscriptionsList'),
        this.$store.dispatch('catalog/fetchDataset', {
          id: this.$route.params.datasetId,
          type: this.$route.params.type
        })
      ]).then(() => {
        this.loading = false;
        this.$router.replace({
          params: { datasetId: this.dataset.slug }
        });
      });
    }
  },
  watch: {
    isSubscriptionSyncing: {
      immediate: true,
      handler() {
        clearInterval(this.id_interval);
        if (this.isSubscriptionSyncing) {
          this.id_interval = setInterval(() => {
            this.$store.dispatch('catalog/fetchSubscriptionsList');
          }, 5000);
        }
      }
    }
  },
  destroyed() {
    if (this.dataset.slug !== this.$route.params.datasetId) {
      this.$store.commit('catalog/resetDataset');
    }
    clearInterval(this.id_interval);
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/catalog/variables';

.navigation-header {
  padding: 24px 0;
  border-bottom: 1px solid $neutral--300;

  .back-link {
    display: flex;
  }
}

.loading {
  svg {
    width: 40px;
    stroke: $blue--500;
    g {
      stroke-width: 2px;
      circle {
        stroke-opacity: 0.25;
      }
    }
  }
}

.go-up-button {
  position: fixed;
  z-index: 1;
  right: 24px;
  bottom: 64px;
}
</style>
