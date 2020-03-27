<template>
  <div class="container grid">
    <div class="full-width">
      <SectionTitle class="grid-cell" :showActionButton="!selectedMaps.length" ref="headerContainer">
        <template slot="icon">
          <img src="../assets/icons/section-title/map.svg">
        </template>

        <template slot="title">
          <VisualizationsTitle
            :defaultTitle="$t(`ExternalMapsPage.header.title['${appliedFilter}']`)"
            :selectedItems="selectedMaps.length" />
        </template>

        <template slot="dropdownButton">
          <ExternalMapBulkActions
            :selectedMaps="selectedMaps"
            :areAllMapsSelected="areAllMapsSelected"
            v-if="hasBulkActions && selectedMaps.length"
            @selectAll="selectAll"
            @deselectAll="deselectAll"></ExternalMapBulkActions>

          <SettingsDropdown
            section="maps"
            v-if="!selectedMaps.length"
            :filter="appliedFilter"
            :order="appliedOrder"
            :orderDirection="appliedOrderDirection"
            :metadata="mapsMetadata"
            @filterChanged="applyFilter">
            <img svg-inline src="../assets/icons/common/filter.svg">
          </SettingsDropdown>

          <div class="mapcard-view-mode" @click="toggleViewMode" v-if="shouldShowViewSwitcher">
            <img svg-inline src="../assets/icons/common/compactMap.svg" v-if="!isCondensed">
            <img svg-inline src="../assets/icons/common/standardMap.svg" v-if="isCondensed">
          </div>
        </template>
      </SectionTitle>

      <slot name="navigation"></slot>

      <div
          v-if="shouldShowListHeader"
          class="grid-cell grid-cell--noMargin grid-cell--col12 grid__head--sticky"
          :class="{ 'has-user-notification': isNotificationVisible }">
        <CondensedMapHeader
          :order="appliedOrder"
          :orderDirection="appliedOrderDirection"
          :showViews="false"
          @orderChanged="applyOrder"
          v-if="shouldShowListHeader">
        </CondensedMapHeader>
      </div>

      <ul :class="[isCondensed ? 'grid grid-cell' : 'grid']" v-if="isFetchingMaps">
        <li :class="[isCondensed ? condensedCSSClasses : cardCSSClasses]" v-for="n in maxVisibleMaps" :key="n">
          <MapCardFake :condensed="isCondensed"></MapCardFake>
        </li>
      </ul>

      <ul :class="[isCondensed ? 'grid grid-column grid-cell' : 'grid']" v-if="!isFetchingMaps && currentEntriesCount > 0">
        <li v-for="map in maps" :class="[isCondensed ? condensedCSSClasses : cardCSSClasses]" :key="map.id">
          <MapCard
            :condensed="isCondensed"
            :visualization="map"
            :isSelected="isMapSelected(map)"
            :selectMode="isSomeMapSelected"
            :canHover="canHoverCard"
            @toggleSelection="toggleSelected"
            @contentChanged="onContentChanged">
          </MapCard>
        </li>
      </ul>

      <EmptyState
        :text="emptyStateText"
        v-if="emptyState">
        <img svg-inline src="../assets/icons/common/compass.svg">
      </EmptyState>

    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import CreateMapCard from 'new-dashboard/components/CreateMapCard';
import EmptyState from 'new-dashboard/components/States/EmptyState';
import ExternalMapBulkActions from 'new-dashboard/components/BulkActions/ExternalMapBulkActions.vue';
import MapCard from 'new-dashboard/components/MapCard/MapCard.vue';
import CondensedMapHeader from 'new-dashboard/components/MapCard/CondensedMapHeader.vue';
import MapCardFake from 'new-dashboard/components/MapCard/fakes/MapCardFake';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import VisualizationsTitle from 'new-dashboard/components/VisualizationsTitle';
import NotificationBadge from 'new-dashboard/components/NotificationBadge';
import SettingsDropdown from 'new-dashboard/components/SettingsExternal/Settings';
import { shiftClick } from 'new-dashboard/utils/shift-click.service.js';

