<template>
<section class="section">
  <div class="maps-list-container container grid">
    <div class="grid-cell grid-cell--col12">
      <SectionTitle
        :title="pageTitle"
        description="This is a description test">
        <template slot="icon">
          <img src="../assets/icons/section-title/map.svg">
        </template>
        <template slot="dropdownButton">
          <FilterDropdown
            :filter="appliedFilter"
            :order="appliedOrder"
            :metadata="mapsMetadata"
            @filterChanged="applyFilter"/>
        </template>
        <template slot="actionButton">
          <CreateButton visualizationType="maps">New map</CreateButton>
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
import FilterDropdown from '../components/FilterDropdown';
import MapCard from '../components/MapCard';
import MapCardFake from '../components/MapCardFake';
import SectionTitle from '../components/SectionTitle';
import Pagination from 'new-dashboard/components/Pagination';
import CreateButton from 'new-dashboard/components/CreateButton.vue';
import { isAllowed } from '../store/maps/filters';

export default {
  name: 'MapsPage',
  components: {
    CreateButton,
    FilterDropdown,
    MapCard,
    MapCardFake,
    SectionTitle,
    Pagination
  },
  beforeRouteUpdate (to, from, next) {
    const urlOptions = { ...to.params, ...to.query };

    if (urlOptions.filter && !isAllowed(urlOptions.filter)) {
      return next({ name: 'maps' });
    }

    this.$store.dispatch('maps/setURLOptions', urlOptions);
    next();
  },
  computed: {
    ...mapState({
      numPages: state => state.maps.numPages,
      currentPage: state => state.maps.page,
      appliedFilter: state => state.maps.filterType,
      appliedOrder: state => state.maps.order,
      maps: state => state.maps.list,
      mapsMetadata: state => state.maps.metadata,
      isFetchingMaps: state => state.maps.isFetching,
      featuredFavoritedMaps: state => state.maps.featuredFavoritedMaps.list,
      isFetchingFeaturedFavoritedMaps: state => state.maps.featuredFavoritedMaps.isFetching
    }),
    pageTitle () {
      return this.$t(`MapsPage.header.title['${this.appliedFilter}']`);
    }
  },
  methods: {
    goToPage (page) {
      window.scroll({ top: 0, left: 0 });
      this.$router.push({
        name: 'maps',
        params: this.$router.params,
        query: { ...this.$route.query, page }
      });
    },
    resetFilters () {
      this.$router.push({ name: 'maps' });
    },
    applyFilter (filter) {
      this.$router.push({ name: 'maps', params: { filter } });
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
