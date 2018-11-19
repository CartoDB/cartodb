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

  <div class="maps-list-container container grid">
    <div class="full-width">
      <SectionTitle class="grid-cell" :title='pageTitle' :showActionButton="!selectedMaps.length" ref="headerContainer">
        <template slot="icon">
          <img src="../assets/icons/section-title/map.svg">
        </template>

        <template slot="dropdownButton">
          <MapBulkActions
            :selectedMaps="selectedMaps"
            :areAllMapsSelected="areAllMapsSelected"
            v-if="selectedMaps.length"
            @selectAll="selectAll"
            @deselectAll="deselectAll"></MapBulkActions>

          <FilterDropdown
            section="maps"
            v-if="!selectedMaps.length"
            :filter="appliedFilter"
            :order="appliedOrder"
            :orderDirection="appliedOrderDirection"
            :metadata="mapsMetadata"
            @filterChanged="applyFilter"
            @orderChanged="applyOrder">
            <span v-if="initialState" class="title is-small is-txtPrimary">{{ $t('FilterDropdown.initialState') }}</span>
            <img svg-inline v-else src="../assets/icons/common/filter.svg">
          </FilterDropdown>
        </template>
        <template slot="actionButton" v-if="!initialState && !selectedMaps.length">
          <CreateButton visualizationType="maps">New map</CreateButton>
        </template>
      </SectionTitle>

      <div class="grid-cell" v-if="initialState">
        <InitialState :title="$t(`MapsPage.zeroCase.title`)">
          <template slot="icon">
            <img svg-inline src="../assets/icons/maps/initialState.svg">
          </template>
          <template slot="description">
            <p class="text is-caption is-txtGrey" v-html="$t(`MapsPage.zeroCase.description`)"></p>
          </template>
          <template slot="actionButton">
            <CreateButton visualizationType="maps">{{ $t(`MapsPage.zeroCase.createMap`) }}</CreateButton>
          </template>
        </InitialState>
      </div>

      <ul class="grid" v-if="isFetchingMaps">
        <li class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile map-element" v-for="n in 12" :key="n">
          <MapCardFake></MapCardFake>
        </li>
      </ul>

      <ul class="grid" v-if="!isFetchingMaps && numResults > 0">
        <li v-for="map in maps" class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile map-element" :key="map.id">
          <MapCard :map=map :isSelected="isMapSelected(map)" @toggleSelection="toggleSelected"></MapCard>
        </li>
      </ul>

      <EmptyState
        :text="$t('MapsPage.emptyState')"
        v-if="emptyState">
        <img svg-inline src="../assets/icons/maps/compass.svg">
      </EmptyState>

      <Pagination class="pagination-element" v-if="shouldShowPagination" :page=currentPage :numPages=numPages @pageChange="goToPage"></Pagination>
    </div>
  </div>
</section>
</template>

<script>
import { mapState } from 'vuex';
import FilterDropdown from '../components/FilterDropdown';
import MapCard from '../components/MapCard';
import MapCardFake from '../components/MapCardFake';
import SectionTitle from '../components/SectionTitle';
import StickySubheader from '../components/StickySubheader';
import Pagination from 'new-dashboard/components/Pagination';
import InitialState from 'new-dashboard/components/States/InitialState';
import EmptyState from 'new-dashboard/components/States/EmptyState';
import CreateButton from 'new-dashboard/components/CreateButton.vue';
import MapBulkActions from 'new-dashboard/components/BulkActions/MapBulkActions.vue';
import { isAllowed } from '../store/maps/filters';

export default {
  name: 'MapsPage',
  components: {
    CreateButton,
    EmptyState,
    FilterDropdown,
    MapBulkActions,
    MapCard,
    MapCardFake,
    SectionTitle,
    StickySubheader,
    Pagination,
    InitialState
  },
  data () {
    return {
      isScrollPastHeader: false,
      selectedMaps: []
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
      return next({ name: 'maps' });
    }

    this.$store.dispatch('maps/setURLOptions', urlOptions);
    next();
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
      return !this.isFetchingMaps && !this.numResults && !this.hasFilterApplied('mine');
    },
    shouldShowPagination () {
      return !this.isFetchingMaps && this.numResults > 0 && this.numPages > 1;
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
    }
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.maps-list-container {
  margin-bottom: 44px;
}

.map-element {
  margin-bottom: 36px;
}

.full-width {
  width: 100%;
}

.pagination-element {
  margin-top: 28px;
}
</style>
