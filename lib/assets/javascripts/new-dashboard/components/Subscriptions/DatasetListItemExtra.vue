<template>
  <div class="dataset-listItem-extra-container u-flex u-flex__direction--column u-pt--12 u-pl--24 u-pb--24">
    <SubscriptionStatus :status="dataset.status" :expiresDate="dataset.expires_at" ></SubscriptionStatus>
    <div class="u-ml--16">
      <div class="is-caption u-mt--12 is-small"><span class="is-txtSoftGrey">{{$t('Subscriptions.datasetSize')}}</span> <span>0.0 MB</span></div>
      <div class="u-flex u-flex__direction--column u-mt--28">
        <div class="u-flex u-flex__align--center">
          <a class="is-caption" :href="`${user.base_url}/dashboard/datasets/?id=${dataset.sync_table}&create=true`">{{$t('BulkActions.datasets.createMap')}}</a>  <span class="u-ml--8 u-mr--8">|</span>
          <a class="is-caption" :href="`${user.base_url}/dataset/${dataset.sync_table}`">{{$t('BulkActions.datasets.viewDataset')}}</a>
        </div>
        <a class="is-caption u-mt--12" href="#">{{$t('Subscriptions.exploreNotebook')}}</a>
      </div>
      <div class="u-mt--24 u-flex u-flex__align--center copy-section">
        <span class="is-txtSoftGrey is-small">{{$t('Subscriptions.slugId')}}</span>
        <input ref="inputCopy" class="u-ml--12 is-small" type="text" readonly :value="dataset.slug">
        <button type="button" class="u-flex u-flex__align--center u-flex__justify--center" @click="copy">
          <img svg-inline src="../../assets/icons/subscriptions/copy.svg">
        </button>
      </div>
    </div>
  </div>
</template>

<script>

import { mapState } from 'vuex';
import SubscriptionStatus from './SubscriptionStatus';

export default {
  name: 'DatasetListItemExtra',
  components: {
    SubscriptionStatus
  },
  props: {
    dataset: {
      type: Object
    }
  },
  data: function () {
    return {};
  },
  computed: {
    ...mapState({
      user: state => state.user
    })
  },
  methods: {
    copy () {
      this.$refs.inputCopy.select();
      document.execCommand('copy');
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';
.dataset-listItem-extra-container {
  flex: 0 0 282px;
  .copy-section {
    span {
      white-space: nowrap;
    }
    input[type="text"] {
      border: solid 1px $neutral--400;
      border-radius: 4px;
      padding: 0 12px;
      height: 32px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
    button {
      width: 32px;
      height: 32px;
      background-color: $neutral--100;
      border: solid 1px $neutral--400;
      border-radius: 4px;
      border-left: none;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      outline: none;
      > svg {
        outline: none;
      }
    }
  }
}
</style>
