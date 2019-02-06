<template>
  <section class="maps-section">
    <MapComponent
    :hasBulkActions="false"
    :isCondensedDefault="true"
    :canChangeViewMode="false"
    :canHoverCard="false"
    :maxVisibleMaps="maxVisibleMaps"
    :showViewAll="true"
    @applyFilter="applyFilter"
    @applyOrder="applyOrder"
    @isInitialOrEmpty="isInitialOrEmpty"/>

    <router-link :to="{ name: 'maps' }" class="title is-small viewall-link" v-if="showViewAllLink">{{ mapsLinkText }}</router-link>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import MapComponent from 'new-dashboard/components/MapComponent.vue';

export default {
  name: 'MapsSection',
  components: {
    MapComponent
  },
  data () {
    return {
      showViewAllLink: true,
      maxVisibleMaps: 6
    };
  },
  methods: {
    applyFilter (filter) {
      this.$store.dispatch('maps/filterMaps', filter);
      this.$store.dispatch('maps/fetch');
    },
    applyOrder (orderOptions) {
      this.$store.dispatch('maps/orderMaps', orderOptions);
      this.$store.dispatch('maps/fetch');
    },
    isInitialOrEmpty (initialOrEmpty) {
      this.showViewAllLink = !initialOrEmpty;
    }
  },
  computed: {
    ...mapState({
      appliedFilter: state => state.maps.filterType,
      appliedOrder: state => state.maps.order
    }),
    mapsLinkText () {
      return this.$t('HomePage.MapsSection.allMapsLink');
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
