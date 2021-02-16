<template>
  <div class="container grid">
    <div class="full-width">
      <SectionTitle class="grid-cell" :showActionButton="!selectedDatasets.length" ref="headerContainer">
        <template slot="icon">
          <img src="../assets/icons/section-title/data.svg" width="18" height="20" />
        </template>

        <template slot="title">
          <VisualizationsTitle
            :defaultTitle="$t(`DataPage.header.title['${appliedFilter}']`)"
            :selectedItems="selectedDatasets.length"/>
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

        <template slot="actionButton" v-if="showCreateButton">
          <!-- <CreateButton class="u-mr--8" visualizationType="dataset" :disabled="!canCreateDatasets">
            {{ $t(`DataPage.createDataset`) }}_old
          </CreateButton> -->
          <button @click="createDataset" class="button is-primary" :disabled="!canCreateDatasets">{{ $t(`DataPage.createDataset`) }}</button>
        </template>

        <template v-if="shouldShowLimitsWarning" slot="warning">
          <NotificationBadge type="warning" :has-margin='false'>
            <div class="warning" v-html="$t('DataPage.header.warning', { counter: `${datasetsCount}/${datasetsQuota}`, path: upgradeUrl })"></div>
          </NotificationBadge>
        </template>

      </SectionTitle>
    </div>

    <div class="grid-cell grid-cell--col12" v-if="initialState">
      <InitialState :title="$t(`DataPage.zeroCaseDatasets.title`)">
        <template slot="icon">
          <img svg-inline src="../assets/icons/datasets/initialState.svg">
        </template>
        <template slot="description">
          <p class="text is-caption is-txtGrey" v-html="$t(`DataPage.zeroCaseDatasets.description`)"></p>
        </template>
        <template slot="actionButton">
           <button @click="createDataset" class="button is-primary" :disabled="!canCreateDatasets">{{ $t(`DataPage.zeroCaseDatasets.createDataset`) }}</button>
        </template>
      </InitialState>
    </div>

    <div
        v-if="shouldShowHeader"
        class="grid-cell grid-cell--noMargin grid-cell--col12 grid__head--sticky"
        :class="{
          'has-user-notification': isNotificationVisible,
          'in-home': isInHomePage,
          'no-secondary-navbar': !hasSecondaryNavbar
        }">

      <DatasetListHeader :order="appliedOrder" :orderDirection="appliedOrderDirection" @changeOrder="applyOrder"></DatasetListHeader>
    </div>

    <ul class="grid-cell grid-cell--col12" v-if="!isFetchingDatasets && currentEntriesCount > 0">
      <li v-for="dataset in datasets" :key="dataset.id" class="dataset-item">
        <DatasetCard
        :dataset="dataset"
        :isSelected="isDatasetSelected(dataset)"
        :selectMode="isSomeDatasetSelected"
        :canHover="canHoverCard"
        @toggleSelection="toggleSelected"
        @contentChanged="onContentChanged">
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
      <li v-for="n in maxVisibleDatasets" :key="n" class="dataset-item">
        <DatasetCardFake></DatasetCardFake>
      </li>
    </ul>

  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import DatasetCard from '../components/Dataset/DatasetCard';
