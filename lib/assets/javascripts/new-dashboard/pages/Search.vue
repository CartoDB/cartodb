<template>
  <section class="page">
    <StickySubheader :is-visible="true">
      <span class="title" v-if="isFirstFetch">{{ $t('SearchPage.title.allFetching', { query: searchTerm || tag }) }}</span>
      <span class="title" v-else-if="searchTerm">{{ $tc('SearchPage.title.searchTerm', totalResults, { query: searchTerm }) }}</span>
      <span class="title" v-else-if="tag">{{ $tc('SearchPage.title.tag', totalResults, { query: tag }) }}</span>
    </StickySubheader>

    <div class="container grid">
      <div class="full-width">
        <section class="page-section" :class="{ 'has-pagination': hasMaps && mapsNumPages > 1 }" ref="maps">
          <div class="section-title grid-cell title is-medium">{{ $t('SearchPage.sections.maps') }}</div>

          <ul class="grid" v-if="isFetchingMaps">
            <li v-for="n in 6" :key="n" class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile map-element">
              <MapCardFake></MapCardFake>
            </li>
          </ul>

          <ul class="grid" v-if="!isFetchingMaps">
            <li v-for="map in maps" :key="map.id" class="grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile map-element">
              <MapCard :map=map :canHover=false></MapCard>
            </li>
          </ul>

          <Pagination
            v-if="hasMaps && mapsNumPages > 1"
            :page=mapsPage
            :numPages=mapsNumPages
            @pageChange="page => onPageChange('maps', page)"></Pagination>
        </section>

        <section class="page__section" ref="datasets">
          <div class="section-title grid-cell title is-medium">{{ $t('SearchPage.sections.data') }}</div>

          <ul class="grid-cell grid-cell--col12" v-if="!isFetchingDatasets">
            <li v-for="dataset in datasets" :key="dataset.id" class="dataset-item">
              <DatasetCard :dataset=dataset :canHover=false></DatasetCard>
            </li>
          </ul>

          <ul class="grid-cell grid-cell--col12" v-if="isFetchingDatasets">
            <li v-for="n in 6" :key="n" class="dataset-item">
              <DatasetCardFake></DatasetCardFake>
            </li>
          </ul>

          <Pagination
            class="pagination-element"
            v-if="hasDatasets && datasetsNumPages > 1"
            :page=datasetsPage
            :numPages=datasetsNumPages
            @pageChange="page => onPageChange('datasets', page)"></Pagination>
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
import updateSearchParams from 'new-dashboard/router/hooks/update-search-params';
import { mapState } from 'vuex';

const TWO_HEADERS_HEIGHT = 128;

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
  beforeRouteUpdate (to, from, next) {
    this.isFirstFetch = true;
    updateSearchParams(to, from, next);
  },
  data () {
    return {
      isFirstFetch: true
    };
  },
  computed: {
    ...mapState({
      searchTerm: state => state.search.searchTerm,
      tag: state => state.search.tag,
      maps: state => state.search.maps.results,
      mapsPage: state => state.search.maps.page,
      mapsNumPages: state => state.search.maps.numPages,
      isFetchingMaps: state => state.search.maps.isFetching,
      datasets: state => state.search.datasets.results,
      datasetsPage: state => state.search.datasets.page,
      datasetsNumPages: state => state.search.datasets.numPages,
      isFetchingDatasets: state => state.search.datasets.isFetching,
      totalResults: state => state.search.maps.numResults + state.search.datasets.numResults
    }),
    hasMaps () {
      return Object.keys(this.maps || {}).length;
    },
    hasDatasets () {
      return Object.keys(this.datasets || {}).length;
    },
    allSectionsFetching () {
      return this.isFetchingMaps || this.isFetchingDatasets;
    }
  },
  methods: {
    onPageChange (section, page) {
      this.$store.dispatch('search/changeSectionPage', { section, page });
      this.scrollToSection(section);
    },
    isOutOfViewport (boundingClientRect) {
      return boundingClientRect.top < TWO_HEADERS_HEIGHT;
    },
    scrollToSection (section) {
      const sectionBoundingClientRect = this.$refs[section].getBoundingClientRect();
      const offsetDistance = TWO_HEADERS_HEIGHT + 16; // Two headers + margin

      if (!this.isOutOfViewport(sectionBoundingClientRect)) {
        return;
      }

      window.scrollBy({ left: 0, top: sectionBoundingClientRect.top - offsetDistance, behavior: 'smooth' });
    }
  },
  watch: {
    allSectionsFetching (newValue) {
      if (newValue === false) {
        this.isFirstFetch = false;
      }
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
  margin-bottom: 12px;

  &.has-pagination,
  &:last-child {
    margin-bottom: 48px;
  }
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

.dataset-item {
  &:not(:last-child) {
    border-bottom: 1px solid $light-grey;
  }
}
</style>
