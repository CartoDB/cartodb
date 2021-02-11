<template>
  <section class="maps-section">
    <MapsList
      v-if="cartoMapsVisible"
      :hasBulkActions="false"
      :isCondensedDefault="true"
      :canChangeViewMode="false"
      :canHoverCard="false"
      :maxVisibleMaps="maxVisibleMaps"
      :isInitialOrEmpty="showViewAllLink"
      :showToolbar="false"
      @applyFilter="applyFilter"
      @applyOrder="applyOrder"
      @contentChanged="onContentChanged"
      @newMapClicked="onNewMapClicked">
      <template slot="navigation">
        <MapsTabs
          v-if="!isFirst"
          :cartoMapsVisible="cartoMapsVisible"
          :keplerMapsVisible="keplerMapsVisible"
          @showKeplerMaps="showKeplerMaps"/>
      </template>
    </MapsList>

    <ExternalMapsList
      v-if="keplerMapsVisible"
      :hasBulkActions="false"
      :isCondensedDefault="true"
      :canChangeViewMode="false"
      :canHoverCard="false"
      :maxVisibleMaps="maxVisibleMaps"
      :showToolbar="false"
      @applyFilter="applyFilter"
      @applyOrder="applyOrder"
      @contentChanged="onContentChanged">
      <template slot="navigation">
         <MapsTabs
           v-if="!isFirst"
           :cartoMapsVisible="cartoMapsVisible"
           :keplerMapsVisible="keplerMapsVisible"
           @showCartoMaps="showCartoMaps"/>
      </template>
    </ExternalMapsList>

    <router-link :to="{ name: mapsLink }" class="title is-small viewall-link" v-if="showViewAllLink">{{ mapsLinkText }}</router-link>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import MapsList from 'new-dashboard/components/MapsList.vue';
import ExternalMapsList from 'new-dashboard/components/ExternalMapsList.vue';
import MapsTabs from 'new-dashboard/pages/Home/MapsSection/MapsTabs.vue';

export default {
  name: 'MapsSection',
  components: {
    MapsList,
    ExternalMapsList,
    MapsTabs
  },
  data () {
    return {
      maxVisibleMaps: 6,
      cartoMapsVisible: true,
      keplerMapsVisible: false
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
    mapsLink () {
      return this.cartoMapsVisible ? 'maps' : 'external';
    },
    mapsLinkText () {
      return this.cartoMapsVisible ? this.$t('HomePage.MapsSection.viewAllCarto') : this.$t('HomePage.MapsSection.viewAllKeplergl');
    },
    showViewAllLink () {
      return !this.isFetchingMaps && this.totalUserEntries;
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
    },
    showCartoMaps () {
      this.cartoMapsVisible = true;
      this.keplerMapsVisible = false;
    },
    showKeplerMaps () {
      this.cartoMapsVisible = false;
      this.keplerMapsVisible = true;
    },
    onNewMapClicked () {
      this.$emit('newMapClicked');
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

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
