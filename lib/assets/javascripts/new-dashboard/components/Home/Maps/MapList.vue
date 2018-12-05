<template>
  <ul class="map-list">
    <CreateMapCard></CreateMapCard>
    <CreateMapCard></CreateMapCard>
  </ul>
</template>

<script>
import MapCard from "../../MapCard.vue";
import CreateMapCard from "./CreateMapCard.vue";


export default {
  name: "MapList",
  props: {
    maps: Array
  },
  components: {
    MapCard,
    CreateMapCard
  },
  methods: {},
  computed: {
    hasMaps() {
      return this.$props.maps.length > 0;
    }
  }
};
</script>

<style scoped lang="scss">
@import "stylesheets/new-dashboard/variables";

.map-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 100%;

  .create-map-card {
    min-width: 380px;
    max-width: 448px;
    margin: auto;
  }
}
</style>
