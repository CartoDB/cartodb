<template>
  <Page class="page__sticky-subheader">
    <StickySubheader :is-visible="true" class="page-subheader">
      <span class="title" v-if="isFirstFetch">
        {{ $t('SearchPage.title.allFetching', { query: searchTerm || tag }) }}
        <span class="loading">
          <img svg-inline src="../assets/icons/common/loading.svg" class="loading__svg"/>
        </span>
      </span>
      <span class="title" v-else-if="searchTerm">{{ $tc('SearchPage.title.searchTerm', totalResults, { query: searchTerm }) }}</span>
      <span class="title" v-else-if="tag">{{ $tc('SearchPage.title.tag', totalResults, { query: tag }) }}</span>
    </StickySubheader>

    <div class="container grid grid__content">
      <div class="full-width">
        <section class="section section--maps" :class="{ 'has-pagination': hasMaps && mapsNumPages > 1 }" ref="maps">
          <div class="section__title grid-cell title is-medium">{{ $t('SearchPage.sections.maps') }}</div>
            <div class="js-grid__head--sticky">
              <div v-if="hasMaps || isFetchingMaps"
                class="grid-cell grid-cell--noMargin grid-cell--col12 grid__head--sticky"
                :class="{ 'has-user-notification': isNotificationVisible }">
                <CondensedMapHeader order="" orderDirection="" :isSortable="false"></CondensedMapHeader>
              </div>

              <ul class="grid-cell grid-cell--col12" v-if="isFetchingMaps">
                <li v-for="n in 6" :key="n" class="search-item">
                  <MapCardFake :condensed="true" class="search-item"></MapCardFake>
                </li>
              </ul>

              <ul class="grid-cell grid-cell--col12" v-if="!isFetchingMaps">
                <li v-for="map in maps" :key="map.id" class="search-item">
                  <MapCard :visualization=map :canHover=false :condensed="true" storeActionType="search"></MapCard>
                </li>

                <div class="is-caption text maps--empty" v-if="!hasMaps">
                  {{ $t('SearchPage.emptyText.maps') }}
                </div>
              </ul>
            </div>
            <Pagination
              v-if="hasMaps && mapsNumPages > 1"
              :page=mapsPage
              :numPages=mapsNumPages
              @pageChange="page => onPageChange('maps', page)"></Pagination>
        </section>

        <section class="section section--datasets" ref="datasets">
          <div class="section__title grid-cell title is-medium">{{ $t('SearchPage.sections.data') }}</div>
            <div class="js-grid__head--sticky">
              <div
                v-if="hasDatasets || isFetchingDatasets"
                class="grid-cell grid-cell--noMargin grid-cell--col12 grid__head--sticky"
                :class="{ 'has-user-notification': isNotificationVisible }">
                <DatasetListHeader order="" orderDirection="" :isSortable="false"></DatasetListHeader>
              </div>

              <ul class="grid-cell grid-cell--col12" v-if="!isFetchingDatasets">
                <li v-for="dataset in datasets" :key="dataset.id" class="search-item">
                  <DatasetCard :dataset=dataset :canHover=false storeActionType="search"></DatasetCard>
                </li>

                <div class="is-caption text data--empty" v-if="!hasDatasets">
                  {{ $t('SearchPage.emptyText.datasets') }}
                </div>
              </ul>

              <ul class="grid-cell grid-cell--col12" v-if="isFetchingDatasets">
                <li v-for="n in 6" :key="n" class="search-item">
                  <DatasetCardFake></DatasetCardFake>
                </li>
              </ul>
            </div>
            <Pagination
              class="pagination-element"
              v-if="hasDatasets && datasetsNumPages > 1"
              :page=datasetsPage
              :numPages=datasetsNumPages
              @pageChange="page => onPageChange('datasets', page)"></Pagination>
        </section>

        <section class="section section--tags" ref="tags" v-if="isTermSearch">
          <div class="section__title grid-cell title is-medium">{{ $t('SearchPage.sections.tags') }}</div>
            <ul class="grid" v-if="!isFetchingTags">
              <li v-for="(tag, n) in tags" :key="n" class="search-item--tag grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile">
               <TagCard :tag=tag :condensed="true"></TagCard>
              </li>
               <li class="grid-cell">
                <div class="is-caption text" v-if="!hasTags">
                  {{ $t('SearchPage.emptyText.tags') }}
                </div>
              </li>
            </ul>

            <ul class="grid" v-if="isFetchingTags">
              <li v-for="n in 6" :key="n" class="search-item--tag grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile">
                <FakeTagCard></FakeTagCard>
              </li>
            </ul>
          <Pagination
            class="pagination-element"
            v-if="hasTags && tagsNumPages > 1"
            :page=tagsPage
            :numPages=tagsNumPages
            @pageChange="page => onPageChange('tags', page)"></Pagination>
        </section>
      </div>
    </div>

  </Page>
