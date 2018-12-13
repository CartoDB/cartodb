<template>
  <section class="maps-section">
    <div class="container grid">
      <SectionTitle :title="title">
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
            @orderChanged="applyOrder"
          >
            <img svg-inline src="../../../assets/icons/common/filter.svg">
          </SettingsDropdown>
        </template>

        <template slot="actionButton">
          <CreateButton visualizationType="maps">
            {{ $t(`MapsPage.createMap`) }}
          </CreateButton>
        </template>
      </SectionTitle>
      <MapList
        v-if="!isEmptyState"
        :maps="maps"
        @dataChanged="fetchMaps"
      ></MapList>
      <EmptyState v-if="isEmptyState" :text="$t('MapsPage.emptyState')" >
        <img svg-inline src="../../../assets/icons/common/compass.svg">
      </EmptyState>
    </div>
  </section>
</template>

<script>
import CreateButton from 'new-dashboard/components/CreateButton.vue';
import EmptyState from 'new-dashboard/components/States/EmptyState';
import MapBulkActions from 'new-dashboard/components/BulkActions/MapBulkActions';
import MapList from './MapList.vue';
import SectionTitle from 'new-dashboard/components/SectionTitle.vue';
import SettingsDropdown from 'new-dashboard/components/Settings/Settings';

const MAX_VISIBLE_MAPS = 6;

export default {
  name: 'MapsSection',
  components: {
    CreateButton,
    EmptyState,
    MapBulkActions,
    MapList,
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
    title () {
      return this.$t('HomePage.MapsSection.title');
    },
    appliedFilter () {
      return this.$store.state.maps.filterType;
    },
    appliedOrder () {
      return this.$store.state.maps.order;
    },
    appliedOrderDirection () {
      return this.$store.state.maps.orderDirection;
    },
    metadata () {
      return this.$store.state.maps.metadata;
    },
    isEmptyState () {
      return this.appliedFilter !== 'mine' && !this.numResults;
    },
    numResults () {
      return this.metadata.total_entries;
    },
    maps () {
      return this.$store.state.maps.list;
    }
  }
};
</script>

<style scoped lang="scss">
@import "stylesheets/new-dashboard/variables";

.maps-section {
  position: relative;
  padding: 64px 0;

  .head-section,
  .empty-state {
    width: 100%;
  }
}
</style>
