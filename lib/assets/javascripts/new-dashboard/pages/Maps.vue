<template>
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
        <template slot="actionButton">
          <button class="button is-bgPrimary is-txtWhite">
            New Map
          </button>
        </template>
      </SectionTitle>
    </div>

    <span class="title is-subheader is-txtGrey" v-if="isFetchingMaps">Loading</span>

    <ul class="maps-list-container grid" v-if="!isFetchingMaps">
      <li v-for="map in maps" class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile" :key="map.id">
        <MapCard :map=map></MapCard>
      </li>
    </ul>
  </div>

  <div class="temporal">
    <div>
      <button class="button" @click="filterLockedMaps()">LOCKED MAPS</button>
      <button class="button" @click="filterSharedMaps()">SHARED MAPS</button>
      <button class="button" @click="filterFavoritedMaps()">FAVORITED MAPS</button>
      <button class="button" @click="resetFilters()">RESET</button>
    </div>

    <div>
      <span>Current Page: {{ currentPage }}</span>
      <span>Num Pages: {{ numPages }}</span>
    </div>

    <ul class="pageslist">
      <li class="pageslist-element" v-for="page in numPages" :key="page">
        <button class="button button--page" @click="goToPage(page)">Page {{ page }}</button>
      </li>
    </ul>
  </div>
</section>
</template>

<script>
import { mapState } from 'vuex';
import MapCard from '../components/MapCard';
import SectionTitle from '../components/SectionTitle';

export default {
  name: 'MapsPage',
  components: {
    MapCard,
    SectionTitle
  },
  computed: mapState({
    numPages: state => state.maps.numPages,
    currentPage: state => state.maps.page,
    maps: state => state.maps.list,
    isFetchingMaps: state => state.maps.isFetching,
    featuredFavoritedMaps: state => state.maps.featuredFavoritedMaps.list,
    isFetchingFeaturedFavoritedMaps: state => state.maps.featuredFavoritedMaps.isFetching
  }),
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
.temporal {
  .pageslist {
    display: flex;
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
}
</style>
