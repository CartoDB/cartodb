<template>
  <ul class="map-list">
    <li v-if="!maps.length" class="card grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile map-element">
      <CreateMapCard></CreateMapCard>
    </li>
    <li v-if="maps.length" class="card grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile map-element" v-for="map in maps" :key="map.id">
      <MapCard @dataChanged="onDataChanged" :canHover="false" :map="map" :isSelected="isMapSelected(map)" @toggleSelection="toggleSelected"></MapCard>
    </li>
  </ul>
</template>

<script>
import MapCard from '../../MapCard.vue';
import CreateMapCard from './CreateMapCard.vue';

export default {
  name: 'MapList',
  props: {
    maps: Array,
    selectedMaps: Set
  },
  components: {
    MapCard,
    CreateMapCard
  },
  methods: {
    toggleSelected (event) {
      this.$emit('toggleSelection', event.map);
    },
    isMapSelected (map) {
      return this.$props.selectedMaps.has(map);
    },
    onDataChanged () {
      this.$emit('dataChanged');
    }
  },
  computed: {
    hasMaps () {
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
  width: 100%;

  .card {
    
  }

  @media all and (min-width: 656px) {
    .card {
     
    }
  }
}
</style>
