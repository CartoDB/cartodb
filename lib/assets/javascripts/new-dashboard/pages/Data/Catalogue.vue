<template>
  <section class="catalogue">
    <div class="container grid">
      <div class="full-width">
        <SectionTitle class="grid-cell">
          <template slot="icon">
            <img src="../../assets/icons/section-title/catalogue.svg" width="18" height="20" />
          </template>
          <template slot="title">
              <span>{{ $t('CataloguePage.header') }}</span>
          </template>
        </SectionTitle>
      </div>
    </div>

    <div class="catalogue__filter container grid" action="">
      <div class="grid-cell grid-cell--col6 catalogue__filter--dropdown">
        <CatalogueDropdown ref="dropdownCategories"
          :title="$t('CatalogueDropdown.category.title')"
          :placeholder="$t('CatalogueDropdown.category.placeholder')"
          :options="categories"
          :disabled="true"
          @selected="getCountries"
          @reset="resetCategory">
          <template slot="extra">
            <span v-html="$t('CatalogueDropdown.category.extra')" class="text is-small"></span>
          </template>
        </CatalogueDropdown>
      </div>
      <div class="grid-cell grid-cell--col6 catalogue__filter--dropdown">
        <CatalogueDropdown ref="dropdownCountries"
          :title="$t('CatalogueDropdown.country.title')"
          :placeholder="$t('CatalogueDropdown.country.placeholder')"
          :options="countries"
          :disabled="true"
          :limitHeight="true"
          @open="false"
          @selected="getDatasets"
          @reset="resetCountry">
          <template slot="extra">
            <span v-html="$t('CatalogueDropdown.country.extra')" class="text is-small"></span>
          </template>
        </CatalogueDropdown>
      </div>
    </div>

    <!-- Datasets list -->
    <div class="container grid"  v-if="datasets.length > 0">
      <div class="grid-cell grid-cell--col12">
        <CatalogueListHeader :order="appliedOrder" :orderDirection="appliedOrderDirection" @changeOrder="applyOrder"></CatalogueListHeader>
        <ul v-if="!isFetchingDatasets" >
          <li v-for="(dataset) in currentPageDatasets" :key="dataset.id">
            <CatalogueCard :dataset="dataset"></CatalogueCard>
          </li>
        </ul>

        <ul v-else>
          <li v-for="(n) in resultsPerPage" :key="n">
            <CatalogueFakeCard />
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
import CatalogueListHeader from 'new-dashboard/components/Catalogue/CatalogueListHeader';
import CatalogueCard from 'new-dashboard/components/Catalogue/CatalogueCard';
import CatalogueFakeCard from 'new-dashboard/components/Catalogue/CatalogueFakeCard';
import CatalogueDropdown from 'new-dashboard/components/Catalogue/CatalogueDropdown';
import Pagination from 'new-dashboard/components/Pagination';

export default {
  name: 'CataloguePage',
  components: {
    SectionTitle,
    CatalogueListHeader,
    CatalogueCard,
    CatalogueFakeCard,
    CatalogueDropdown,
    Pagination
  },
  beforeRouteUpdate (to, from, next) {
    sendCustomEvent('catalogueSelectCategory', {
      catalogueSelectedCategory: to.query.category
    });
    sendCustomEvent('catalogueSelectCountry', {
      catalogueSelectedCountry: to.query.country
    });
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
      numPages: state => state.catalogue.numPages,
      currentPage: state => state.catalogue.page,
      datasets: state => state.catalogue.list,
      categories: state => state.catalogue.categories,
      countries: state => state.catalogue.countries,
      isFetchingDatasets: state => state.catalogue.isFetching,
      numResults: state => state.catalogue.umResults,
      resultsPerPage: state => state.catalogue.resultsPerPage,
      appliedOrder: state => state.catalogue.order,
      appliedOrderDirection: state => state.catalogue.orderDirection
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
        name: 'catalogue',
        params: this.$route.params,
        query: { ...this.$route.query, page }
      });
    },
    applyOrder (orderParams) {
      this.$router.push({
        name: 'catalogue',
        params: this.$route.params,
        query: {
          ...this.$route.query,
          page: 1,
          order: orderParams.order,
          order_direction: orderParams.direction
        }
      });
      this.$store.dispatch('catalogue/order', orderParams);
    },
    getCategories () {
      this.clearList();
      this.$store.dispatch('catalogue/fetchCategories')
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
      this.$store.dispatch('catalogue/fetchCountries', category)
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
      this.$store.dispatch('catalogue/fetchDatasets', {
        category: this.$refs.dropdownCategories.selected,
        country
      }).then(()=> {
        this.$router.push({
          name: 'catalogue',
          query: {
            category: this.$refs.dropdownCategories.selected,
            country
          }
        });
        window.scroll({ top: 0, left: 0 });
      })
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
      this.$store.dispatch('catalogue/clearList');
    },
    setUrlOptions () {
      const category = this.$route.query.category;
      const country = this.$route.query.country;
      const promiseDatasets = this.$store.dispatch('catalogue/fetchDatasets', {
        category: category,
        country: country
      });
      const promiseCategories = this.$store.dispatch('catalogue/fetchCategories');
      const promiseCountires = this.$store.dispatch('catalogue/fetchCountries', category);
      Promise.all([promiseDatasets, promiseCategories, promiseCountires])
        .then(
          () => {
            if (this.datasets.length > 0) {
              this.$refs.dropdownCategories.setInput(category);
              this.$refs.dropdownCountries.setInput(country);
            } else {
              this.getCategories();
              this.$router.push({ name: 'catalogue'});
            }
          },
          () => {
            this.$router.push({ name: 'catalogue'});
          }
        );
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.catalogue {
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
