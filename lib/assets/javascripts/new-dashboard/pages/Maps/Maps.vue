<template>
<section class="page">
  <StickySubheader :is-visible="Boolean(selectedMaps.length && isScrollPastHeader)">
    <h2 class="title is-caption">
      {{ $t('BulkActions.selected', {count: selectedMaps.length}) }}
    </h2>
    <MapBulkActions
      :selectedMaps="selectedMaps"
      :areAllMapsSelected="areAllMapsSelected"
      @selectAll="selectAll"
      @deselectAll="deselectAll"></MapBulkActions>
  </StickySubheader>

  <div class="container grid">
    <div class="full-width">
      <SectionTitle class="grid-cell" :title='pageTitle' :showActionButton="!selectedMaps.length" ref="headerContainer">
        <template slot="icon">
          <img src="../../assets/icons/section-title/map.svg">
        </template>

        <template slot="dropdownButton">
          <MapBulkActions
            :selectedMaps="selectedMaps"
            :areAllMapsSelected="areAllMapsSelected"
            v-if="selectedMaps.length"
            @selectAll="selectAll"
            @deselectAll="deselectAll"></MapBulkActions>

          <SettingsDropdown
            section="maps"
            v-if="!selectedMaps.length"
            :filter="appliedFilter"
            :order="appliedOrder"
            :orderDirection="appliedOrderDirection"
            :metadata="mapsMetadata"
            @filterChanged="applyFilter"
            @orderChanged="applyOrder">
            <span v-if="initialState" class="title is-small is-txtPrimary">{{ $t('SettingsDropdown.initialState') }}</span>
            <img svg-inline v-else src="../../assets/icons/common/filter.svg">
          </SettingsDropdown>
        </template>
        <template slot="extraOptionButton" v-if="!initialState && !selectedMaps.length">
          <div class="mapcard-view-mode" @click="toggleViewMode">
            <img svg-inline src="../../assets/icons/common/compactMap.svg" v-if="!isCondensed">
            <img svg-inline src="../../assets/icons/common/standardMap.svg" v-if="isCondensed">
          </div>
        </template>
        <template slot="actionButton" v-if="!initialState && !selectedMaps.length">
          <CreateButton visualizationType="maps">{{ $t(`MapsPage.createMap`) }}</CreateButton>
        </template>
      </SectionTitle>

      <div class="grid-cell" v-if="initialState">
        <CreateMapCard></CreateMapCard>
      </div>

      <CondensedMapHeader
        :order="appliedOrder"
        :orderDirection="appliedOrderDirection"
        @orderChanged="applyOrder"
        v-if="isCondensed"></CondensedMapHeader>

      <ul class="grid" v-if="isFetchingMaps">
        <li :class="[isCondensed ? inlineCSSClasses : cardCSSClasses]" v-for="n in 12" :key="n">
          <MapCardFake :condensed="isCondensed"></MapCardFake>
        </li>
      </ul>

      <ul :class="[isCondensed ? 'grid grid-column' : 'grid']" v-if="!isFetchingMaps && numResults > 0">
        <li v-for="map in maps" :class="[isCondensed ? inlineCSSClasses : cardCSSClasses]" :key="map.id">
          <MapCard :condensed="isCondensed" :map="map" :isSelected="isMapSelected(map)" @toggleSelection="toggleSelected" :selectMode="isSomeMapSelected"></MapCard>
        </li>
      </ul>

      <EmptyState
        :text="$t('MapsPage.emptyState')"
        v-if="emptyState">
        <img svg-inline src="../../assets/icons/common/compass.svg">
      </EmptyState>

      <Pagination class="pagination-element" v-if="shouldShowPagination" :page=currentPage :numPages=numPages @pageChange="goToPage"></Pagination>
    </div>
  </div>
</section>
</template>

<script>
import { checkFilters } from 'new-dashboard/router/hooks/check-navigation';
import { mapState } from 'vuex';
import CreateButton from 'new-dashboard/components/CreateButton.vue';
import CreateMapCard from 'new-dashboard/components/CreateMapCard';
import EmptyState from 'new-dashboard/components/States/EmptyState';
import InitialState from 'new-dashboard/components/States/InitialState';
import MapBulkActions from 'new-dashboard/components/BulkActions/MapBulkActions.vue';
import MapCard from 'new-dashboard/components/MapCard/MapCard.vue';
import CondensedMapHeader from 'new-dashboard/components/MapCard/CondensedMapHeader.vue';
import MapCardFake from 'new-dashboard/components/MapCard/fakes/MapCardFake';
import Pagination from 'new-dashboard/components/Pagination';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import SettingsDropdown from 'new-dashboard/components/Settings/Settings';
import StickySubheader from 'new-dashboard/components/StickySubheader';

