<template>
  <section class="maps-section">
    <div class="container grid">
      <SectionTitle :title="title">
        <template slot="icon">
          <img src="../../../assets/icons/section-title/map.svg">
        </template>

        <template slot="dropdownButton">
          <MapBulkActions
            v-if="isSomeMapSelected"
            :selectedMaps="selectedMaps"
            :areAllMapsSelected="areAllMapsSelected"
            @selectAll="selectAll"
            @deselectAll="deselectAll"
          ></MapBulkActions>

          <SettingsDropdown
            v-if="!isSomeMapSelected"
            section="maps"
            :filter="appliedFilter"
            :order="appliedOrder"
            :orderDirection="appliedOrderDirection"
            :metadata="mapsMetadata"
            @filterChanged="applyFilter"
            @orderChanged="applyOrder"
          >
            <img svg-inline src="../../../assets/icons/common/filter.svg">
          </SettingsDropdown>
        </template>

        <template slot="actionButton">
          <CreateButton
            v-if="!isSomeMapSelected"
            visualizationType="maps"
          >{{ $t(`MapsPage.createMap`) }}</CreateButton>
        </template>
      </SectionTitle>
      <MapList
        v-if="!isEmptyState"
        :maps="maps"
        :selectedMaps.sync="selectedMapsData"
        @toggleSelection="onMapSelected"
        @dataChanged="fetchMaps"
      ></MapList>
      <EmptyState v-if="isEmptyState" :text="$t('MapsPage.emptyState')" > 
        <img svg-inline src="../../../assets/icons/common/compass.svg">
      </EmptyState>
    </div>
  </section>
</template>

<script>
import CreateButton from '../../CreateButton.vue';
import EmptyState from 'new-dashboard/components/States/EmptyState';
import MapBulkActions from '../../BulkActions/MapBulkActions';
import MapList from './MapList.vue';
import mapService from 'new-dashboard/core/map-service';
import SectionTitle from '../../SectionTitle.vue';
import SettingsDropdown from '../../Settings/Settings';


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
  data () {
    return {
      maps: [],
      metadata: {},
      selectedMapsData: new Set(),
      filter: 'mine',
      orderOptions: {
        order: 'updated_at',
        direction: 'asc'
      }
    };
  },
  created: function () {
    this.fetchMaps();
  },
  methods: {
    applyFilter (filter) {
      this.$data.filter = filter;
      this.fetchMaps();
    },
    applyOrder (orderOptions) {
      this.$data.orderOptions = orderOptions;
      this.fetchMaps();
    },
    selectAll () {},
    deselectAll () {},
    onMapSelected (map) {
      this.$data.selectedMapsData.has(map)
        ? this.$data.selectedMapsData.delete(map)
        : this.$data.selectedMapsData.add(map);
      // TODO: This line forces component re-render.
      this.$data.selectedMapsData = new Set(this.$data.selectedMapsData);
    },
    fetchMaps () {
      mapService
        .fetchMaps({
          filter: this.$data.filter,
          orderOpts: this.$data.orderOptions
        })
        .then(data => {
          this.$data.metadata = {
            total_entries: data.total_entries,
            total_likes: data.total_likes,
            total_shared: data.total_shared,
            total_user_entries: data.total_user_entries
          };
          this.$data.maps = data.visualizations;
        });
    }
  },
  computed: {
    title () {
      return 'Your Maps';
    },
    appliedFilter () {
      return this.$data.filter;
    },
    appliedOrder () {
      return this.$data.orderOptions.order;
    },
    appliedOrderDirection () {
      return this.$data.orderOptions.direction;
    },
    mapsMetadata () {
      return this.$data.metadata;
    },
    selectedMaps () {
      return Array.from(this.$data.selectedMapsData);
    },
    areAllMapsSelected () {
      return false;
    },
    isSomeMapSelected () {
      return this.selectedMaps.length > 0;
    },
    isEmptyState () {
      return this.appliedFilter !== 'mine' && !this.numResults;
    },
    numResults () {
      return this.$data.maps.length;
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
