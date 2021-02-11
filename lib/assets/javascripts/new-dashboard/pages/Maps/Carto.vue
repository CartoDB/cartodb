<template>
  <section class="cartomaps-section">
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
      ref="mapsList"
      class="grid__content"
      :hasBulkActions="true"
      :isCondensedDefault="isCondensed"
      :canChangeViewMode="true"
      :canHoverCard="true"
      :maxVisibleMaps="maxVisibleMaps"
      @applyFilter="applyFilter"
      @applyOrder="applyOrder"
      @selectionChange="updateSelected"
      @newMapClicked="openCreateMapPopup"/>

    <Pagination v-if="shouldShowPagination" :page=currentPage :numPages=numPages @pageChange="goToPage"></Pagination>
    <router-view></router-view>
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
  name: 'CartoPage',
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
  beforeMount () {
    if (this.$store.getters['user/isViewer']) {
      // Redirect to shared maps page if user is viewer
      return this.$router.replace({ name: 'maps', params: { filter: 'shared' } });
    }
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
    const matched = to.matched[to.matched.length - 1];
    // Prevent checkFilters when you open Dialog to add a new dataset
    if (!matched.parent || !matched.parent.name) {
      checkFilters('maps', 'maps', to, from, next);
    }
    next();
  },
  computed: {
    ...mapState({
      numPages: state => state.maps.numPages,
      currentPage: state => state.maps.page,
      maps: state => state.maps.list,
      isFetchingMaps: state => state.maps.isFetching,
      currentEntriesCount: state => state.maps.metadata.total_entries
    }),
    isNotificationVisible () {
      return this.$store.getters['user/isNotificationVisible'];
    },
    areAllMapsSelected () {
      return Object.keys(this.maps).length === this.selectedMaps.length;
    },
    shouldShowPagination () {
      return !this.isFetchingMaps && this.currentEntriesCount > 0 && this.numPages > 1;
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
      const notificationHeight = this.isNotificationVisible ? 60 : 0;
      return headerBoundingClientRect.top - notificationHeight;
    },
    loadUserConfiguration () {
      if (localStorage.hasOwnProperty('mapViewMode')) {
        if (localStorage.mapViewMode === 'compact') {
          this.isCondensed = true;
        } else if (localStorage.mapViewMode === 'standard') {
          this.isCondensed = false;
        }
      }
    },
    openCreateMapPopup () {
      this.$router.push({ name: 'maps-new-dataset' });
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.cartomaps-section {
  margin-top: 64px;
}

</style>
