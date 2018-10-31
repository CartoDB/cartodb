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
      const translationKey = `MapsPage.header.titleWhenFilterApplied.${this.appliedFilter || 'default'}`;
      return this.$t(translationKey);
    }
  },
  methods: {
    goToPage (page) {
      this.$store.dispatch('maps/goToPage', page);
    },
    resetFilters () {
      this.$store.dispatch('maps/resetFilters');
    },
    applyFilter (filter) {
      this.$store.dispatch('maps/filterMaps', filter);
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
