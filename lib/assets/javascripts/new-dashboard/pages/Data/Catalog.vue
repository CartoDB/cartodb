<template>
  <section class="catalog">
    <div class="container grid">
      <div class="full-width">
        <SectionTitle class="grid-cell" :description="$t('CatalogPage.description')">
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
      <div class="grid-cell grid-cell--col6 catalog__filter--dropdown">
        <CatalogDropdown ref="dropdownCategories"
          :title="$t('CatalogDropdown.category.title')"
          :placeholderActive="$t('CatalogDropdown.category.placeholderActive')"
          :placeholderInactive="$t('CatalogDropdown.category.placeholderInactive')"
          :options="categories"
          :disabled="true"
          :limitHeight="true"
          @selected="getCountries"
          @reset="resetCategory">
          <template slot="extra">
            <span v-html="$t('CatalogDropdown.category.extra')" class="text is-small"></span>
          </template>
        </CatalogDropdown>
      </div>
      <div class="grid-cell grid-cell--col6 catalog__filter--dropdown">
        <CatalogDropdown ref="dropdownCountries"
          :title="$t('CatalogDropdown.country.title')"
          :placeholderActive="$t('CatalogDropdown.country.placeholderActive')"
          :placeholderInactive="$t('CatalogDropdown.country.placeholderInactive')"
          :options="countries"
          :disabled="true"
          :limitHeight="true"
          @open="false"
          @selected="getDatasets"
          @reset="resetCountry">
          <template slot="extra">
            <span v-html="$t('CatalogDropdown.country.extra')" class="text is-small"></span>
          </template>
        </CatalogDropdown>
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
import sendCustomEvent from 'new-dashboard/utils/send-custom-event';
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
    sendCustomEvent('catalogSelectCategory', {
      catalogSelectedCategory: to.query.category
    });
    sendCustomEvent('catalogSelectCountry', {
      catalogSelectedCountry: to.query.country
    });
    next();
  },
  mounted () {
    const category = this.$route.query.category;
    const country = this.$route.query.country;
    if (category && country) {
      this.setUrlOptions();
    } else {
      this.getCategories();
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
      numResults: state => state.catalog.umResults,
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
    getCategories () {
      this.clearList();
      this.$store.dispatch('catalog/fetchCategories')
        .then(
          () => {
            this.$refs.dropdownCategories.enableDropdown();
            this.$refs.dropdownCategories.openDropdown();
          },
          (err) => {
            this.$refs.dropdownCategories.enableDropdown();
            this.$refs.dropdownCategories.setError(err);
          }
        );
    },
    getCountries (category) {
      this.clearList();
      this.$store.dispatch('catalog/fetchCountries', category)
        .then(
          () => {
            this.$refs.dropdownCountries.clearInput();
            this.$refs.dropdownCountries.enableDropdown();
            window.scroll({ top: 0, left: 0 });
          },
          (err) => {
            this.$refs.dropdownCountries.enableDropdown();
            this.$refs.dropdownCountries.setError(err);
          }
        );
    },
    getDatasets (country) {
      this.$store.dispatch('catalog/fetchDatasets', {
        category: this.$refs.dropdownCategories.selected,
        country
      }).then(
        () => {
          this.$router.push({
            name: 'catalog',
            query: {
              category: this.$refs.dropdownCategories.selected,
              country
            }
          });
          window.scroll({ top: 0, left: 0 });
        },
        (err) => {
          this.$refs.dropdownCategories.setError(err);
          this.$refs.dropdownCountries.setError(err);
        }
      );
    },
    resetCategory () {
      this.$refs.dropdownCountries.clearInput();
      this.$refs.dropdownCountries.disableDropdown();
      this.clearList();
    },
    resetCountry () {
      this.clearList();
    },
    clearList () {
      this.$store.dispatch('catalog/clearList');
    },
    setUrlOptions () {
      const category = this.$route.query.category;
      const country = this.$route.query.country;
      const promiseDatasets = this.$store.dispatch('catalog/fetchDatasets', {
        category: category,
        country: country
      });
      const promiseCategories = this.$store.dispatch('catalog/fetchCategories');
      const promiseCountires = this.$store.dispatch('catalog/fetchCountries', category);
      Promise.all([promiseDatasets, promiseCategories, promiseCountires])
        .then(
          () => {
            if (this.datasets.length > 0) {
              this.$refs.dropdownCategories.setInput(category);
              this.$refs.dropdownCountries.setInput(country);
            } else {
              this.getCategories();
              this.$router.push({ name: 'catalog' });
            }
          },
          () => {
            this.$router.push({ name: 'catalog' });
          }
        );
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
