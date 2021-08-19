<template>
  <section class="catalog-section" :class="{ 'dashboard-page': !publicWebsite }">
    <template v-if="!isCartoWorkspace">
      <div v-if="publicWebsite" class="website-header">
        <h1 class="grid-cell--col10">{{ $t('DataPage.tabs.catalog') }}</h1>
      </div>
      <div v-else class="container grid">
        <div class="full-width">
          <SectionTitle class="grid-cell">
            <template slot="icon">
              <img src="../../assets/icons/section-title/catalog.svg" width="18" height="20" />
            </template>
            <template slot="title">
              <VisualizationsTitle :defaultTitle="$t('DataPage.tabs.catalog')"/>
            </template>
          </SectionTitle>
        </div>
      </div>
    </template>
    <div :class="{ 'container grid': !publicWebsite, 'u-flex u-flex__justify--center': publicWebsite }">
      <div class="grid-cell" :class="{ 'grid-cell--col12': !publicWebsite || isCartoWorkspace , 'grid-cell--col10': publicWebsite && !isCartoWorkspace}">
        <div class="grid u-flex__justify--center">
          <div
            class="u-pr--10 grid-cell--col4 grid-cell--col12--tablet dynamic-filtering"
            :class="{ 'filter-expanded': filterDetail }"
          >
            <div class="header-mobile">
              <img
                @click="hideFilters()"
                src="../../assets/icons/catalog/close-filters.svg"
                alt="Close"
              />
            </div>
            <FilterBox
              v-for="category in filterCategories"
              :key="category"
              class="u-mt--36--tablet"
              :title="getFilterLabel(category)"
              :filter="category"
              :placeholder="category"
            ></FilterBox>
          </div>
          <div class="grid-cell grid-cell--col8 grid-cell--col12--tablet">
            <SearchBox></SearchBox>
            <FilterSummary
              class="u-mt--4"
              v-on:toggle-filter-detail="toggleFilterDetail()"
            ></FilterSummary>
            <div v-if="loading">
              <LoadingBar></LoadingBar>
            </div>
            <div v-if="datasetsList.length > 0" class="results-container u-mb--48">
              <ul class="datasets-list">
                <DatasetListItem
                  v-for="dataset in datasetsList"
                  :key="dataset.slug"
                  :dataset="dataset"
                ></DatasetListItem>
              </ul>
              <Pager :count="count" :currentPage="currentPage" @goToPage="goToPage" class="pager u-mt--48"></Pager>
            </div>
            <div v-else-if="!loading">
              <div class="empty-result u-mt--36">
                <img :src="icon_by_environment('empty-search.svg')" alt="No results" />
                <h3 class="title is-body is-txtNavyBlue u-mt--16">
                  We couldn’t find anything for your search:
                </h3>
                <p class="text is-caption is-txtNavyBlue u-mt--16">
                  Try again with another keyword or clear your filters
                </p>
                <hr class="u-mt--24" />
                <p class="text is-caption is-txtNavyBlue u-mt--24">
                  Still can’t find what you’re looking for? <br />Get help from our
                  team
                </p>
                <Button
                  class="u-mt--24"
                  @click.native="navigateToContact()"
                  >Contact us</Button
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import SectionTitle from 'new-dashboard/components/SectionTitle';

import { mapState } from 'vuex';
import Button from 'new-dashboard/components/Button';
import DatasetListItem from 'new-dashboard/components/Catalog/browser/DatasetListItem';
import FilterBox from 'new-dashboard/components/Catalog/browser/FilterBox';
import FilterSummary from 'new-dashboard/components/Catalog/browser/FilterSummary';
import LoadingBar from 'new-dashboard/components/Catalog/browser/LoadingBar';
import Pager from 'new-dashboard/components/Catalog/browser/Pager';
import SearchBox from 'new-dashboard/components/Catalog/browser/SearchBox';
import { filtersMetadata } from 'new-dashboard/utils/catalog/constants';
import { toTitleCase } from 'new-dashboard/utils/catalog/string-to-title-case';
import icon_by_environment from 'new-dashboard/mixins/catalog/icon_by_environment';
import VisualizationsTitle from 'new-dashboard/components/VisualizationsTitle';

