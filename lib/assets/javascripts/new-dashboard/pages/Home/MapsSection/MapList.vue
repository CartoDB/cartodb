<template>
  <div class="grid">
    <div class="grid-cell grid-cell--noMargin grid-cell--col12">
      <CondensedMapHeader
        :order="order"
        :orderDirection="appliedOrderDirection"
        @orderChanged="applyOrder"></CondensedMapHeader>
    </div>
    <ul class="grid-cell grid-cell--col12" v-if="!isMapListVisible">
      <li class="card-condensed" v-for="n in 6" :key="n">
        <MapCardFake :condensed="true"></MapCardFake>
      </li>
    </ul>

    <ul class="grid-cell grid-cell--col12" v-if="isMapListVisible">
      <li v-for="map in maps" class="card-condensed" :key="map.id">
        <MapCard :condensed="true" :map="map" :canHover="false"></MapCard>
      </li>
    </ul>
  </div>
</template>

<script>
import MapCard from 'new-dashboard/components/MapCard/MapCard.vue';
import MapCardFake from 'new-dashboard/components/MapCard/fakes/MapCardFake';
import CondensedMapHeader from 'new-dashboard/components/MapCard/CondensedMapHeader';

export default {
  name: 'MapList',
  props: {
    maps: Object,
    order: String,
    appliedOrderDirection: String,
    isFetchingMaps: {
      type: Boolean,
      default: false
    }
  },
  components: {
    MapCard,
    MapCardFake,
    CondensedMapHeader
  },
  computed: {
    isMapListVisible () {
      return this.hasMaps && !this.$props.isFetchingMaps;
    },
    hasMaps () {
      return Object.keys(this.$props.maps).length > 0;
    }
  },
  methods: {
    applyOrder (orderOptions) {
      this.$emit('applyOrder', orderOptions);
    }
  }
};
</script>

<style scoped lang="scss">

.card-condensed {
  width: 100%;
  border-bottom: 1px solid #EBEEF5;

  &:last-child {
    border-bottom: 0;
  }
}
</style>
