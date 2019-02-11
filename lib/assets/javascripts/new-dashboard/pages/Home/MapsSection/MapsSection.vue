<template>
  <section class="maps-section">
    <MapsList
    :hasBulkActions="false"
    :isCondensedDefault="true"
    :canChangeViewMode="false"
    :canHoverCard="false"
    :maxVisibleMaps="maxVisibleMaps"
    :isInitialOrEmpty="showViewAllLink"
    @applyFilter="applyFilter"
    @applyOrder="applyOrder"
    @contentChanged="onContentChanged"/>

    <router-link :to="{ name: 'maps' }" class="title is-small viewall-link" v-if="showViewAllLink">{{ mapsLinkText }}</router-link>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import MapsList from 'new-dashboard/components/MapsList.vue';

export default {
  name: 'MapsSection',
  components: {
    MapsList
  },
  data () {
    return {
      maxVisibleMaps: 6
    };
  },
  computed: {
    ...mapState({
      appliedFilter: state => state.maps.filterType,
      appliedOrder: state => state.maps.order,
      isFetchingMaps: state => state.maps.isFetching,
      numResults: state => state.maps.metadata.total_entries,
      totalUserEntries: state => state.maps.metadata.total_user_entries,
      totalShared: state => state.maps.metadata.total_shared,
      isFirst: state => state.config.isFirstTimeViewingDashboard
    }),
    mapsLinkText () {
      return this.$t('HomePage.MapsSection.viewAll');
    },
    showViewAllLink () {
      return !(this.initialState || this.emptyState || this.isFirst);
    }
  },
  methods: {
    applyFilter (filter) {
      this.$store.dispatch('maps/filter', filter);
      this.$store.dispatch('maps/fetch');
    },
    applyOrder (orderOptions) {
      this.$store.dispatch('maps/order', orderOptions);
      this.$store.dispatch('maps/fetch');
    },
    hasFilterApplied (filter) {
      return this.appliedFilter === filter;
    },
    onContentChanged (type) {
      this.$emit('contentChanged', type);
    }
  }
};
</script>

<style scoped lang="scss">
@import "stylesheets/new-dashboard/variables";

.maps-section {
  .full-width {
    width: 100%;
  }
}

.viewall-link {
  display: block;
  margin-top: 64px;
  letter-spacing: 1px;
  text-align: center;
  text-transform: uppercase;
}
</style>