import DatasetListHeader from '../components/Dataset/DatasetListHeader';
import DatasetCardFake from '../components/Dataset/DatasetCardFake';
import SettingsDropdown from '../components/Settings/Settings';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import VisualizationsTitle from 'new-dashboard/components/VisualizationsTitle';
import NotificationBadge from 'new-dashboard/components/NotificationBadge';
import InitialState from 'new-dashboard/components/States/InitialState';
import EmptyState from 'new-dashboard/components/States/EmptyState';
import DatasetBulkActions from 'new-dashboard/components/BulkActions/DatasetBulkActions.vue';
import { shiftClick } from 'new-dashboard/utils/shift-click.service.js';
import * as accounts from 'new-dashboard/core/constants/accounts';

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
    SettingsDropdown,
    SectionTitle,
    VisualizationsTitle,
    NotificationBadge,
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
      selectedDatasets: [],
      lastCheckedItem: null
    };
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
      isFirstTimeViewingDashboard: state => state.config.isFirstTimeViewingDashboard,
      upgradeUrl: state => state.config.upgrade_url,
      planAccountType: state => state.user.account_type,
      isLoadingConnections: state => state.connectors.loadingConnections,
      connections: state => state.connectors.connections
    }),
    ...mapGetters({
      datasetsCount: 'user/datasetsCount',
      datasetsQuota: 'user/datasetsQuota',
      isOutOfDatasetsQuota: 'user/isOutOfDatasetsQuota'
    }),
    canCreateDatasets () {
      return this.$store.getters['user/canCreateDatasets'];
    },
    areAllDatasetsSelected () {
      return Object.keys(this.datasets).length === this.selectedDatasets.length;
    },
    shouldShowHeader () {
      return !this.emptyState && !this.initialState;
    },
    showCreateButton () {
      return (this.totalUserEntries || !this.isFirstTimeViewingDashboard) && !this.selectedDatasets.length;
    },
    initialState () {
      return this.isFirstTimeViewingDashboard &&
        !this.hasSharedDatasets &&
        !this.isFetchingDatasets &&
        this.hasFilterApplied('mine') &&
        (!this.totalUserEntries || this.totalUserEntries <= 0);
    },
    emptyState () {
      return ((!this.isFirstTimeViewingDashboard || this.hasSharedDatasets) || this.isFirstTimeViewerAfterAction) &&
        !this.isFetchingDatasets &&
        !this.currentEntriesCount;
    },
    emptyStateText () {
      const route = this.$router.resolve({name: 'datasets', params: { filter: 'shared' }});
      return this.hasSharedDatasets ? this.$t('DataPage.emptyCase.onlyShared', { path: route.href }) : this.$t('DataPage.emptyCase.default', { path: route.href });
    },
    isFirstTimeViewerAfterAction () {
      // First time viewing dashboard but user has performed any action such as drag and dropping a dataset (no page refreshing)
      return this.isFirstTimeViewingDashboard && this.currentEntriesCount <= 0 && !this.hasFilterApplied('mine');
    },
    hasSharedDatasets () {
      return this.totalShared > 0;
    },
    isSomeDatasetSelected () {
      return this.selectedDatasets.length > 0;
    },
    shouldShowLimitsWarning () {
      return this.isOutOfDatasetsQuota;
    },
    isNotificationVisible () {
      return this.$store.getters['user/isNotificationVisible'];
    },
    isInHomePage () {
      return this.$router.currentRoute.name === 'home';
    },
    hasSecondaryNavbar () {
      return !accounts.accountsWithDataCatalogLimits.includes(this.planAccountType);
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
      if (this.selectedDatasets.length && event.shiftKey) {
        this.doShiftClick(dataset);
        return;
      }

      if (isSelected) {
        this.lastCheckedItem = dataset;
        this.selectedDatasets.push(dataset);
        return;
      }

      this.selectedDatasets = this.selectedDatasets.filter(selectedDataset => selectedDataset.id !== dataset.id);
    },
    doShiftClick (dataset) {
      const datasetsArray = [...Object.values(this.datasets)];
      this.selectedDatasets = shiftClick(datasetsArray, this.selectedDatasets, dataset, this.lastCheckedItem || dataset);
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
    },
    onContentChanged (type) {
      this.$emit('contentChanged', type);
    },
    createDataset () {
      this.$emit('newDatesetClicked');
    }
  },
  watch: {
    selectedDatasets () {
      this.$emit('selectionChange', this.selectedDatasets);
    },
    totalUserEntries () {
      this.$store.dispatch('user/updateTableCount', this.totalUserEntries);
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.full-width {
  width: 100%;
}

.grid__head--sticky {
  top: $header__height + $subheader__height;

  &.in-home,
  &.no-secondary-navbar {
    top: $header__height;
  }

  &.has-user-notification {
    top: $header__height + $subheader__height + $notification-warning__height;

    &.in-home,
    &.no-secondary-navbar {
      top: $header__height + $notification-warning__height;
    }
  }
}

.pagination-element {
  margin-top: 64px;
}

.dataset-item {
  &:not(:last-child) {
    border-bottom: 1px solid $border-color;
  }
}

.empty-state {
  margin: 20vh 0 8vh;
}

.warning {
  white-space: nowrap;
}
</style>
