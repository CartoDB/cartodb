<template>
  <div>
    <ul class="" v-if="!isFetchingDatasets">
      <li v-for="dataset in datasets" :key="dataset.id" class="u-mt--12">
        <DatasetCard
          :dataset="dataset"
          @click.native="toggleDatasetSelection(dataset.id)"
          :isSelected="selectedDataset[dataset.id]"
        ></DatasetCard>
      </li>
    </ul>
    <ul v-else>
      <li v-for="n in 3" :key="n" class="u-mt--12">
        <DatasetCardFake></DatasetCardFake>
      </li>
    </ul>

    <div v-if="!isFetchingDatasets">
      <Pagination v-if="numberPages > 1" :page=currentPage :numPages=numberPages @pageChange="goToPage"></Pagination>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import DatasetCard from 'new-dashboard/components/Connector/DatasetCard';
import DatasetCardFake from 'new-dashboard/components/Dataset/DatasetCardFake';
import Pagination from 'new-dashboard/components/Pagination';

export default {
  name: 'DatasetListForConnectors',
  props: {
    sharedTab: Boolean
  },
  components: {
    DatasetCard,
    DatasetCardFake,
    Pagination
  },
  data: () => {
    return {
      selectedDataset: {},
      currentPage: 1,
      elemsPerPage: 20
    };
  },
  mounted: function () {
    this.updateDatasetFilter();
  },
  computed: {
    ...mapState({
      datasets: state => state.datasets.list,
      isFetchingDatasets: state => state.datasets.isFetching,
      datasetsMetadata: state => state.datasets.metadata
    }),
    numberPages () {
      return Math.ceil(this.datasetsMetadata.total_user_entries / this.elemsPerPage);
    }
  },
  methods: {
    toggleDatasetSelection (datasetId) {
      let newSelection = {...this.selectedDataset};
      newSelection[datasetId] = !newSelection[datasetId];
      this.selectedDataset = newSelection;
      this.$emit('datasetSelected', {...newSelection});
    },
    goToPage (newPage) {
      this.currentPage = newPage;
      this.updateDatasetFilter();
    },
    updateDatasetFilter () {
      let urlOptions = {
        page: this.currentPage,
        per_page: this.elemsPerPage,
        filter: this.sharedTab ? 'shared' : 'mine'
      };
      this.$store.dispatch('datasets/setURLOptions', urlOptions);
    }
  },
  watch: {
    sharedTab: function () {
      this.currentPage = 1;
      this.updateDatasetFilter();
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
</style>
