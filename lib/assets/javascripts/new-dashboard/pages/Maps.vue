<template>
  <section>
    <h1>Maps Page</h1>
    <h2>Favorited maps</h2>
    <p v-if="isFetchingFeaturedFavoritedMaps">Loading favorited maps</p>
    <ul v-else>
      <li v-for="featuredFavoritedMap in featuredFavoritedMaps" v-bind:key="featuredFavoritedMap.id">
        {{ featuredFavoritedMap.id }}
      </li>
    </ul>

    <h2>All maps</h2>
    <p v-if="isFetchingMaps">Loading</p>
    <ul v-else>
      <li v-for="map in maps" v-bind:key="map.id">
        {{ map.id }}
      </li>
    </ul>

    <button v-on:click="goToPage(2)">Page 2</button>
    <button v-on:click="goToPage(3)">Page 3</button>
  </section>
</template>

<script>

export default {
  name: 'MapsPage',
  computed: {
    isFetchingMaps () {
      return this.$store.state.maps.isFetching;
    },
    maps () {
      return this.$store.state.maps.list;
    },
    isFetchingFeaturedFavoritedMaps () {
      return this.$store.state.maps.featuredFavoritedMaps.isFetching;
    },
    featuredFavoritedMaps () {
      return this.$store.state.maps.featuredFavoritedMaps.list;
    }
  },
  methods: {
    goToPage (page) {
      this.$store.dispatch('maps/goToPage', page);
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
</style>
