<template>
  <section class="page">
    <StickySubheader :is-visible="true">
      <span class="title">{{ totalResults }} results for "{{ searchTerm }}"</span>
    </StickySubheader>

    <div class="container grid">
      <div class="full-width">
        <section class="page-section">
          <div class="section-title grid-cell title is-medium">Maps</div>

          <ul class="grid" v-if="isFetchingMaps">
            <li v-for="n in 6" :key="n" class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile map-element">
              <MapCardFake></MapCardFake>
            </li>
          </ul>

          <ul class="grid" v-if="!isFetchingMaps">
            <li v-for="map in maps" :key="map.id" class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile map-element">
              <MapCard :map=map></MapCard>
            </li>
          </ul>

          <Pagination
            class="pagination-element"
            v-if="!isFetchingMaps && hasMaps"
            :page=1
            :numPages=mapsNumPages></Pagination>
        </section>

        <section class="page__section">
          <div class="section-title grid-cell title is-medium">Datasets</div>

          <ul class="grid-cell grid-cell--col12" v-if="!isFetchingDatasets">
            <li v-for="dataset in datasets" :key="dataset.id">
              <DatasetCard :dataset=dataset></DatasetCard>
            </li>
          </ul>

          <ul class="grid-cell grid-cell--col12" v-if="isFetchingDatasets">
            <li v-for="n in 6" :key="n">
              <DatasetCardFake></DatasetCardFake>
            </li>
          </ul>

          <Pagination
            class="pagination-element"
            v-if="!isFetchingDatasets && hasDatasets"
            :page=1
            :numPages=datasetsNumPages></Pagination>
        </section>
      </div>
    </div>

  </section>
</template>

<script>
import StickySubheader from 'new-dashboard/components/StickySubheader';
import MapCard from 'new-dashboard/components/MapCard';
import MapCardFake from 'new-dashboard/components/MapCardFake';
import DatasetCard from 'new-dashboard/components/Dataset/DatasetCard';
import DatasetCardFake from 'new-dashboard/components/Dataset/DatasetCardFake';
import Pagination from 'new-dashboard/components/Pagination';
import { mapState } from 'vuex';

export default {
  name: 'SearchPage',
  components: {
    DatasetCard,
    DatasetCardFake,
    MapCard,
    MapCardFake,
    Pagination,
    StickySubheader
  },
  computed: {
    ...mapState({
      searchTerm: state => state.search.searchTerm,
      maps: state => state.search.maps.results,
      mapsNumPages: state => state.search.maps.numPages,
      isFetchingMaps: state => state.search.maps.isFetching,
      // isFetchingMaps: state => true,
      datasets: state => state.search.datasets.results,
      datasetsNumPages: state => state.search.datasets.numPages,
      isFetchingDatasets: state => state.search.datasets.isFetching,
      // isFetchingDatasets: state => true,
      totalResults: state => state.search.maps.numResults + state.search.datasets.numResults
    }),
    hasMaps () {
      return Object.keys(this.maps || {}).length;
    },
    hasDatasets () {
      return Object.keys(this.datasets || {}).length;
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'stylesheets/new-dashboard/variables';

.page {
  padding-top: 192px;
  background-color: $softblue;
}

.page-section {
  margin-bottom: 48px;
}

.full-width {
  width: 100%;
}

.section-title {
  margin-bottom: 16px;
}

.map-element {
  margin-bottom: 36px;
}

.pagination-element {
  margin-top: 36px;
}
</style>
