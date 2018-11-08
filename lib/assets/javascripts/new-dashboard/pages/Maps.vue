<template>
<section class="section">
  <div class="maps-list-container container grid">
    <div class="full-width">
      <SectionTitle class="grid-cell" :title='pageTitle' description="This is a description test">
        <template slot="icon">
          <img src="../assets/icons/section-title/map.svg">
        </template>
        <template slot="dropdownButton">
          <FilterDropdown
            :filter="appliedFilter"
            :order="appliedOrder"
            :metadata="mapsMetadata"
            @filterChanged="applyFilter">
            <span v-if="initialState" class="title is-small is-txtPrimary">{{ $t('FilterDropdown.initialState') }}</span>
            <svg v-else width="18" height="20" viewBox="0 0 18 20" xmlns="http://www.w3.org/2000/svg">
              <g fill="#036FE2" fill-rule="evenodd">
                <path d="M8.3 6.7l1.4-1.4L5 .58.3 5.29l1.4 1.42L4 4.4v11.6h2V4.4zM16.3 13.3L14 15.58V4h-2V15.6l-2.3-2.3-1.4 1.42 4.7 4.7 4.7-4.7z"/>
              </g>
            </svg>
          </FilterDropdown>
        </template>
        <template slot="actionButton" v-if="!initialState">
          <CreateButton visualizationType="maps">New map</CreateButton>
        </template>
      </SectionTitle>

      <div class="grid-cell" v-if="initialState">
        <InitialState :title="$t(`MapsPage.zeroCase.title`)">
          <template slot="icon">
            <img svg-inline src="../assets/icons/maps/initialState.svg">
          </template>
          <template slot="description">
            <p class="text is-caption is-txtGrey" v-html="$t(`MapsPage.zeroCase.description`)"></p>
          </template>
          <template slot="actionButton">
            <CreateButton visualizationType="maps">{{ $t(`MapsPage.zeroCase.createMap`) }}</CreateButton>
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
import FilterDropdown from '../components/FilterDropdown';
import MapCard from '../components/MapCard';
import MapCardFake from '../components/MapCardFake';
import SectionTitle from '../components/SectionTitle';
import Pagination from 'new-dashboard/components/Pagination';
import InitialState from 'new-dashboard/components/InitialState';
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
    Pagination,
    InitialState
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
      isFetchingFeaturedFavoritedMaps: state => state.maps.featuredFavoritedMaps.isFetching,
      numResults: state => state.maps.metadata.total_entries,
      filterType: state => state.maps.filterType,
      totalUserEntries: state => state.maps.metadata.total_user_entries
    }),
    pageTitle () {
      return this.$t(`MapsPage.header.title['${this.appliedFilter}']`);
    },
    initialState () {
      return (!this.isFetchingMaps && this.hasFilterApplied('mine') && this.totalUserEntries <= 0);
    }
  },
  methods: {
    goToPage (page) {
      window.scroll({ top: 0, left: 0 });
      this.$router.push({
        name: 'maps',
        params: this.$route.params,
        query: { ...this.$route.query, page }
      });
    },
    resetFilters () {
      this.$router.push({ name: 'maps' });
    },
    applyFilter (filter) {
      this.$router.push({ name: 'maps', params: { filter } });
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
