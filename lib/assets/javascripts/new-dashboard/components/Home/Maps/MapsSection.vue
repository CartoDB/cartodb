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
            :metadata="mapsMetadata"
            @filterChanged="applyFilter"
            @orderChanged="applyOrder"
          >
            <img svg-inline src="../../../assets/icons/common/filter.svg">
          </SettingsDropdown>
        </template>

        <template slot="actionButton">
          <CreateButton visualizationType="maps">{{ $t(`MapsPage.createMap`) }}</CreateButton>
        </template>
      </SectionTitle>
      <MapList :maps="maps"></MapList>
    </div>
  </section>
</template>

<script>
import SectionTitle from "../../SectionTitle.vue";
import CreateButton from "../../CreateButton.vue";
import SettingsDropdown from '../../Settings/Settings';
import MapList from './MapList.vue';

export default {
  name: "MapsSection",
  components: {
    SectionTitle,
    CreateButton,
    SettingsDropdown,
    MapList
  },
  data () {
    return {
      maps: []
    };
  },
  methods: {
    applyFilter(filter) {
      console.log('Filter', filter);
    },
    applyOrder(order) {
      console.log('Order', order);
    }
  },
  computed: {
    title() {
      return "Your Maps";
    },
    appliedFilter() {},
    appliedOrder() {},
    appliedOrderDirection() {},
    mapsMetadata() {}
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
