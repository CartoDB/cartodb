<template>
<section class="section">
  <div class="maps-list-container container grid">
    <div class="full-width">
      <SectionTitle class="grid-cell" title='Your Maps' description="This is a description test">
        <template slot="icon">
          <img src="../assets/icons/section-title/map.svg">
        </template>
        <template slot="dropdownButton">
          <button class="button button--ghost">
            Filters
          </button>
        </template>
        <template slot="actionButton">
          <CreateButton visualizationType="maps">New map</CreateButton>
        </template>
      </SectionTitle>

      <div class="grid-cell" v-if="!isFetchingMaps && hasFilterApplied('mine') && totalUserEntries <= 0">
        <InitialState :title="$t(`mapCard.zeroCase.title`)">
          <template slot="icon">
            <img src="../assets/icons/maps/initialState.svg">
          </template>
          <template slot="description">
            <p class="text is-caption is-txtGrey" v-html="$t(`mapCard.zeroCase.description`)"></p>
          </template>
          <template slot="actionButton">
            <CreateButton visualizationType="maps">{{ $t(`mapCard.zeroCase.createMap`) }}</CreateButton>
          </template>
        </InitialState>
      </div>

      <ul class="grid" v-if="isFetchingMaps">
        <li class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile" v-for="n in 12" :key="n">
          <MapCardFake></MapCardFake>
        </li>
      </ul>

      <ul class="grid" v-if="!isFetchingMaps && numResults > 0">
        <li v-for="map in maps" class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile" :key="map.id">
          <MapCard :map=map></MapCard>
        </li>
      </ul>

      <Pagination v-if="!isFetchingMaps && numResults > 0" :page=currentPage :numPages=numPages @pageChange="goToPage"></Pagination>
    </div>
  </div>
</section>
</template>

<script>
import { mapState } from 'vuex';
import MapCard from '../components/MapCard';
import MapCardFake from '../components/MapCardFake';
import SectionTitle from '../components/SectionTitle';
import Pagination from 'new-dashboard/components/Pagination';
import InitialState from 'new-dashboard/components/InitialState';
import CreateButton from 'new-dashboard/components/CreateButton.vue';

export default {
  name: 'MapsPage',
  components: {
    CreateButton,
    MapCard,
    MapCardFake,
    SectionTitle,
    Pagination,
    InitialState
  },
  computed: mapState({
    numPages: state => state.maps.numPages,
    currentPage: state => state.maps.page,
    maps: state => state.maps.list,
    isFetchingMaps: state => state.maps.isFetching,
    featuredFavoritedMaps: state => state.maps.featuredFavoritedMaps.list,
    isFetchingFeaturedFavoritedMaps: state => state.maps.featuredFavoritedMaps.isFetching,
    numResults: state => state.maps.metadata.total_entries,
    filterType: state => state.maps.filterType,
    totalUserEntries: state => state.maps.metadata.total_user_entries
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
    },
    hasFilterApplied (filter) {
      return this.filterType === filter;
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

.full-width {
  width: 100%;
}
</style>
