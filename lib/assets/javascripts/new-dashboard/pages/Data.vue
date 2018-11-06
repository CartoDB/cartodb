<template>
  <section class="section">
    <div class="container grid">
     <div class="grid-cell grid-cell--col12">
      <SectionTitle title='Your Data' description="This is a description test">
        <template slot="icon">
          <img src="../assets/icons/section-title/data.svg" />
        </template>
        <template slot="actionButton">
          <CreateButton visualizationType="dataset">New Dataset</CreateButton>
        </template>
      </SectionTitle>
     </div>

    <ul v-if="isFetchingDatasets">
      <li v-for="n in 12" :key="n">
        Loading
      </li>
    </ul>

    <ul v-if="!isFetchingDatasets">
      <li v-for="dataset in datasets" :key="dataset.id">
        <span>{{dataset.name}}</span>
        <span>FAV: {{ dataset.liked }} - </span>
        <span>Last Modified: {{dataset.updated_at }} - </span>
        <span>Rows: {{dataset.table.row_count }} - </span>
        <span>Size: {{ dataset.table.size }} - </span>
        <span>Privacy: {{dataset.table.privacy }} - </span>
        <span>Geometry Types: {{ dataset.table.geometry_types }}</span>
      </li>
    </ul>
    </div>

    <Pagination v-if="!isFetchingDatasets" :page=currentPage :numPages=numPages @pageChange="goToPage"></Pagination>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import Pagination from 'new-dashboard/components/Pagination';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import CreateButton from 'new-dashboard/components/CreateButton.vue';
import { isAllowed } from '../core/filters';

export default {
  name: 'DataPage',
  components: {
    SectionTitle,
    CreateButton,
    Pagination
  },
  beforeRouteUpdate (to, from, next) {
    const urlOptions = { ...to.params, ...to.query };

    if (urlOptions.filter && !isAllowed(urlOptions.filter)) {
      return next({ name: 'datasets' });
    }

    this.$store.dispatch('datasets/setURLOptions', urlOptions);
    next();
  },
  computed: {
    ...mapState({
      numPages: state => state.datasets.numPages,
      currentPage: state => state.datasets.page,
      appliedFilter: state => state.datasets.filterType,
      appliedOrder: state => state.datasets.order,
      datasets: state => state.datasets.list,
      datasetsMetadata: state => state.datasets.metadata,
      isFetchingDatasets: state => state.datasets.isFetching
    }),
    pageTitle () {
      return this.$t(`DataPage.header.title['${this.appliedFilter}']`);
    }
  },
  methods: {
    goToPage (page) {
      window.scroll({ top: 0, left: 0 });
      this.$router.push({
        name: 'datasets',
        params: this.$route.params,
        query: {...this.$route.query, page}
      });
    },
    applyFilter (filter) {
      this.$router.push({ name: 'maps', params: { filter } });
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
</style>
