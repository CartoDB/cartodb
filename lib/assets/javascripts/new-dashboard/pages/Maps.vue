<template>
  <section class="temp">
    <h1 class="title--h1">Maps Page</h1>
    <h2 class="title--h2">Favorited maps</h2>
    <span class="loading" v-if="isFetchingFeaturedFavoritedMaps">Loading favorited maps</span>
    <ul class="maplist" v-else>
      <li class="maplist-element" v-for="featuredFavoritedMap in featuredFavoritedMaps" v-bind:key="featuredFavoritedMap.id">
        <span class="maplist-detail">Title: {{ featuredFavoritedMap.name }}</span>
        <span class="maplist-detail">Id: {{ featuredFavoritedMap.id }}</span>
        <span class="maplist-detail">Locked: {{ featuredFavoritedMap.locked }}</span>
        <span class="maplist-detail">Liked: {{ featuredFavoritedMap.liked }}</span>
      </li>
    </ul>

    <h2 class="title--h2">All maps</h2>
    <div>
      <button class="button" v-on:click="filterLockedMaps()">LOCKED MAPS</button>
      <button class="button" v-on:click="filterSharedMaps()">SHARED MAPS</button>
      <button class="button" v-on:click="resetFilters()">RESET</button>
    </div>
    <span class="loading" v-if="isFetchingMaps">Loading</span>
    <ul class="maplist" v-else>
      <li class="maplist-element" v-for="map in maps" v-bind:key="map.id">
        <span class="maplist-detail" >Title: {{ map.name }}</span>
        <span class="maplist-detail">Id: {{ map.id }}</span>
        <span class="maplist-detail" >Locked: {{ map.locked }}</span>
        <span class="maplist-detail">Liked: {{ map.liked }}</span>
      </li>
    </ul>

    <div>
      <span>Current Page: {{ currentPage }}</span>
      <span>Num Pages: {{ numPages }}</span>
    </div>
    <ul class="pageslist">
      <li class="pageslist-element" v-for="page in numPages" v-bind:key="page">
        <button class="button button--page" v-on:click="goToPage(page)">Page {{ page }}</button>
      </li>
    </ul>

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
    currentPage () {
      return this.$store.state.maps.page;
    },
    numPages () {
      return this.$store.state.maps.numPages;
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
    },
    filterLockedMaps () {
      this.$store.dispatch('maps/filterLockedMaps');
    },
    filterSharedMaps () {
      this.$store.dispatch('maps/filterSharedMaps');
    },
    resetFilters () {
      this.$store.dispatch('maps/resetFilters');
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';
.temp {
  .title--h1 {
    font-size: 32px;
    margin-bottom: 16px;
  }
  .title--h2 {
    font-size: 24px;
    margin-bottom: 12px;
  }
  .maplist, .pageslist {
    display: flex;
  }
  .maplist-element {
    display: flex;
    flex-direction: column;
    padding: 16px;
    border: 1px solid $light-grey;
    box-sizing: border-box;
  }
  .maplist-detail {
    margin-bottom: 8px;
  }
  .pageslist-element {
    padding: 16px;
  }
  .button {
    padding: 8px 20px;
    border-radius: 4px;
    margin: 8px;
    cursor: pointer;
    box-sizing: border-box;
    background-color: $primaryColor;
    color: $white;
  }
  .button--page {
    background-color: $light-grey;
  }
}
</style>
