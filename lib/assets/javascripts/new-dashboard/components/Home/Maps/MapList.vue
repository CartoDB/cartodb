<template>
  <ul class="map-list">
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
  .create-map-card {
    max-width: 500px;
  }
}
</style>
