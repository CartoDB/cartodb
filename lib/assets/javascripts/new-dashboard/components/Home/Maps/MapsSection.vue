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
      <MapList :maps="maps" :selectedMaps.sync="selectedMapsData" @toggleSelection="onMapSelected"></MapList>
    </div>
  </section>
</template>

<script>
import SectionTitle from "../../SectionTitle.vue";
import CreateButton from "../../CreateButton.vue";
import SettingsDropdown from "../../Settings/Settings";
import MapList from "./MapList.vue";
import MapBulkActions from "../../BulkActions/MapBulkActions";
import mapService from "./MapService";

export default {
  name: "MapsSection",
  components: {
    SectionTitle,
    CreateButton,
    SettingsDropdown,
    MapList,
    MapBulkActions
  },
  data() {
    return {
      maps: [],
      selectedMapsData: new Set(),
      filter: "mine",
      orderOptions: {
        order: "updated_at",
        direction: "asc"
      }
    };
  },
  created: function() {
    mapService.fetchMaps().then(maps => {
      this.$data.maps = maps;
    });
  },
  methods: {
    applyFilter(filter) {
      this.$data.filter = filter;
      mapService
        .fetchMaps({ filter: this.$data.filter, orderOpts: this.$data.orderOptions })
        .then(maps => {
          this.$data.maps = maps;
        });
    },
    applyOrder(orderOptions) {
      this.$data.orderOptions = orderOptions;
      mapService
        .fetchMaps({ filter: this.$data.filter, orderOpts: this.$data.orderOptions })
        .then(maps => {
          this.$data.maps = maps;
        });
    },
    selectAll() {},
    deselectAll() {},
    onMapSelected(map) {
      this.$data.selectedMapsData.has(map)
        ? this.$data.selectedMapsData.delete(map)
        : this.$data.selectedMapsData.add(map);
      // TODO: This line forces component re-render.
      this.$data.selectedMapsData = new Set(this.$data.selectedMapsData);
    }
  },
  computed: {
    title() {
      return "Your Maps";
    },
    appliedFilter() {},
    appliedOrder() {},
    appliedOrderDirection() {},
    mapsMetadata() {},
    selectedMaps() {
      return Array.from(this.$data.selectedMapsData);
    },
    areAllMapsSelected() {
      return false;
    },
    isSomeMapSelected() {
      return this.selectedMaps.length > 0;
    }
  }
};
</script>

<style scoped lang="scss">
@import "stylesheets/new-dashboard/variables";

.maps-section {
  position: relative;
  padding: 64px 0;

  .head-section {
    width: 100%;
  }
}
</style>
