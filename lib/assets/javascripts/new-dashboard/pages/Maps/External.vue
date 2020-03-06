<template>
  <section class="externalmaps-section">
    <StickySubheader :is-visible="Boolean(selectedMaps.length && isScrollPastHeader)">
      <h2 class="title is-caption">
        {{ $t('BulkActions.selected', {count: selectedMaps.length}) }}
      </h2>

      <ExternalMapBulkActions
        :selectedMaps="selectedMaps"
        :areAllMapsSelected="areAllMapsSelected"
        @selectAll="selectAll"
        @deselectAll="deselectAll"></ExternalMapBulkActions>
    </StickySubheader>

    <ExternalMapsList
      ref="mapsList"
      class="grid__content"
      :hasBulkActions="true"
      :isCondensedDefault="isCondensed"
      :canChangeViewMode="true"
      :canHoverCard="true"
      :maxVisibleMaps="maxVisibleMaps"
      @applyFilter="applyFilter"
      @applyOrder="applyOrder"
      @selectionChange="updateSelected" />
    <Pagination v-if="shouldShowPagination" :page=currentPage :numPages=numPages @pageChange="goToPage"></Pagination>
  </section>
</template>

<script>
import { checkFilters } from 'new-dashboard/router/hooks/check-navigation';
import { mapState } from 'vuex';
import ExternalMapBulkActions from 'new-dashboard/components/BulkActions/ExternalMapBulkActions.vue';
import StickySubheader from 'new-dashboard/components/StickySubheader';
import ExternalMapsList from 'new-dashboard/components/ExternalMapsList.vue';
import Pagination from 'new-dashboard/components/Pagination';

export default {
  name: 'ExternalPage',
  components: {
    ExternalMapBulkActions,
    StickySubheader,
    Pagination,
    ExternalMapsList
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
      return this.$router.replace({ name: 'external_filtered', params: { filter: 'shared' } });
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
    checkFilters('externalMaps', 'externalMaps', to, from, next);
  },
  computed: {
    ...mapState({
      numPages: state => state.externalMaps.numPages,
      currentPage: state => state.externalMaps.page,
      maps: state => state.externalMaps.list,
      isFetchingMaps: state => state.externalMaps.isFetching,
      currentEntriesCount: state => state.externalMaps.metadata.total_entries
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
        name: this.$route.name,
        params: this.$route.params,
        query: { ...this.$route.query, page }
      });
    },
    applyFilter (filter) {
      this.$router.push({ name: 'external_filtered', params: { filter } });
    },
    applyOrder (orderParams) {
      this.deselectAll();
      this.$router.push({
        name: this.$route.name,
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
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.externalmaps-section {
  margin-top: 64px;
}

</style>
