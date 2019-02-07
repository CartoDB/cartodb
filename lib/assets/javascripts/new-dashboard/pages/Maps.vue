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
    <MapsList
      :hasBulkActions="true"
      :isCondensedDefault="isCondensed"
      :canChangeViewMode="true"
      :canHoverCard="true"
      :maxVisibleMaps="maxVisibleMaps"
      @applyFilter="applyFilter"
      @applyOrder="applyOrder"
      @updateSelected="updateSelected"
      ref="mapsList"/>
    <Pagination v-if="shouldShowPagination" :page=currentPage :numPages=numPages @pageChange="goToPage"></Pagination>
  </section>
</template>

<script>
import { checkFilters } from 'new-dashboard/router/hooks/check-navigation';
import { mapState } from 'vuex';
import MapBulkActions from 'new-dashboard/components/BulkActions/MapBulkActions.vue';
import Pagination from 'new-dashboard/components/Pagination';
import StickySubheader from 'new-dashboard/components/StickySubheader';
import MapsList from 'new-dashboard/components/MapsList.vue';

export default {
  name: 'MapsPage',
  components: {
    MapBulkActions,
    StickySubheader,
    Pagination,
    MapsList
  },
  data () {
    return {
      isScrollPastHeader: false,
      maxVisibleMaps: 12,
      selectedMaps: [],
      isCondensed: false
    };
  },
  created: function () {
    this.loadUserConfiguration();
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
    checkFilters('maps', 'maps', to, from, next);
  },
  computed: {
    ...mapState({
      numPages: state => state.maps.numPages,
      currentPage: state => state.maps.page,
      maps: state => state.maps.list,
      isFetchingMaps: state => state.maps.isFetching,
      numResults: state => state.maps.metadata.total_entries
    }),
    areAllMapsSelected () {
      return Object.keys(this.maps).length === this.selectedMaps.length;
    },
    shouldShowPagination () {
      return !this.isFetchingMaps && this.numResults > 0 && this.numPages > 1;
    }
  },
  methods: {
    updateSelected (selected) {
      this.selectedMaps = selected;
    },
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
      this.deselectAll();
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
    selectAll () {
      this.$refs.mapsList.selectAll();
    },
    deselectAll () {
      this.$refs.mapsList.deselectAll();
    },
    onScrollChange () {
      this.isScrollPastHeader = window.pageYOffset > this.stickyScrollPosition;
    },
    getHeaderBottomPageOffset () {
      const headerContainer = this.$refs.mapsList.getHeaderContainer();
      const headerBoundingClientRect = headerContainer.$el.getBoundingClientRect();
      return headerBoundingClientRect.top;
    },
    loadUserConfiguration () {
      if (localStorage.hasOwnProperty('mapViewMode')) {
        if (localStorage.mapViewMode === 'compact') {
          this.isCondensed = true;
        } else if (localStorage.mapViewMode === 'standard') {
          this.isCondensed = false;
        }
      }
    }
  }
};
</script>
