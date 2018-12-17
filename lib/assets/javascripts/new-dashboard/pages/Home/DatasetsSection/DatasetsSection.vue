<template>
  <section class="datasets-section">
    <div class="container grid">
      <div class="full-width">
        <SectionTitle class="grid-cell" :title="title">
          <template slot="icon">
            <img src="../../../assets/icons/section-title/data.svg">
          </template>
          <template slot="dropdownButton">
            <SettingsDropdown
              section="datasets"
              :filter="appliedFilter"
              :order="appliedOrder"
              :orderDirection="appliedOrderDirection"
              :metadata="metadata"
              @filterChanged="applyFilter"
              @orderChanged="applyOrder">
              <img svg-inline src="../../../assets/icons/common/filter.svg">
            </SettingsDropdown>
          </template>
          <template slot="actionButton" v-if="!isInitialState">
            <CreateButton visualizationType="dataset">{{ $t(`DataPage.createDataset`) }}</CreateButton>
          </template>
        </SectionTitle>

        <InitialState :title="$t(`DataPage.zeroCase.title`)" v-if="isInitialState">
          <template slot="icon">
            <img svg-inline src="../../../assets/icons/datasets/initialState.svg">
          </template>
          <template slot="description">
            <p class="text is-caption is-txtGrey" v-html="$t(`DataPage.zeroCase.description`)"></p>
          </template>
          <template slot="actionButton">
            <CreateButton visualizationType="maps">{{ $t(`DataPage.zeroCase.createDataset`) }}</CreateButton>
          </template>
        </InitialState>

        <EmptyState v-if="isEmptyState" :text="$t('DataPage.emptyState')" >
          <img svg-inline src="../../../assets/icons/common/compass.svg">
        </EmptyState>

        <DatasetsList
          v-if="numResults"
          :isFetchingDatasets="isFetchingDatasets"
          :datasets="datasets"
          :appliedOrder="appliedOrder"
          :appliedOrderDirection="appliedOrderDirection"
          @applyOrder="applyOrder">
        </DatasetsList>

        <ul v-if="isFetchingDatasets" class="grid-cell--col12">
          <li v-for="n in 6" :key="n" class="dataset-item">
            <DatasetCardFake></DatasetCardfake>
          </li>
        </ul>

        <router-link :to="{ name: 'datasets' }" class="title is-small go-to-datasets">
          {{ $t('HomePage.DatasetsSection.viewAll') }}
        </router-link>
      </div>
    </div>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import InitialState from 'new-dashboard/components/States/InitialState';
import EmptyState from 'new-dashboard/components/States/EmptyState';
import CreateButton from 'new-dashboard/components/CreateButton';
import DatasetCardFake from 'new-dashboard/components/Dataset/DatasetCardFake';
import DatasetsList from './DatasetList';
import SettingsDropdown from 'new-dashboard/components/Settings/Settings';

export default {
  name: 'DatasetsSection',
  components: {
    CreateButton,
    DatasetCardFake,
    DatasetsList,
    EmptyState,
    InitialState,
    SectionTitle,
    SettingsDropdown
  },
  created: function () {
    this.$store.dispatch('datasets/setResultsPerPage', 6);
    this.fetchDatasets();
  },
  computed: {
    ...mapState({
      isFetchingDatasets: state => state.datasets.isFetching,
      datasets: state => state.datasets.list,
      metadata: state => state.datasets.metadata,
      numResults: state => state.datasets.metadata.total_entries,
      appliedFilter: state => state.datasets.filterType,
      appliedOrder: state => state.datasets.order,
      appliedOrderDirection: state => state.datasets.orderDirection,
      totalUserEntries: state => state.datasets.metadata.total_user_entries
    }),
    title () {
      return this.$t('HomePage.DatasetsSection.title');
    },
    isEmptyState () {
      return !this.isFetchingDatasets && !this.numResults && !this.hasFilterApplied('mine');
    },
    isInitialState () {
      return !this.isFetchingDatasets && this.hasFilterApplied('mine') && this.totalUserEntries <= 0;
    }
  },
  methods: {
    applyOrder (orderOptions) {
      this.$store.dispatch('datasets/orderDatasets', orderOptions);
    },
    applyFilter (filterType) {
      this.$store.dispatch('datasets/filterDatasets', filterType);
    },
    fetchDatasets () {
      this.$store.dispatch('datasets/fetchDatasets');
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
  .head-section,
  .empty-state {
    width: 100%;
  }
}

.go-to-datasets {
  display: block;
  padding-top: 64px;
  letter-spacing: 1px;
  text-align: center;
}

.full-width {
  width: 100%;
}
</style>
