<template>
  <section class="section page page--sticky-header">
    <StickySubheader :is-visible="Boolean(selectedDatasets.length && isScrollPastHeader)">
      <h2 class="title is-caption">
        {{ $t('BulkActions.selected', {count: selectedDatasets.length}) }}
      </h2>
      <DatasetBulkActions
        :selectedDatasets="selectedDatasets"
        :areAllDatasetsSelected="areAllDatasetsSelected"
        @selectAll="selectAll"
        @deselectAll="deselectAll"></DatasetBulkActions>
    </StickySubheader>

    <div class="container grid">
      <div class="grid-cell grid-cell--col12">
        <SectionTitle :title="pageTitle" :showActionButton="!selectedDatasets.length" ref="headerContainer">
          <template slot="icon">
            <img src="../assets/icons/section-title/data.svg" />
          </template>

          <template slot="dropdownButton">
            <DatasetBulkActions
              :selectedDatasets="selectedDatasets"
              :areAllDatasetsSelected="areAllDatasetsSelected"
              v-if="selectedDatasets.length"
              @selectAll="selectAll"
              @deselectAll="deselectAll"></DatasetBulkActions>

            <FilterDropdown
              section="datasets"
              v-if="!selectedDatasets.length"
              :filter="appliedFilter"
              :order="appliedOrder"
              :metadata="datasetsMetadata"
              @filterChanged="applyFilter">
              <span v-if="initialState" class="title is-small is-txtPrimary">{{ $t('FilterDropdown.initialState') }}</span>
              <img svg-inline v-else src="../assets/icons/common/filter.svg">
            </FilterDropdown>
          </template>

          <template slot="actionButton" v-if="!initialState && !selectedDatasets.length">
            <CreateButton visualizationType="dataset">{{ $t(`DataPage.createDataset`) }}</CreateButton>
          </template>
        </SectionTitle>
      </div>

      <div class="grid-cell" v-if="initialState">
        <InitialState :title="$t(`DataPage.zeroCase.title`)">
          <template slot="icon">
            <img svg-inline src="../assets/icons/datasets/initialState.svg">
          </template>
          <template slot="description">
            <p class="text is-caption is-txtGrey" v-html="$t(`DataPage.zeroCase.description`)"></p>
          </template>
          <template slot="actionButton">
            <CreateButton visualizationType="dataset">{{ $t(`DataPage.zeroCase.createDataset`) }}</CreateButton>
          </template>
        </InitialState>
      </div>

      <div class="grid-cell grid-cell--noMargin grid-cell--col12" v-if="!emptyState">
        <DatasetListHeader></DatasetListHeader>
      </div>

      <ul class="grid-cell grid-cell--col12" v-if="!isFetchingDatasets && numResults > 0">
        <li v-for="dataset in datasets" :key="dataset.id">
          <DatasetCard :dataset="dataset" :isSelected="isDatasetSelected(dataset)" @toggleSelection="toggleSelected"></DatasetCard>
        </li>
      </ul>

      <div class="grid-cell grid-cell--col12">
        <EmptyState
          :text="$t('DataPage.emptyState')"
          v-if="emptyState">
          <img svg-inline src="../assets/icons/datasets/emptyState.svg">
        </EmptyState>
      </div>

      <ul v-if="isFetchingDatasets" class="grid-cell grid-cell--col12">
        <li v-for="n in 12" :key="n">
          <DatasetCardFake></DatasetCardfake>
        </li>
      </ul>

    </div>
    <Pagination v-if="!isFetchingDatasets && numResults > 0" :page=currentPage :numPages=numPages @pageChange="goToPage"></Pagination>
  </section>
</template>

