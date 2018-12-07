<template>
  <ul class="map-list">
    <li v-if="!maps.length" class="card">
      <CreateMapCard></CreateMapCard>
    </li>
    <li v-if="maps.length" class="card" v-for="map in maps" :key="map.id">
      <MapCard :map="map" :isSelected="isMapSelected(map)" @toggleSelection="toggleSelected"></MapCard>
    </li>
  </ul>
</template>

<script>
import MapCard from "../../MapCard.vue";
import CreateMapCard from "./CreateMapCard.vue";

export default {
  name: "MapList",
  props: {
    maps: Array,
    selectedMaps: Set
  },
  components: {
    MapCard,
    CreateMapCard
  },
  methods: {
    toggleSelected(event) {
      this.$emit("toggleSelection", event.map);
    },
    isMapSelected(map) {
      return this.$props.selectedMaps.has(map);
    }
  },

  computed: {
    hasMaps() {
      return this.$props.maps.length > 0;
    }
  },
  watch: {}
};
</script>

<style scoped lang="scss">
@import "stylesheets/new-dashboard/variables";

.map-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 100%;

  .card {
    min-width: 280px;
    margin: 12px auto;
  }

  @media all and (min-width: 656px) {
    .card {
      flex: 1;
      min-width: 270px;
      margin: 0 12px 36px;
    }
  }
}
</style>
