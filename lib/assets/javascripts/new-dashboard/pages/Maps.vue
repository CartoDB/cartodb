<template>
<section class="section">
  <div class="maps-list-container container grid">
    <div class="grid-cell grid-cell--col12">
      <SectionTitle title='Your Maps' description="This is a description test">
        <template slot="icon">
          <img src="../assets/icons/section-title/map.svg">
        </template>
        <template slot="dropdownButton">
          <MapBulkActions
            :selectedMaps="selectedMaps"
            v-if="selectedMaps.length"
            @selectAll="selectAll"
            @deselectAll="deselectAll"></MapBulkActions>

          <button class="button button--ghost" v-if="!selectedMaps.length">
            Filters
          </button>
        </template>
        <template slot="actionButton">
          <CreateButton visualizationType="maps" v-if="!selectedMaps.length">New map</CreateButton>
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
        <MapCard :map=map :isSelected="isMapSelected(map)" @toggleSelection="toggleSelected"></MapCard>
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
import CreateButton from 'new-dashboard/components/CreateButton.vue';
import MapBulkActions from 'new-dashboard/components/BulkActions/MapBulkActions.vue';

export default {
  name: 'MapsPage',
  components: {
    CreateButton,
    MapBulkActions,
    MapCard,
    MapCardFake,
    SectionTitle,
    Pagination
  },
  data () {
    return {
      selectedMaps: []
    };
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
      this.selectedMaps = [];
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
    toggleSelected ({ map, isSelected }) {
      if (isSelected) {
        this.selectedMaps.push(map);
        return;
      }

      this.selectedMaps = this.selectedMaps.filter(selectedMap => selectedMap.id !== map.id);
    },
    selectAll () {
      this.selectedMaps = [...Object.values(this.$store.state.maps.list)];
    },
    deselectAll () {
      this.selectedMaps = [];
    },
    isMapSelected (map) {
      return this.selectedMaps.some(selectedMap => selectedMap.id === map.id);
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
