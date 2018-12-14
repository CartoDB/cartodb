<template>
  <ul class="grid">
    <li class="grid-cell--col12" v-if="isCreateMapCardVisible">
      <CreateMapCard></CreateMapCard>
    </li>
    <li v-if="isMapListVisible" class="card grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile map-element" v-for="map in maps" :key="map.id">
      <MapCard :canHover="false" :map="map"></MapCard>
    </li>
    <ul class="grid" v-if="!isMapListVisible">
      <li class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile map-element" v-for="n in 3" :key="n">
        <MapCardFake></MapCardFake>
      </li>
    </ul>
  </ul>
</template>

<script>
import MapCard from 'new-dashboard/components/MapCard.vue';
import CreateMapCard from 'new-dashboard/components/CreateMapCard.vue';
import MapCardFake from 'new-dashboard/components/MapCardFake.vue';

export default {
  name: 'MapList',
  props: {
    maps: Object,
    isFetchingMaps : {
      type: Boolean,
      default: false,
    }
  },
  components: {
    CreateMapCard,
    MapCard,
    MapCardFake
  },
  computed: {
    isCreateMapCardVisible () {
      return !this.hasMaps && !this.$props.isFetchingMaps;
    },
    isMapListVisible () {
      return this.hasMaps && !this.$props.isFetchingMaps;
    },
    hasMaps () {
      return Object.keys(this.$props.maps).length > 0;
    }
  }
};
</script>
