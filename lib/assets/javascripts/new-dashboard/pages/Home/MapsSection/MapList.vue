<template>
  <ul class="grid">
    <li class="grid-cell--col12" v-if="!hasMaps">
      <CreateMapCard></CreateMapCard>
    </li>
    <li v-if="hasMaps" class="card grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile map-element" v-for="map in maps" :key="map.id">
      <MapCard :canHover="false" :map="map"></MapCard>
    </li>
  </ul>
</template>

<script>
import MapCard from 'new-dashboard/components/MapCard.vue';
import CreateMapCard from 'new-dashboard/components/CreateMapCard.vue';

export default {
  name: 'MapList',
  props: {
    maps: Object
  },
  components: {
    MapCard,
    CreateMapCard
  },
  computed: {
    hasMaps () {
      return Object.keys(this.$props.maps).length > 0;
    }
  }
};
</script>