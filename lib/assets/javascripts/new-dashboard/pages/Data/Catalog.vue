<template>
  <section class="catalog-section">
    <div class="container grid">
      <div class="full-width">
        <SectionTitle class="grid-cell">
          <template slot="icon">
            <img src="../../assets/icons/section-title/catalog.svg" width="18" height="20" />
          </template>
          <template slot="title">
              <span>{{ $t('CatalogPage.header') }}</span>
          </template>
        </SectionTitle>
      </div>
    </div>
    <div class="container grid">
      <div class="grid-cell grid-cell--col12">
        <CatalogListHeader :order="appliedOrder" :orderDirection="appliedOrderDirection" @changeOrder="applyOrder"></CatalogListHeader>
        <ul v-if="!isFetchingDatasets" >
          <li v-for="(dataset) in currentPageDatasets" :key="dataset.id">
            <CatalogCard :dataset="dataset"></CatalogCard>
          </li>
        </ul>

        <ul v-else>
          <li v-for="(n) in resultsPerPage" :key="n">
            <CatalogFakeCard />
          </li>
        </ul>
      </div>
    </div>
    <Pagination v-if="shouldShowPagination" :page=currentPage :numPages=numPages @pageChange="goToPage"></Pagination>
  </section>
</template>
<script>
import { mapState } from 'vuex';
import { checkFilters } from 'new-dashboard/router/hooks/check-navigation';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import CatalogListHeader from 'new-dashboard/components/Catalog/CatalogListHeader';
import CatalogCard from 'new-dashboard/components/Catalog/CatalogCard';
import CatalogFakeCard from 'new-dashboard/components/Catalog/CatalogFakeCard';
import Pagination from 'new-dashboard/components/Pagination';

export default {
  name: 'CatalogPage',
  components: {
    SectionTitle,
    CatalogListHeader,
    CatalogCard,
    CatalogFakeCard,
    Pagination
  },
  beforeRouteUpdate (to, from, next) {
    checkFilters('catalog', 'catalog', to, from, next);
  },
  beforeMount () {
    this.$store.dispatch('catalog/fetch');
  },
  computed: {
    ...mapState({
      numPages: state => state.catalog.numPages,
      currentPage: state => state.catalog.page,
      datasets: state => state.catalog.list,
      isFetchingDatasets: state => state.catalog.isFetching,
      numResults: state => state.catalog.numResults,
      resultsPerPage: state => state.catalog.resultsPerPage,
      appliedOrder: state => state.catalog.order,
      appliedOrderDirection: state => state.catalog.orderDirection

    }),
    shouldShowPagination () {
      return !this.isFetchingDatasets && this.numResults > 0 && this.numPages > 1;
    },
    currentPageDatasets () {
      return this.datasets.slice(((this.currentPage - 1) * this.resultsPerPage), (this.currentPage * this.resultsPerPage));
    }
  },
  methods: {
    goToPage (page) {
      window.scroll({ top: 0, left: 0 });

      this.$router.push({
        name: 'catalog',
        params: this.$route.params,
        query: { ...this.$route.query, page }
      });
    },
    applyOrder (orderParams) {
      this.$router.push({
        name: 'catalog',
        params: this.$route.params,
        query: {
          ...this.$route.query,
          page: 1,
          order: orderParams.order,
          order_direction: orderParams.direction
        }
      });
      this.$store.dispatch('catalog/order', orderParams);
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.catalog-section {
  margin-top: 64px;
}

.full-width {
  width: 100%;
}
</style>
