<template>
  <ul class="grid">
    <li v-if="isMapListVisible" class="card grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile map-element" v-for="map in maps" :key="map.id">
      <MapCard :canHover="false" :visualization="map"></MapCard>
    </li>

    <ul class="grid" v-if="!isMapListVisible">
      <li class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile map-element" v-for="n in 6" :key="n">
        <MapCardFake></MapCardFake>
      </li>
    </ul>
  </ul>
</template>

<script>
import MapCard from 'new-dashboard/components/MapCard/MapCard.vue';
import MapCardFake from 'new-dashboard/components/MapCard/fakes/MapCardFake';

export default {
  name: 'MapList',
  props: {
    maps: Object,
    isFetchingMaps: {
      type: Boolean,
      default: false
    }
  },
  components: {
    MapCard,
    MapCardFake
  },
  computed: {
    isMapListVisible () {
      return this.hasMaps && !this.$props.isFetchingMaps;
    },
    hasMaps () {
      return Object.keys(this.$props.maps).length > 0;
    }
  }
};
</script>

<style scoped lang="scss">
.map-element {
  margin-bottom: 36px;
}
</style>
