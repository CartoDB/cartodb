<template>
  <section class="datasets-section">
    <DatasetsList
      :hasBulkActions="false"
      :canHoverCard="false"
      :maxVisibleDatasets="maxVisibleDatasets"
      :isInitialOrEmpty="showViewAllLink"
      @applyFilter="applyFilter"
      @applyOrder="applyOrder"/>

    <router-link :to="{ name: 'datasets' }" class="title is-small viewall-link" v-if="showViewAllLink">{{ datasetsLinkText }}</router-link>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import DatasetsList from 'new-dashboard/components/DatasetsList.vue';

export default {
  name: 'DatasetsSection',
  components: {
    DatasetsList
  },
  data () {
    return {
      maxVisibleDatasets: 6
    };
  },
  computed: {
    ...mapState({
      isFetchingDatasets: state => state.datasets.isFetching,
      numResults: state => state.datasets.metadata.total_entries,
      appliedFilter: state => state.datasets.filterType,
      appliedOrder: state => state.datasets.order,
      totalUserEntries: state => state.datasets.metadata.total_user_entries,
      isFirst: state => state.config.isFirstTimeViewingDashboard
    }),
    datasetsLinkText () {
      return this.$t('HomePage.DatasetsSection.viewAll');
    },
    isEmptyState () {
      return !this.isFetchingDatasets && !this.numResults && (!this.hasFilterApplied('mine') || this.totalUserEntries > 0);
    },
    isInitialState () {
      return !this.isFetchingDatasets && this.hasFilterApplied('mine') && this.totalUserEntries <= 0;
    },
    showViewAllLink () {
      return !(this.initialState || this.emptyState || this.isFirst);
    }
  },
  methods: {
    applyOrder (orderOptions) {
      this.$store.dispatch('datasets/order', orderOptions);
      this.$store.dispatch('datasets/fetch');
    },
    applyFilter (filter) {
      this.$store.dispatch('datasets/filter', filter);
      this.$store.dispatch('datasets/fetch');
    },
    fetchDatasets () {
      this.$store.dispatch('datasets/fetch');
    },
    hasFilterApplied (filter) {
      return this.appliedFilter === filter;
    }
  }
};
</script>

<style scoped lang="scss">
@import "stylesheets/new-dashboard/variables";

.datasets-section {
  .full-width {
    width: 100%;
  }
}

.viewall-link {
  display: block;
  margin-top: 64px;
  letter-spacing: 1px;
  text-align: center;
  text-transform: uppercase;
}

.full-width {
  width: 100%;
}
</style>
