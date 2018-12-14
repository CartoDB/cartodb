<template>
  <section>
    <div class="grid-cell--noMargin grid-cell--col12">
      <DatasetListHeader :order="appliedOrder" :orderDirection="appliedOrderDirection" @changeOrder="applyOrder"></DatasetListHeader>
    </div>

    <ul class="grid-cell--col12" v-if="!isFetchingDatasets">
      <li v-for="dataset in datasets" :key="dataset.id" class="dataset-item">
        <DatasetCard :dataset="dataset" :canHover="false"></DatasetCard>
      </li>
    </ul>
  </section>
</template>

<script>
import DatasetCard from 'new-dashboard/components/Dataset/DatasetCard';
import DatasetListHeader from 'new-dashboard/components/Dataset/DatasetListHeader';

export default {
  name: 'DatasetsList',
  props: {
    datasets: Object,
    appliedOrder: String,
    appliedOrderDirection: String,
    isFetchingDatasets: Boolean
  },
  components: {
    DatasetCard,
    DatasetListHeader
  },
  methods: {
    applyOrder (orderOptions) {
      this.$emit('applyOrder', orderOptions);
    }
  }
};
</script>

<style scoped lang="scss">
@import "stylesheets/new-dashboard/variables";

.dataset-item {
  &:not(:last-child) {
    border-bottom: 1px solid $light-grey;
  }
}
</style>
