<template>
  <div class="container grid">
    <div class="full-width">
      <SectionTitle class="grid-cell" :showActionButton="!selectedMaps.length" ref="headerContainer">
        <template slot="icon">
          <img src="../assets/icons/section-title/map.svg">
        </template>

        <template slot="title">
          <VisualizationsTitle
            :defaultTitle="$t(`MapsPage.header.title['${appliedFilter}']`)"
            :selectedItems="selectedMaps.length"/>
        </template>

        <template slot="warning">
          <NotificationBadge type="warning" v-if="shouldShowLimitsWarning">
            <div class="warning">
              <span v-if="isOutOfPublicMapsQuota && !isOutOfPrivateMapsQuota" class="is-bold" v-html="$t('MapsPage.header.warning.counter', { counter: `${publicMapsCount}/${publicMapsQuota}`, type: `public` })"></span>
              <span v-if="isOutOfPrivateMapsQuota && !isOutOfPublicMapsQuota" class="is-bold" v-html="$t('MapsPage.header.warning.counter', { counter: `${privateMapsCount}/${privateMapsQuota}`, type: `private` })"></span>
              <span v-if="isOutOfPublicMapsQuota && isOutOfPrivateMapsQuota" class="is-bold" v-html="$t('MapsPage.header.warning.doubleCounter', { publicCounter: `${publicMapsCount}/${publicMapsQuota}`, privateCounter: `${privateMapsCount}/${privateMapsQuota}`})"></span>
              <span v-html="$t('MapsPage.header.warning.upgrade', { path: upgradeUrl })"></span>
            </div>
          </NotificationBadge>
        </template>

        <template slot="dropdownButton">
          <MapBulkActions
            :selectedMaps="selectedMaps"
            :areAllMapsSelected="areAllMapsSelected"
            v-if="hasBulkActions && selectedMaps.length"
            @selectAll="selectAll"
            @deselectAll="deselectAll"></MapBulkActions>

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
        <template slot="actionButton" v-if="!isFirstTimeViewingDashboard && !selectedMaps.length">
          <!-- <CreateButton class="u-mr--8" visualizationType="maps" :disabled="!canCreateMaps">{{ $t(`MapsPage.createMap`) }}_old</CreateButton> -->
          <button @click="createMap" class="button is-primary" :disabled="!canCreateMaps">{{ $t(`MapsPage.createMap`) }}</button>
        </template>
      </SectionTitle>

      <div class="grid-cell" v-if="initialState">
        <CreateMapCard></CreateMapCard>
      </div>

      <slot name="navigation"></slot>

      <div
          v-if="shouldShowListHeader"
          class="grid-cell grid-cell--noMargin grid-cell--col12 grid__head--sticky"
          :class="{ 'has-user-notification': isNotificationVisible }">
        <CondensedMapHeader
          :order="appliedOrder"
          :orderDirection="appliedOrderDirection"
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
import { mapState, mapGetters } from 'vuex';
import CreateButton from 'new-dashboard/components/CreateButton.vue';
import CreateMapCard from 'new-dashboard/components/CreateMapCard';
import EmptyState from 'new-dashboard/components/States/EmptyState';
import InitialState from 'new-dashboard/components/States/InitialState';
import MapBulkActions from 'new-dashboard/components/BulkActions/MapBulkActions.vue';
import MapCard from 'new-dashboard/components/MapCard/MapCard.vue';
import CondensedMapHeader from 'new-dashboard/components/MapCard/CondensedMapHeader.vue';
import MapCardFake from 'new-dashboard/components/MapCard/fakes/MapCardFake';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import VisualizationsTitle from 'new-dashboard/components/VisualizationsTitle';
import NotificationBadge from 'new-dashboard/components/NotificationBadge';
import SettingsDropdown from 'new-dashboard/components/Settings/Settings';
import { shiftClick } from 'new-dashboard/utils/shift-click.service.js';

export default {
  name: 'MapsList',
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
    CreateButton,
    CreateMapCard,
    EmptyState,
    SettingsDropdown,
    MapBulkActions,
    MapCard,
    CondensedMapHeader,
    MapCardFake,
    SectionTitle,
    VisualizationsTitle,
    NotificationBadge,
    InitialState
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
      appliedFilter: state => state.maps.filterType,
      appliedOrder: state => state.maps.order,
      appliedOrderDirection: state => state.maps.orderDirection,
      maps: state => state.maps.list,
      mapsMetadata: state => state.maps.metadata,
      isFetchingMaps: state => state.maps.isFetching,
      currentEntriesCount: state => state.maps.metadata.total_entries,
      filterType: state => state.maps.filterType,
      totalUserEntries: state => state.maps.metadata.total_user_entries,
      totalShared: state => state.maps.metadata.total_shared,
      isFirstTimeViewingDashboard: state => state.config.isFirstTimeViewingDashboard,
      upgradeUrl: state => state.config.upgrade_url
    }),
    ...mapGetters({
      publicMapsQuota: 'user/publicMapsQuota',
      publicMapsCount: 'user/publicMapsCount',
      isOutOfPublicMapsQuota: 'user/isOutOfPublicMapsQuota',
      privateMapsQuota: 'user/privateMapsQuota',
      privateMapsCount: 'user/privateMapsCount',
      isOutOfPrivateMapsQuota: 'user/isOutOfPrivateMapsQuota',
      canCreateMaps: 'user/canCreateMaps'
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
      const route = this.$router.resolve({name: 'maps', params: { filter: 'shared' }});

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
    shouldShowLimitsWarning () {
      return this.isOutOfPublicMapsQuota || this.isOutOfPrivateMapsQuota;
    },
    shouldShowViewSwitcher () {
      return this.canChangeViewMode && !this.initialState && !this.emptyState && !this.selectedMaps.length;
    },
    shouldShowListHeader () {
      return this.isCondensed && !this.emptyState && !this.initialState;
    },
    isNotificationVisible () {
      return this.$store.getters['user/isNotificationVisible'];
    }
  },
  methods: {
    fetchMaps () {
      this.$store.dispatch('maps/fetch');
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
      this.selectedMaps = [...Object.values(this.$store.state.maps.list)];
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
    },
    createMap () {
      this.$emit('newMapClicked');
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