<script>
import DatasetCard from '../components/Dataset/DatasetCard';
import DatasetListHeader from '../components/Dataset/DatasetListHeader';
import DatasetCardFake from '../components/Dataset/DatasetCardFake';
import { mapState } from 'vuex';
import FilterDropdown from '../components/FilterDropdown';
import Pagination from 'new-dashboard/components/Pagination';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import InitialState from 'new-dashboard/components/States/InitialState';
import EmptyState from 'new-dashboard/components/States/EmptyState';
import CreateButton from 'new-dashboard/components/CreateButton';
import DatasetBulkActions from 'new-dashboard/components/BulkActions/DatasetBulkActions.vue';
import StickySubheader from '../components/StickySubheader';
import { isAllowed } from '../core/filters';

export default {
  name: 'DataPage',
  components: {
    CreateButton,
    FilterDropdown,
    SectionTitle,
    Pagination,
    DatasetCard,
    DatasetCardFake,
    InitialState,
    EmptyState,
    DatasetListHeader,
    DatasetBulkActions,
    StickySubheader
  },
  data () {
    return {
      isScrollPastHeader: false,
      selectedDatasets: []
    };
  },
  mounted () {
    this.stickyScrollPosition = this.getHeaderBottomPageOffset();
    this.$onScrollChange = this.onScrollChange.bind(this);
    document.addEventListener('scroll', this.$onScrollChange, { passive: true });
  },
  beforeDestroy () {
    document.removeEventListener('scroll', this.$onScrollChange, { passive: true });
  },
  beforeRouteUpdate (to, from, next) {
    const urlOptions = { ...to.params, ...to.query };

    if (urlOptions.filter && !isAllowed(urlOptions.filter)) {
      return next({ name: 'datasets' });
    }

    this.$store.dispatch('datasets/setURLOptions', urlOptions);
    next();
  },
  computed: {
    ...mapState({
      numPages: state => state.datasets.numPages,
      currentPage: state => state.datasets.page,
      appliedFilter: state => state.datasets.filterType,
      appliedOrder: state => state.datasets.order,
      datasets: state => state.datasets.list,
      datasetsMetadata: state => state.datasets.metadata,
      isFetchingDatasets: state => state.datasets.isFetching,
      numResults: state => state.datasets.metadata.total_entries,
      filterType: state => state.datasets.filterType,
      totalUserEntries: state => state.datasets.metadata.total_user_entries
    }),
    pageTitle () {
      return this.$t(`DataPage.header.title['${this.appliedFilter}']`);
    },
    areAllDatasetsSelected () {
      return Object.keys(this.datasets).length === this.selectedDatasets.length;
    },
    initialState () {
      return !this.isFetchingDatasets && this.hasFilterApplied('mine') && this.totalUserEntries <= 0;
    },
    emptyState () {
      return !this.isFetchingDatasets && !this.numResults && !this.hasFilterApplied('mine');
    }
  },
  methods: {
    goToPage (page) {
      this.deselectAll();
      window.scroll({ top: 0, left: 0 });
      this.$router.push({
        name: 'datasets',
        params: this.$route.params,
        query: {...this.$route.query, page}
      });
    },
    applyFilter (filter) {
      this.$router.push({ name: 'datasets', params: { filter } });
    },
    hasFilterApplied (filter) {
      return this.filterType === filter;
    },
    toggleSelected ({ dataset, isSelected }) {
      if (isSelected) {
        this.selectedDatasets.push(dataset);
        return;
      }

      this.selectedDatasets = this.selectedDatasets.filter(selectedDataset => selectedDataset.id !== dataset.id);
    },
    selectAll () {
      this.selectedDatasets = [...Object.values(this.$store.state.datasets.list)];
    },
    deselectAll () {
      this.selectedDatasets = [];
    },
    isDatasetSelected (dataset) {
      return this.selectedDatasets.some(selectedDataset => selectedDataset.id === dataset.id);
    },
    onScrollChange () {
      this.isScrollPastHeader = window.pageYOffset > this.stickyScrollPosition;
    },
    getHeaderBottomPageOffset () {
      const headerClientRect = this.$refs.headerContainer.$el.getBoundingClientRect();
      return headerClientRect.top;
    }
  }
};
</script>
