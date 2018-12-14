<template>
  <section class="maps-section">
    <div class="container grid">
      <div class="full-width">
        <SectionTitle class="grid-cell" :title="title">
          <template slot="icon">
            <img src="../../../assets/icons/section-title/map.svg">
          </template>

          <template slot="dropdownButton">
            <SettingsDropdown
              section="maps"
              :filter="appliedFilter"
              :order="appliedOrder"
              :orderDirection="appliedOrderDirection"
              :metadata="metadata"
              @filterChanged="applyFilter"
              @orderChanged="applyOrder">
              <img svg-inline src="../../../assets/icons/common/filter.svg">
            </SettingsDropdown>
          </template>

          <template slot="actionButton" v-if="!isInitialState">
            <CreateButton visualizationType="maps">
              {{ $t(`MapsPage.createMap`) }}
            </CreateButton>
          </template>
        </SectionTitle>

        <div class="grid-cell">
          <CreateMapCard v-if="isInitialState"/>
        </div>

        <MapList
          v-if="!isEmptyState && !isInitialState"
          :maps="maps"
          :isFetchingMaps="isFetchingMaps"
          @dataChanged="fetchMaps"
        ></MapList>

        <EmptyState v-if="isEmptyState" :text="$t('MapsPage.emptyState')" >
          <img svg-inline src="../../../assets/icons/common/compass.svg">
        </EmptyState>

        <MapsLink :text="mapsLinkText" v-if="!isInitialState"></MapsLink>
      </div>
    </div>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import CreateButton from 'new-dashboard/components/CreateButton.vue';
import CreateMapCard from 'new-dashboard/components/CreateMapCard.vue';
import EmptyState from 'new-dashboard/components/States/EmptyState';
import MapBulkActions from 'new-dashboard/components/BulkActions/MapBulkActions';
import MapList from './MapList.vue';
import MapsLink from './MapsLink.vue';
import SectionTitle from 'new-dashboard/components/SectionTitle.vue';
import SettingsDropdown from 'new-dashboard/components/Settings/Settings';

const MAX_VISIBLE_MAPS = 6;

export default {
  name: 'MapsSection',
  components: {
    CreateButton,
    CreateMapCard,
    EmptyState,
    MapBulkActions,
    MapList,
    MapsLink,
    SectionTitle,
    SettingsDropdown
  },
  created: function () {
    this.$store.dispatch('maps/setPerPage', MAX_VISIBLE_MAPS);
    this.fetchMaps();
  },
  methods: {
    applyFilter (filter) {
      this.$store.dispatch('maps/filterMaps', filter);
      this.$store.dispatch('maps/fetchMaps');
    },
    applyOrder (orderOptions) {
      this.$store.dispatch('maps/orderMaps', orderOptions);
      this.$store.dispatch('maps/fetchMaps');
    },
    fetchMaps () {
      this.$store.dispatch('maps/fetchMaps');
    }
  },
  computed: {
    ...mapState({
      appliedFilter: state => state.maps.filterType,
      appliedOrder: state => state.maps.order,
      appliedOrderDirection: state => state.maps.orderDirection,
      isFetchingMaps: state => state.maps.isFetching,
      maps: state => state.maps.list,
      metadata: state => state.maps.metadata,
      numResults: state => state.maps.metadata.total_entries
    }),
    title () {
      return this.$t('HomePage.MapsSection.title');
    },
    isEmptyState () {
      return !this.isFetchingMaps && this.appliedFilter !== 'mine' && !this.numResults;
    },
    isInitialState () {
      return !this.isFetchingMaps && this.appliedFilter === 'mine' && !this.numResults;
    },
    mapsLinkText () {
      return this.$t('HomePage.MapsSection.allMapsLink');
    }
  }
};
</script>

<style scoped lang="scss">
@import "stylesheets/new-dashboard/variables";

.maps-section {
  position: relative;
  padding: 64px 0;

  .full-width {
    width: 100%;
  }
}
</style>
