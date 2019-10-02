<template>
  <section class="lds-section">
    <div class="container grid lds-title">
      <div class="grid-cell grid-cell--col8">
        <SectionTitle class="grid-cell">
          <template slot="icon">
            <img src="../../assets/icons/section-title/lds.svg" width="16" height="20" />
          </template>
          <template slot="title">
              <span>{{ $t('LDSPage.header.title') }}</span>
          </template>
        </SectionTitle>
        <h3 class="text is-body">{{ $t('LDSPage.header.desc') }}</h3>
      </div>
    </div>
    <div class="container grid">
      <div class="grid-cell grid-cell--col12">
        <LDSListHeader :order="appliedOrder" :orderDirection="appliedOrderDirection" @changeOrder="applyOrder"></LDSListHeader>
        <ul v-if="!isFetchingDatasets" >
          <li v-for="(dataset) in currentPageDatasets" :key="dataset.id">
            <LDSCard :dataset="dataset"></LDSCard>
          </li>
        </ul>

        <ul v-else>
          <li v-for="(n) in resultsPerPage" :key="n">
            <LDSFakeCard />
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
import LDSListHeader from 'new-dashboard/components/LDS/LDSListHeader';
import LDSCard from 'new-dashboard/components/LDS/LDSCard';
import LDSFakeCard from 'new-dashboard/components/LDS/LDSFakeCard';
import Pagination from 'new-dashboard/components/Pagination';

export default {
  name: 'LDSPage',
  components: {
    SectionTitle,
    LDSListHeader,
    LDSCard,
    LDSFakeCard,
    Pagination
  },
  beforeRouteUpdate (to, from, next) {
    checkFilters('location_data_streams', 'lds', to, from, next);
  },
  beforeMount () {
    this.$store.dispatch('lds/fetch');
  },
  computed: {
    ...mapState({
      numPages: state => state.lds.numPages,
      currentPage: state => state.lds.page,
      datasets: state => state.lds.list,
      isFetchingDatasets: state => state.lds.isFetching,
      numResults: state => state.lds.numResults,
      resultsPerPage: state => state.lds.resultsPerPage,
      appliedOrder: state => state.lds.order,
      appliedOrderDirection: state => state.lds.orderDirection

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
        name: 'location_data_streams',
        params: this.$route.params,
        query: { ...this.$route.query, page }
      });
    },
    applyOrder (orderParams) {
      this.$router.push({
        name: 'location_data_streams',
        params: this.$route.params,
        query: {
          ...this.$route.query,
          page: 1,
          order: orderParams.order,
          order_direction: orderParams.direction
        }
      });
      this.$store.dispatch('lds/order', orderParams);
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.lds-section {
  margin-top: 64px;
}

.lds-title {
  margin-bottom: 40px;
}
</style>