export default {
  name: 'ExternalMapsList',
  props: {
    maxVisibleMaps: {
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
    },
    canChangeViewMode: {
      type: Boolean,
      default: false
    },
    isCondensedDefault: {
      type: Boolean,
      default: true
    }
  },
  components: {
    CreateMapCard,
    EmptyState,
    SettingsDropdown,
    ExternalMapBulkActions,
    MapCard,
    CondensedMapHeader,
    MapCardFake,
    SectionTitle,
    VisualizationsTitle,
    NotificationBadge
  },
  data () {
    return {
      selectedMaps: [],
      cardCSSClasses: 'grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile map-element',
      condensedCSSClasses: 'card-condensed',
      isCondensed: this.isCondensedDefault,
      lastCheckedItem: null
    };
  },
  computed: {
    ...mapState({
      appliedFilter: state => state.externalMaps.filterType,
      appliedOrder: state => state.externalMaps.order,
      appliedOrderDirection: state => state.externalMaps.orderDirection,
      maps: state => state.externalMaps.list,
      mapsMetadata: state => state.externalMaps.metadata,
      isFetchingMaps: state => state.externalMaps.isFetching,
      currentEntriesCount: state => state.externalMaps.metadata.total_entries,
      filterType: state => state.externalMaps.filterType,
      totalUserEntries: state => state.externalMaps.metadata.total_user_entries,
      totalShared: state => state.externalMaps.metadata.total_shared,
      isFirstTimeViewingDashboard: state => state.config.isFirstTimeViewingDashboard,
      upgradeUrl: state => state.config.upgrade_url
    }),
    areAllMapsSelected () {
      return Object.keys(this.maps).length === this.selectedMaps.length;
    },
    initialState () {
      return this.isFirstTimeViewingDashboard &&
        !this.hasSharedMaps &&
        !this.isFetchingMaps &&
        this.hasFilterApplied('mine') &&
        this.totalUserEntries <= 0;
    },
    emptyState () {
      return ((!this.isFirstTimeViewingDashboard || this.hasSharedMaps) || this.isFirstTimeViewerAfterAction) &&
        !this.isFetchingMaps &&
        !this.currentEntriesCount;
    },
    emptyStateText () {
      const route = this.$router.resolve({ name: 'external_filtered', params: { filter: 'shared' } });

      return this.hasSharedMaps
        ? this.$t('MapsPage.emptyCase.onlyShared', { path: route.href })
        : this.$t('MapsPage.emptyCase.default', { path: route.href });
    },
    isFirstTimeViewerAfterAction () {
      // First time viewing dashboard but user has performed any action such as drag and dropping a dataset (no page refreshing)
      return this.isFirstTimeViewingDashboard && this.currentEntriesCount <= 0 && !this.hasFilterApplied('mine');
    },
    hasSharedMaps () {
      return this.totalShared > 0;
    },
    isSomeMapSelected () {
      return this.selectedMaps.length > 0;
    },
    shouldShowViewSwitcher () {
      return this.canChangeViewMode && !this.initialState && !this.emptyState && !this.selectedMaps.length;
    },
    shouldShowListHeader () {
      return this.isCondensed && !this.emptyState && !this.initialState;
    },
    isViewer () {
      return this.$store.getters['user/isViewer'];
    },
    isNotificationVisible () {
      return this.$store.getters['user/isNotificationVisible'];
    }
  },
  methods: {
    fetchMaps () {
      this.$store.dispatch('externalMaps/fetch');
    },
    applyFilter (filter) {
      this.$emit('applyFilter', filter);
    },
    applyOrder (orderParams) {
      this.$emit('applyOrder', orderParams);
    },
    toggleSelected ({ map, isSelected, event }) {
      if (this.selectedMaps.length && event.shiftKey) {
        this.doShiftClick(map);
        return;
      }

      if (isSelected) {
        this.lastCheckedItem = map;
        this.selectedMaps.push(map);
        return;
      }

      this.selectedMaps = this.selectedMaps.filter(selectedMap => selectedMap.id !== map.id);
    },
    doShiftClick (map) {
      const mapsArray = [...Object.values(this.maps)];
      this.selectedMaps = shiftClick(mapsArray, this.selectedMaps, map, this.lastCheckedItem || map);
    },
    selectAll () {
      this.selectedMaps = [...Object.values(this.$store.state.externalMaps.list)];
    },
    deselectAll () {
      this.selectedMaps = [];
    },
    isMapSelected (map) {
      return this.selectedMaps.some(selectedMap => selectedMap.id === map.id);
    },
    hasFilterApplied (filter) {
      return this.filterType === filter;
    },
    toggleViewMode () {
      this.isCondensed = !this.isCondensed;
    },
    getHeaderContainer () {
      return this.$refs.headerContainer;
    },
    onContentChanged (type) {
      this.$emit('contentChanged', type);
    }
  },
  watch: {
    isCondensed (isCompactMapView) {
      if (isCompactMapView) {
        localStorage.mapViewMode = 'compact';
      } else {
        localStorage.mapViewMode = 'standard';
      }
    },
    selectedMaps () {
      this.$emit('selectionChange', this.selectedMaps);
    },
    maps () {
      this.deselectAll();
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.map-element {
  margin-bottom: 36px;
}

.full-width {
  width: 100%;
}

.grid__head--sticky {
  top: $header__height;
}

.grid__head--sticky.has-user-notification {
  top: $header__height + $notification-warning__height;
}

.pagination-element {
  margin-top: 28px;
}

.empty-state {
  margin: 20vh 0 8vh;
}

.grid-column {
  flex-direction: column;
}

.card-condensed {
  width: 100%;
  border-bottom: 1px solid #EBEEF5;

  &:last-child {
    border-bottom: 0;
  }
}

.mapcard-view-mode {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 36px;
  margin-left: 24px;
  padding: 9px;
  cursor: pointer;

  &:hover,
  &:focus {
    background-color: $softblue;
  }

  &:active {
    background-color: $primary-color;

    .svgicon {
      fill: $white;
    }
  }
}

.warning {
  white-space: nowrap;
}
</style>
