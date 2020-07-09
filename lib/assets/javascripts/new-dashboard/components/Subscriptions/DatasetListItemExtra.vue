<template>
  <div class="dataset-listItem-extra-container u-flex u-flex__direction--column u-pt--12 u-pl--24 u-pb--24">
    <SubscriptionStatus></SubscriptionStatus>
    <div class="is-caption u-mt--12"><span class="is-txtSoftGrey">{{$t('Subscriptions.datasetSize')}}</span> <span>123.5 MB</span></div>
    <div class="u-flex u-flex__direction--column u-mt--28">
      <div class="u-flex u-flex__align--center">
        <a class="is-caption" href="#">{{$t('BulkActions.datasets.createMap')}}</a>  <span class="u-ml--8 u-mr--8">|</span>
        <a class="is-caption" href="#">{{$t('BulkActions.datasets.viewDataset')}}</a>
      </div>
      <a class="is-caption u-mt--12" href="#">{{$t('Subscriptions.exploreNotebook')}}</a>
    </div>
  </div>
</template>

<script>

import SubscriptionStatus from './SubscriptionStatus';

export default {
  name: 'DatasetListItemExtra',
  components: {
    SubscriptionStatus
  },
  props: {},
  data: function () {
    return {};
  },
  computed: {},
  methods: {}
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';
.dataset-listItem-extra-container {
  flex: 0 0 282px;
}
</style>