export default {
  name: 'CatalogPage',
  props: {
    publicWebsite: Boolean,
    isCartoWorkspace: Boolean
  },
  mixins: [icon_by_environment],
  components: {
    SectionTitle,
    VisualizationsTitle,
    Button,
    DatasetListItem,
    FilterBox,
    FilterSummary,
    LoadingBar,
    Pager,
    SearchBox
  },
  data () {
    return {
      filterDetail: false
    };
  },
  watch: {
    filter: {
      deep: true,
      handler () {
        this.fetchDatasetsList();
      }
    },
    currentPage: {
      handler () {
        window.scrollTo(0, 0);
      }
    }
  },
  computed: {
    ...mapState({
      datasetsList: state => state.catalog.datasetsList,
      count: state => state.catalog.datasetsListCount,
      loading: state => state.catalog.isFetching,
      filtersAvailable: state => state.catalog.filtersAvailable,
      filter: state => state.catalog.filter,
      currentPage: state => state.catalog.filter.page
    }),
    filterCategories () {
      return Object.keys(this.filtersAvailable).sort((a, b) => {
        const orderA = filtersMetadata[a] ? filtersMetadata[a].order : Number.MAX_VALUE;
        const orderB = filtersMetadata[b] ? filtersMetadata[b].order : Number.MAX_VALUE;
        return orderA - orderB;
      });
    }
  },
  methods: {
    initFilters () {
      const query = this.$route.query;
      if (Object.keys(query).length) {
        this.$store.dispatch('catalog/initFilter', this.$route.query);
      }
    },
    fetchDatasetsList () {
      this.$store.dispatch('catalog/fetchDatasetsList');
    },
    toggleFilterDetail () {
      this.filterDetail = !this.filterDetail;
    },
    hideFilters () {
      this.filterDetail = false;
    },
    getFilterLabel (filterId) {
      return filtersMetadata[filterId]
        ? filtersMetadata[filterId].label
        : toTitleCase(filterId);
    },
    navigateToContact () {
      window.open('https://carto.com/contact/', '_blank');
    },
    goToPage (pageNum) {
      this.$store.dispatch('catalog/setPage', pageNum);
    }
  },
  mounted () {
    this.initFilters();
    this.fetchDatasetsList();
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.catalog-section {
  &__filter {
    justify-content: space-between;
    height: 168px;

    &--dropdown {
      position: relative;
    }
  }
}

.dashboard-page {
  min-height: 640px;
  margin-top: 64px;
}

.website-header {
  display: flex;
  justify-content: center;
  background-color: $color-primary;
  margin-bottom: 32px;

  h1 {
    color: white;
    font-size: 36px;
    font-weight: 600;
    line-height: 44px;
    padding: 60px 0px 60px 12px;
  }
}

.full-width {
  width: 100%;
}

.results-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;

  .datasets-list {
    width: 100%;
    margin-top: 12px;
    border-top: 1px solid $neutral--300;
  }
}

.empty-result {
  padding: 64px;
  border-radius: 12px;
  background-color: $neutral--100;
  text-align: center;

  hr {
    width: 78px;
    border: 1px solid $neutral--400;
    margin-left: auto;
    margin-right: auto;
  }
}

.header-mobile {
  display: none;
}

@media (max-width: $layout-tablet) {
  .dynamic-filtering {
    position: fixed;
    z-index: 11;
    top: 100%;
    width: 100%;
    height: 100%;
    overflow: scroll;
    transition: top 0.2s ease-out;
    background-color: $white;

    &.filter-expanded {
      top: 0;
    }
  }

  .header-mobile {
    display: block;
    position: fixed;
    z-index: 1;
    right: 0;
    width: 100%;
    padding: 20px 20px 4px;
    background-color: $white;
    text-align: right;
  }
}
</style>
