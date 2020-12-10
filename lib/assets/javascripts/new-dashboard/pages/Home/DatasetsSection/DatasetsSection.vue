<template>
  <section>
    <DatasetsList
      :hasBulkActions="false"
      :canHoverCard="false"
      :maxVisibleDatasets="maxVisibleDatasets"
      @applyFilter="applyFilter"
      @applyOrder="applyOrder"
      @contentChanged="onContentChanged"
      @newDatesetClicked="onNewDatesetClicked"
      />

    <router-link :to="{ name: 'datasets' }" class="title is-small viewall-link" v-if="showViewAllLink">
      {{ datasetsLinkText }}
    </router-link>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import DatasetsList from 'new-dashboard/components/DatasetsList.vue';

export default {
  name: 'DatasetsSection',
  components: {
    DatasetsList
  },
  data () {
    return {
      maxVisibleDatasets: 6
    };
  },
  computed: {
    ...mapState({
      isFetchingDatasets: state => state.datasets.isFetching,
      currentEntriesCount: state => state.datasets.metadata.total_entries
    }),
    datasetsLinkText () {
      return this.$t('HomePage.DatasetsSection.viewAll');
    },
    showViewAllLink () {
      return !this.isFetchingDatasets && this.currentEntriesCount;
    }
  },
  methods: {
    applyOrder (orderOptions) {
      this.$store.dispatch('datasets/order', orderOptions);
      this.$store.dispatch('datasets/fetch');
    },
    applyFilter (filter) {
      this.$store.dispatch('datasets/filter', filter);
      this.$store.dispatch('datasets/fetch');
    },
    fetchDatasets () {
      this.$store.dispatch('datasets/fetch');
    },
    onContentChanged (type) {
      this.$emit('contentChanged', type);
    },
    onNewDatesetClicked () {
      this.$emit('newDatesetClicked');
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.full-width {
  width: 100%;
}

.viewall-link {
  display: block;
  margin-top: 64px;
  letter-spacing: 1px;
  text-align: center;
  text-transform: uppercase;
}
</style>