export default {
  name: 'MapsPage',
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
    StickySubheader,
    Pagination,
    InitialState
  },
  data () {
    return {
      isScrollPastHeader: false,
      selectedMaps: [],
      cardCSSClasses: 'grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile map-element',
      inlineCSSClasses: 'card-condensed',
      isCondensed: true
    };
  },
  mounted () {
    this.stickyScrollPosition = this.getHeaderBottomPageOffset();
    this.$onScrollChange = this.onScrollChange.bind(this);
    document.addEventListener('scroll', this.$onScrollChange, { passive: true });

    if (localStorage.hasOwnProperty('mapViewMode')) {
      if (localStorage.mapViewMode === 'compact') {
        this.isCondensed = true;
      } else if (localStorage.mapViewMode === 'standard') {
        this.isCondensed = false;
      }
    }
  },
  beforeDestroy () {
    document.removeEventListener('scroll', this.$onScrollChange, { passive: true });
  },
  beforeRouteUpdate (to, from, next) {
    checkFilters('maps', 'maps', to, from, next);
  },
  computed: {
    ...mapState({
      numPages: state => state.maps.numPages,
      currentPage: state => state.maps.page,
      appliedFilter: state => state.maps.filterType,
      appliedOrder: state => state.maps.order,
      appliedOrderDirection: state => state.maps.orderDirection,
      maps: state => state.maps.list,
      mapsMetadata: state => state.maps.metadata,
      isFetchingMaps: state => state.maps.isFetching,
      featuredFavoritedMaps: state => state.maps.featuredFavoritedMaps.list,
      isFetchingFeaturedFavoritedMaps: state => state.maps.featuredFavoritedMaps.isFetching,
      numResults: state => state.maps.metadata.total_entries,
      filterType: state => state.maps.filterType,
      totalUserEntries: state => state.maps.metadata.total_user_entries
    }),
    pageTitle () {
      return this.$t(`MapsPage.header.title['${this.appliedFilter}']`);
    },
    areAllMapsSelected () {
      return Object.keys(this.maps).length === this.selectedMaps.length;
    },
    initialState () {
      return !this.isFetchingMaps && this.hasFilterApplied('mine') && this.totalUserEntries <= 0;
    },
    emptyState () {
      return !this.isFetchingMaps && !this.numResults && (!this.hasFilterApplied('mine') || this.totalUserEntries > 0);
    },
    shouldShowPagination () {
      return !this.isFetchingMaps && this.numResults > 0 && this.numPages > 1;
    },
    isSomeMapSelected () {
      return this.selectedMaps.length > 0;
    }
  },
  methods: {
    goToPage (page) {
      window.scroll({ top: 0, left: 0 });

      this.deselectAll();
      this.$router.push({
        name: 'maps',
        params: this.$route.params,
        query: { ...this.$route.query, page }
      });
    },
    resetFilters () {
      this.$router.push({ name: 'maps' });
    },
    applyFilter (filter) {
      this.$router.push({ name: 'maps', params: { filter } });
    },
    applyOrder (orderParams) {
      this.$router.push({
        name: 'maps',
        params: this.$route.params,
        query: {
          ...this.$route.query,
          order: orderParams.order,
          order_direction: orderParams.direction
        }
      });
    },
    toggleSelected ({ map, isSelected }) {
      if (isSelected) {
        this.selectedMaps.push(map);
        return;
      }

      this.selectedMaps = this.selectedMaps.filter(selectedMap => selectedMap.id !== map.id);
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
    onScrollChange () {
      this.isScrollPastHeader = window.pageYOffset > this.stickyScrollPosition;
    },
    getHeaderBottomPageOffset () {
      const headerClientRect = this.$refs.headerContainer.$el.getBoundingClientRect();
      return headerClientRect.top;
    },
    hasFilterApplied (filter) {
      return this.filterType === filter;
    },
    toggleViewMode () {
      this.isCondensed = !this.isCondensed;
    }
  },
  watch: {
    isCondensed (isCompactMapView) {
      if (isCompactMapView) {
        localStorage.mapViewMode = 'compact';
      } else {
        localStorage.mapViewMode = 'standard';
      }
    }
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.map-element {
  margin-bottom: 36px;
}

.full-width {
  width: 100%;
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
  width: 24px;
  height: 24px;
  cursor: pointer;
}
</style>
