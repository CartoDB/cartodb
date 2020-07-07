<template>
  <div class="dataset-listItem-extra-container u-flex u-flex__direction--column u-pt--12 u-pl--24 u-pb--24">
    <SubscriptionStatus></SubscriptionStatus>
    <div class="u-ml--16">
      <div class="is-caption u-mt--12 is-small"><span class="is-txtSoftGrey">{{$t('Subscriptions.datasetSize')}}</span> <span>123.5 MB</span></div>
      <div class="u-flex u-flex__direction--column u-mt--28">
        <div class="u-flex u-flex__align--center">
          <a class="is-caption" href="#">{{$t('BulkActions.datasets.createMap')}}</a>  <span class="u-ml--8 u-mr--8">|</span>
          <a class="is-caption" href="#">{{$t('BulkActions.datasets.viewDataset')}}</a>
        </div>
        <a class="is-caption u-mt--12" href="#">{{$t('Subscriptions.exploreNotebook')}}</a>
      </div>
      <div class="u-mt--24 u-flex u-flex__align--center">
        <span class="is-txtSoftGrey is-small">{{$t('Subscriptions.slugId')}}</span>
        <input type="text" readonly value="sp123dc6u_hmob_con awd adad adadw wad">
        <button type="button" class="button-copy">
          <img svg-inline src="../../assets/icons/subscriptions/copy.svg">
        </button>
      </div>
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
  .button-copy {
    width: 32px;
    height: 32px;
    background-color: $neutral--100;
    border: solid 1px $neutral--400;
    border-radius: 4px;
  }
}
</style>
