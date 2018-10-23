<template>
  <section>
    <h1>Maps Page</h1>
    <p v-if="isFetchingMaps">Loading</p>
    <ul v-else>
      <li v-for="map in maps" v-bind:key="map.id">
        {{ map.id }}
      </li>
    </ul>
  </section>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'MapsPage',
  computed: {
    isFetchingMaps() {
      return this.$store.state.maps.isFetching;
    },
    maps() {
      return this.$store.state.maps.list;
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
</style>
