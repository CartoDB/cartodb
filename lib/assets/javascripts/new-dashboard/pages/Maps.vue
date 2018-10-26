<template>
<div class="REMOVE">
  <section class="section">
    <div class="container grid">
      <div class="grid-cell grid-cell--col12">
        <SectionTitle title='Your Maps' description="This is a description test">
          <template slot="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
              <path d="M0 0h24v24H0z" fill="transparent"/>
              <path d="M20.55 17.83A1 1 0 0 0 21 17V3a1 1 0 0 0-1.55-.83l-5.4 3.6-4.43-3.55c-.17-.13-.37-.2-.58-.21-.21 0-.42.05-.6.16l-6 4A1 1 0 0 0 2 7v14a1 1 0 0 0 1.56.83l5.39-3.6 4.43 3.55A1 1 0 0 0 14 22c.2 0 .4-.06.55-.18zM4 7.53l4-2.66v11.6l-4 2.66zm9 11.39l-3-2.4V5.08l3 2.4zm6-2.46l-4 2.67V7.53l4-2.66z" fill="#2E3C43"/>
            </svg>
          </template>
          <template slot="dropdownButton">
            <button class="button button--ghost">
              <span class="button-icon">
                <svg width="18" height="20" viewBox="0 0 18 20" xmlns="http://www.w3.org/2000/svg">
                  <g fill="#036FE2" fill-rule="evenodd">
                    <path d="M8.3 6.7l1.4-1.4L5 .58.3 5.29l1.4 1.42L4 4.4v11.6h2V4.4zM16.3 13.3L14 15.58V4h-2V15.6l-2.3-2.3-1.4 1.42 4.7 4.7 4.7-4.7z"/>
                  </g>
                </svg>
              </span>
            </button>
            <div class="head-sectionDropdown">
              <div class="head-sectionDropdownCategory">
                <h6 class="text is-xsmall is-txtGreyLight u-tupper letter-spacing">Show Me</h6>
                <ul class="head-sectionDropdownList">
                  <li class="text is-caption is-txtGrey is-selected">All applications</li>
                  <li class="text is-caption is-txtGrey">Favorites only</li>
                  <li class="text is-caption is-txtGrey">Shared with you</li>
                </ul>
              </div>
              <div class="head-sectionDropdownCategory">
                <h6 class="text is-xsmall is-txtGreyLight u-tupper letter-spacing">Order</h6>
                <ul class="head-sectionDropdownList">
                  <li class="text is-caption is-txtGrey is-selected">Alphabetically</li>
                  <li class="text is-caption is-txtGrey">Newest first</li>
                  <li class="text is-caption is-txtGrey">Oldest first</li>
                  <li class="text is-caption is-txtGrey">Most views first</li>
                </ul>
              </div>
            </div>
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
