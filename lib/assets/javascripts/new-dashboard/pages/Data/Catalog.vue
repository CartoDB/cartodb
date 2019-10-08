<template>
  <section class="catalog">
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

    <div class="catalog__filter container grid" action="">
      <div class="grid-cell grid-cell--col5 catalog__filter--dropdown">
        <CatalogDropdown ref="dropdownCategories"
          :title="'Choose a category'"
          :open="true"
          :placeholder="'Search...'"
          :options="categories"
          @selected="getCountries"
          @reset="resetDatasets">
        </CatalogDropdown>
      </div>
      <div class="grid-cell grid-cell--col5 catalog__filter--dropdown">
        <CatalogDropdown ref="dropdownCountries"
          :title="'Choose a country'"
          :placeholder="'Choose one'"
          :options="countries"
          :disabled="dropdownCountriesDisabled"
          :limitHeight="true"
          @open="dropdownCountriesOpen"
          @selected="getDatasets"></CatalogDropdown>
      </div>
    </div>

    <!-- Datasets list -->
    <div class="container grid"  v-if="datasets.length > 0">
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
import CatalogDropdown from 'new-dashboard/components/Catalog/CatalogDropdown';
import Pagination from 'new-dashboard/components/Pagination';

export default {
  name: 'CatalogPage',
  components: {
    SectionTitle,
    CatalogListHeader,
    CatalogCard,
    CatalogFakeCard,
    CatalogDropdown,
    Pagination
  },
  beforeRouteUpdate (to, from, next) {
    checkFilters('catalog', 'catalog', to, from, next);
  },
  beforeMount () {
    this.$store.dispatch('catalog/fetch');
  },
  data () {
    return {
      dropdownCountriesDisabled: true,
      dropdownCountriesOpen: false,
    }
  },
  computed: {
    ...mapState({
      numPages: state => state.catalog.numPages,
      currentPage: state => state.catalog.page,
      datasets: state => state.catalog.list,
      categories: state => state.catalog.categories,
      countries: state => state.catalog.countries,
      isFetchingDatasets: state => state.catalog.isFetching,
      numResults: state => state.catalog.numResults,
      resultsPerPage: state => state.catalog.resultsPerPage,
      appliedOrder: state => state.catalog.order,
      appliedOrderDirection: state => state.catalog.orderDirection

    }),
    shouldShowPagination () {
      return !this.isFetchingDatasets && this.numPages > 1;
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
    },
    getCountries (category) {
      this.$refs.dropdownCountries.resetInput();
      this.dropdownCountriesDisabled = false;
      this.$store.dispatch('catalog/fetchCountries', category)
      window.scroll({ top: 0, left: 0 });
    },
    getDatasets (country) {
      this.$store.dispatch('catalog/fetchDatasets', {
        category: this.$refs.dropdownCategories.selected,
        country
      })
      window.scroll({ top: 0, left: 0 });
    },
    resetDatasets () {
      this.$refs.dropdownCountries.resetInput();
      this.$refs.dropdownCountries.closeDropdown();
      this.dropdownCountriesDisabled = true;
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.catalog {
  min-height: 640px;
  margin-top: 64px;

  &__filter {
    justify-content: space-between;
    height: 168px;

    &--dropdown {
      position: relative;
    }
  }
}

.full-width {
  width: 100%;
}
</style>
