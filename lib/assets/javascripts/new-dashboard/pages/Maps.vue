<template>
<div class="REMOVE">
  <section class="section">
    <div class="container grid">
      <div class="grid-cell grid-cell--col12">
        <SectionTitle title='Your Maps' description="This is a description test">
          <template slot="icon">
            <img src="../assets/icons/section-title/map.svg">
          </template>
          <template slot="dropdownButton">
            <button class="button button--ghost">
              Filters
            </button>
          </template>
          <template slot="primaryButton">
            <button class="button">
              Test
            </button>
          </template>
        </SectionTitle>
      </div>
      <ul class="maps-list-container grid">
        <li v-for="map in maps" class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile" :key="map.id">
          <MapCard :map=map></MapCard>
        </li>
      </ul>
    </div>
  </section>
  <section class="temp">
    <h1 class="title--h1">Maps Page</h1>
    <h2 class="title--h2">Favorited maps</h2>
    <span class="loading" v-if="isFetchingFeaturedFavoritedMaps">Loading favorited maps</span>
    <ul class="maplist" v-else>
      <li class="maplist-element" v-for="featuredFavoritedMap in featuredFavoritedMaps" :key="featuredFavoritedMap.id">
        <span class="maplist-detail">Title: {{ featuredFavoritedMap.name }}</span>
        <span class="maplist-detail">Id: {{ featuredFavoritedMap.id }}</span>
        <span class="maplist-detail">Locked: {{ featuredFavoritedMap.locked }}</span>
        <span class="maplist-detail">Liked: {{ featuredFavoritedMap.liked }}</span>
      </li>
    </ul>

    <h2 class="title--h2">All maps</h2>
    <div>
      <button class="button" @click="filterLockedMaps()">LOCKED MAPS</button>
      <button class="button" @click="filterSharedMaps()">SHARED MAPS</button>
      <button class="button" @click="filterFavoritedMaps()">FAVORITED MAPS</button>
      <button class="button" @click="resetFilters()">RESET</button>
    </div>
    <span class="loading" v-if="isFetchingMaps">Loading</span>
    <ul class="maplist" v-else>
      <li class="maplist-element" v-for="map in maps" :key="map.id">
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
      <li class="pageslist-element" v-for="page in numPages" :key="page">
        <button class="button button--page" @click="goToPage(page)">Page {{ page }}</button>
      </li>
    </ul>

  </section>
</div>
</template>

<script>
import { mapState } from 'vuex';
import MapCard from '../components/MapCard';
import SectionTitle from '../components/SectionTitle';

export default {
  name: 'MapsPage',
  computed: mapState({
    numPages: state => state.maps.numPages,
    currentPage: state => state.maps.page,
    maps: state => state.maps.list,
    isFetchingMaps: state => state.maps.isFetching,
    featuredFavoritedMaps: state => state.maps.featuredFavoritedMaps.list,
    isFetchingFeaturedFavoritedMaps: state => state.maps.featuredFavoritedMaps.isFetching
  }),
  components: {
    MapCard,
    SectionTitle
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
    filterFavoritedMaps () {
      this.$store.dispatch('maps/filterFavoritedMaps');
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
/* stylelint-disable */
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
    background-color: $primary-color;
    color: $white;
  }
  .button--page {
    background-color: $light-grey;
  }
  .maps-list-container{
    width: 100%;
  }
}
</style>
