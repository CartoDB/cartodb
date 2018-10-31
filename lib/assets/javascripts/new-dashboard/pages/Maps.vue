<template>
<section class="section">
  <div class="maps-list-container container grid">
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

    <ul class="grid" v-if="isFetchingMaps">
      <li class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile" v-for="n in 12" :key="n">
        <MapCardFake></MapCardFake>
      </li>
    </ul>

    <ul class="grid" v-if="!isFetchingMaps">
      <li v-for="map in maps" class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile" :key="map.id">
        <MapCard :map=map></MapCard>
      </li>
    </ul>
  </div>

  <Pagination v-if="!isFetchingMaps" :page=currentPage :numPages=numPages @pageChange="goToPage"></Pagination>
</section>
</template>

<script>
import { mapState } from 'vuex';
import MapCard from '../components/MapCard';
import MapCardFake from '../components/MapCardFake';
import SectionTitle from '../components/SectionTitle';
import Pagination from 'new-dashboard/components/Pagination';

export default {
  name: 'MapsPage',
  components: {
    MapCard,
    MapCardFake,
    SectionTitle,
    Pagination
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

.maps-list-container {
  margin-bottom: 44px;
}
</style>
