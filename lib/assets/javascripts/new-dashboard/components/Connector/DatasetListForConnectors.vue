<template>
  <div>
    <div v-if="!!queryFilter && !isFetchingDatasets" class="u-mb--16 is-small is-txtMainTextColor is-semibold">
      {{ $tc('SearchPage.title.searchResults', datasetsMetadata.total_entries) }}
    </div>
    <ul class="" v-if="!isFetchingDatasets && !isEmpty">
      <li v-for="dataset in datasets" :key="dataset.id" class="u-mt--12">
        <DatasetCard
          :dataset="dataset"
          @click.native="toggleDatasetSelection(dataset.id)"
          :isSelected="selectedDataset[dataset.id]"
        ></DatasetCard>
      </li>
    </ul>
    <ul v-else-if="isFetchingDatasets">
      <li v-for="n in 3" :key="n" class="u-mt--12">
        <DatasetCardFake></DatasetCardFake>
      </li>
    </ul>
    <div v-else-if="isEmpty" class="centered-text">
      <template v-if="!queryFilter">
        <img svg-inline src="../../assets/icons/datasets/add-dataset.svg"/>
        <h4 class="text is-caption u-mt--16">{{ $t('NewMapDatasetCard.zeroCase.title') }}</h4>
        <p class="text is-small u-mt--4"><span class="fake-link" @click="toConnectTab()">{{ $t('NewMapDatasetCard.zeroCase.actionName') }}</span> {{ $t('NewMapDatasetCard.zeroCase.actionDescription') }}</p>
      </template>
    </div>

    <div v-if="!isFetchingDatasets && !isEmpty">
      <Pagination v-if="numberPages > 1" :page=currentPage :numPages=numberPages @pageChange="goToPage"></Pagination>
    </div>
  </div>
</template>

<script>
import _ from 'underscore';
import { mapState } from 'vuex';
import DatasetCard from 'new-dashboard/components/Connector/DatasetCard';
import DatasetCardFake from 'new-dashboard/components/Dataset/DatasetCardFake';
import Pagination from 'new-dashboard/components/Pagination';

export default {
  name: 'DatasetListForConnectors',
  props: {
    shared: {
      default: 'mine'
    },
    queryFilter: String,
    multiSelect: {
      default: true
    }
  },
  components: {
    DatasetCard,
    DatasetCardFake,
    Pagination
  },
  data () {
    return {
      selectedDataset: {},
      currentPage: 1,
      elemsPerPage: 20,
      debounceUpdateDatasetFilter: _.debounce(this.updateDatasetFilter, 500)
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
      return Math.ceil(this.datasetsMetadata.total_entries / this.elemsPerPage);
    },
    isEmpty () {
      const length = Object.keys(this.datasets).length;
      return (length === 0);
    }
  },
  methods: {
    toggleDatasetSelection (datasetId) {
      let newSelection = this.multiSelect ? { ...this.selectedDataset } : {};
      newSelection[datasetId] = !newSelection[datasetId];
      this.selectedDataset = newSelection;
      this.$emit(
        'datasetSelected',
        Object.keys(this.selectedDataset)
          .filter(key => this.selectedDataset[key])
          .map(key => this.datasets[key])
      );
    },
    goToPage (newPage) {
      this.currentPage = newPage;
      this.updateDatasetFilter();
    },
    updateDatasetFilter () {
      let urlOptions = {
        page: this.currentPage,
        per_page: this.elemsPerPage,
        filter: this.shared,
        ...(this.queryFilter ? { q: this.queryFilter } : {})
      };
      this.$store.dispatch('datasets/setURLOptions', urlOptions);
    },
    toConnectTab () {
      this.$emit('goToConnectTab');
    }
  },
  watch: {
    shared: function () {
      this.currentPage = 1;
      this.debounceUpdateDatasetFilter();
    },
    queryFilter: function () {
      this.currentPage = 1;
      this.debounceUpdateDatasetFilter();
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.centered-text {
  text-align: center;
}

.fake-link {
  color: $link__color;
  cursor: pointer;
}
</style>