</template>

<script>
import Page from 'new-dashboard/components/Page';
import StickySubheader from 'new-dashboard/components/StickySubheader';
import CondensedMapHeader from 'new-dashboard/components/MapCard/CondensedMapHeader.vue';
import MapCard from 'new-dashboard/components/MapCard/MapCard.vue';
import MapCardFake from 'new-dashboard/components/MapCard/fakes/MapCardFake';
import DatasetListHeader from '../components/Dataset/DatasetListHeader';
import DatasetCard from 'new-dashboard/components/Dataset/DatasetCard';
import DatasetCardFake from 'new-dashboard/components/Dataset/DatasetCardFake';
import TagCard from 'new-dashboard/components/Tag/TagCard';
import FakeTagCard from 'new-dashboard/components/Tag/FakeTagCard';
import Pagination from 'new-dashboard/components/Pagination';
import updateSearchParams from 'new-dashboard/router/hooks/update-search-params';
import { mapState } from 'vuex';

const TWO_HEADERS_HEIGHT = 128;

export default {
  name: 'SearchPage',
  components: {
    Page,
    CondensedMapHeader,
    DatasetCard,
    DatasetCardFake,
    DatasetListHeader,
    MapCard,
    MapCardFake,
    Pagination,
    StickySubheader,
    TagCard,
    FakeTagCard
  },
  beforeRouteUpdate (to, from, next) {
    this.$store.dispatch('search/resetState');
    this.isFirstFetch = true;

    this.updateSearchParams(to, from, next);
  },
  beforeRouteLeave (to, from, next) {
    this.$store.dispatch('search/resetState');
    next();
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
      tags: state => state.search.tags.results,
      tagsPage: state => state.search.tags.page,
      tagsNumPages: state => state.search.tags.numPages,
      isFetchingTags: state => state.search.tags.isFetching,
      totalResults: state => state.search.maps.numResults +
                             state.search.datasets.numResults +
                             state.search.tags.numResults
    }),
    hasMaps () {
      return Object.keys(this.maps || {}).length;
    },
    hasDatasets () {
      return Object.keys(this.datasets || {}).length;
    },
    hasTags () {
      return (this.tags || []).length;
    },
    allSectionsFetching () {
      return this.isFetchingMaps || this.isFetchingDatasets || this.isFetchingTags;
    },
    isTermSearch () {
      return this.searchTerm;
    },
    isNotificationVisible () {
      return this.$store.getters['user/isNotificationVisible'];
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

      window.scrollBy({ top: sectionBoundingClientRect.top - offsetDistance, behavior: 'smooth' });
    },
    updateSearchParams
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
@import 'new-dashboard/styles/variables';

.section {
  position: relative;
  margin-bottom: 48px;
  padding: 0;
  border-bottom: 0;

  &--maps {
    z-index: $z-index__stack-context--first;
  }

  &--datasets {
    z-index: $z-index__stack-context--second;
  }

  &--tags {
    z-index: $z-index__stack-context--third;

    .search-item--tag {
      margin-bottom: 24px;
    }
  }

  &.has-pagination,
  &:last-child {
    margin-bottom: 48px;
  }

  &__title {
    margin-bottom: 16px;
  }
}

.page-subheader {
  background-color: $softblue;
}

.loading {
  margin-left: 24px;

  &__svg {
    width: 18px;
    vertical-align: text-top;

    g {
      stroke-width: 2px;
    }
  }
}

.full-width {
  width: 100%;
}

.grid__head--sticky {
  top: 128px;
}

.grid__head--sticky.has-user-notification {
  top: 128px + $notification-warning__height;
}

.map-element {
  margin-bottom: 36px;
}

.pagination-element {
  margin-top: 36px;
}

.search-item {
  &:not(:last-child) {
    border-bottom: 1px solid $border-color;
  }
}

.maps--empty,
.data--empty {
  margin-bottom: 64px;
}
</style>
