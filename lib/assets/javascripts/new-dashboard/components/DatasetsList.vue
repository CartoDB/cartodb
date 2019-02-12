<template>
  <div class="container grid">
    <div class="full-width">
      <SectionTitle class="grid-cell" :title="pageTitle" :showActionButton="!selectedDatasets.length" ref="headerContainer">
        <template slot="icon">
          <img src="../assets/icons/section-title/data.svg" width="18" height="20" />
        </template>

        <template slot="dropdownButton">
          <DatasetBulkActions
            :selectedDatasets="selectedDatasets"
            :areAllDatasetsSelected="areAllDatasetsSelected"
            v-if="hasBulkActions && selectedDatasets.length"
            @selectAll="selectAll"
            @deselectAll="deselectAll"></DatasetBulkActions>

          <SettingsDropdown
            section="datasets"
            v-if="!selectedDatasets.length"
            :filter="appliedFilter"
            :order="appliedOrder"
            :orderDirection="appliedOrderDirection"
            :metadata="datasetsMetadata"
            @filterChanged="applyFilter">
            <img svg-inline src="../assets/icons/common/filter.svg">
          </SettingsDropdown>
        </template>

        <template slot="actionButton" v-if="!isFirstTimeViewingDashboard && !selectedDatasets.length">
          <CreateButton visualizationType="dataset">{{ $t(`DataPage.createDataset`) }}</CreateButton>
        </template>
      </SectionTitle>
    </div>

    <div class="grid-cell grid-cell--col12" v-if="initialState">
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

    <div class="grid-cell grid-cell--noMargin grid-cell--col12" v-if="shouldShowHeader">
      <DatasetListHeader :order="appliedOrder" :orderDirection="appliedOrderDirection" @changeOrder="applyOrder"></DatasetListHeader>
    </div>

    <ul class="grid-cell grid-cell--col12" v-if="!isFetchingDatasets && currentEntriesCount > 0">
      <li v-for="dataset in datasets" :key="dataset.id" class="dataset-item">
        <DatasetCard
        :dataset="dataset"
        :isSelected="isDatasetSelected(dataset)"
        :selectMode="isSomeDatasetSelected"
        :canHover="canHoverCard"
        @toggleSelection="toggleSelected">
      </DatasetCard>
      </li>
    </ul>

    <div class="grid-cell grid-cell--col12">
      <EmptyState
        :text="emptyStateText"
        v-if="emptyState">
        <img svg-inline src="../assets/icons/common/compass.svg">
      </EmptyState>
    </div>

    <ul v-if="isFetchingDatasets" class="grid-cell grid-cell--col12">
      <li v-for="n in 12" :key="n" class="dataset-item">
        <DatasetCardFake></DatasetCardfake>
      </li>
    </ul>

  </div>
</template>

<script>
import { mapState } from 'vuex';
import DatasetCard from '../components/Dataset/DatasetCard';
import DatasetListHeader from '../components/Dataset/DatasetListHeader';
import DatasetCardFake from '../components/Dataset/DatasetCardFake';
import SettingsDropdown from '../components/Settings/Settings';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import InitialState from 'new-dashboard/components/States/InitialState';
import EmptyState from 'new-dashboard/components/States/EmptyState';
import CreateButton from 'new-dashboard/components/CreateButton';
import DatasetBulkActions from 'new-dashboard/components/BulkActions/DatasetBulkActions.vue';
import { shiftClick } from 'new-dashboard/utils/shift-click.service.js';

export default {
  name: 'DatasetsList',
  props: {
    maxVisibleDatasets: {
      type: Number,
      default: 12
    },
    hasBulkActions: {
      type: Boolean,
      default: false
    },
    canHoverCard: {
      type: Boolean,
      default: false
    }
  },
  components: {
    CreateButton,
    SettingsDropdown,
    SectionTitle,
    DatasetCard,
    DatasetCardFake,
    InitialState,
    EmptyState,
    DatasetListHeader,
    DatasetBulkActions
  },
  data () {
    return {
      isScrollPastHeader: false,
      selectedDatasets: []
    };
  },
  created: function () {
    this.$store.dispatch('datasets/setResultsPerPage', this.maxVisibleDatasets);
    this.fetchDatasets();
  },
  computed: {
    ...mapState({
      appliedFilter: state => state.datasets.filterType,
      appliedOrder: state => state.datasets.order,
      appliedOrderDirection: state => state.datasets.orderDirection,
      datasets: state => state.datasets.list,
      datasetsMetadata: state => state.datasets.metadata,
      isFetchingDatasets: state => state.datasets.isFetching,
      filterType: state => state.datasets.filterType,
      currentEntriesCount: state => state.datasets.metadata.total_entries,
      totalUserEntries: state => state.datasets.metadata.total_user_entries,
      totalShared: state => state.datasets.metadata.total_shared,
      isFirstTimeViewingDashboard: state => state.config.isFirstTimeViewingDashboard
    }),
    pageTitle () {
      return this.$t(`DataPage.header.title['${this.appliedFilter}']`);
    },
    areAllDatasetsSelected () {
      return Object.keys(this.datasets).length === this.selectedDatasets.length;
    },
    shouldShowHeader () {
      return !this.emptyState && !this.initialState && !this.isFirstTimeViewingDashboard;
    },
    initialState () {
      return this.isFirstTimeViewingDashboard &&
        !this.hasSharedDatasets &&
        !this.isFetchingDatasets &&
        this.hasFilterApplied('mine') &&
        this.totalUserEntries <= 0;
    },
    emptyState () {
      return (!this.isFirstTimeViewingDashboard || this.hasSharedDatasets) &&
        !this.isFetchingDatasets &&
        !this.currentEntriesCount;
    },
    emptyStateText () {
      const route = this.$router.resolve({name: 'datasets', params: { filter: 'shared' }});
      return this.hasSharedDatasets ? this.$t('DataPage.emptyCase.onlyShared', { path: route.href }) : this.$t('DataPage.emptyCase.default', { path: route.href });
    },
    hasSharedDatasets () {
      return this.totalShared > 0;
    },
    isSomeDatasetSelected () {
      return this.selectedDatasets.length > 0;
    }
  },
  methods: {
    fetchDatasets () {
      this.$store.dispatch('datasets/fetch');
    },
    applyFilter (filter) {
      this.$emit('applyFilter', filter);
    },
    applyOrder (orderParams) {
      this.$emit('applyOrder', orderParams);
    },
    toggleSelected ({ dataset, isSelected, event }) {
      if (event.shiftKey) {
        this.doShiftClick(dataset);
        return;
      }

      if (isSelected) {
        this.selectedDatasets.push(dataset);
        return;
      }

      this.selectedDatasets = this.selectedDatasets.filter(selectedDataset => selectedDataset.id !== dataset.id);
    },
    doShiftClick (dataset) {
      const datasetsArray = [...Object.values(this.datasets)];
      this.selectedDatasets = shiftClick(datasetsArray, this.selectedDatasets, dataset);
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
    hasFilterApplied (filter) {
      return this.filterType === filter;
    },
    getHeaderContainer () {
      return this.$refs.headerContainer;
    }
  },
  watch: {
    selectedDatasets () {
      this.$emit('selectionChange', this.selectedDatasets);
    }
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.full-width {
  width: 100%;
}

.pagination-element {
  margin-top: 64px;
}

.dataset-item {
  &:not(:last-child) {
    border-bottom: 1px solid $light-grey;
  }
}

.empty-state {
  margin: 20vh 0 8vh;
}
</style>
