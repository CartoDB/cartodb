<template>
  <div class="dataset-listItem-extra-container u-flex u-flex__direction--column u-pt--12 u-pl--24 u-pb--24">
    <SubscriptionStatus :status="dataset.status" :expiresDate="dataset.expires_at" ></SubscriptionStatus>
    <div class="u-ml--16">
      <div class="is-caption u-mt--12 is-small"><span class="is-txtSoftGrey">{{$t('Subscriptions.datasetSize')}}</span> <span>{{dataset.estimated_size}} MB</span></div>
      <div v-if="dataset.sync_status !== 'syncing'" class="u-flex u-flex__direction--column u-mt--28">
        <div class="u-flex u-flex__align--center">
          <button v-if="dataset.sync_status === 'synced'" type="button" class="u-mr--8 u-flex u-flex__align--center u-flex__justify--center connect">
            <img src="../../assets/icons/subscriptions/connect.svg">
          </button>
          <button v-else-if="dataset.sync_status === 'unsynced' && (!dataset.unsynced_errors || dataset.unsynced_errors === '')" type="button" class="u-mr--8 u-flex u-flex__align--center u-flex__justify--center unconnect">
            <img src="../../assets/icons/subscriptions/unconnect.svg">
          </button>
          <button v-else-if="dataset.sync_status === 'unsynced'" type="button" class="u-mr--8">
            <img src="../../assets/icons/subscriptions/information-circle.svg">
          </button>
          <button v-else-if="dataset.sync_status === 'unsyncable'" type="button" class="u-mr--8">
            <img src="../../assets/icons/subscriptions/alert-triangle.svg">
          </button>
          <a class="is-caption" :href="`${user.base_url}/dashboard/datasets/?id=${dataset.sync_table}&create=true`">{{$t('BulkActions.datasets.createMap')}}</a>  <span class="u-ml--8 u-mr--8">|</span>
          <a class="is-caption" :href="`${user.base_url}/dataset/${dataset.sync_table}`">{{$t('BulkActions.datasets.viewDataset')}}</a>
        </div>
        <a class="is-caption u-mt--12" href="#">{{$t('Subscriptions.exploreNotebook')}}</a>
      </div>
      <div v-if="dataset.sync_status === 'syncing'" class="u-mt--28 u-flex u-flex__align--center">
        <span class="loading u-mr--12">
          <img svg-inline src="../../assets/icons/common/loading.svg" class="loading__svg"/>
        </span>
        <span class="text is-txtSoftGrey is-caption">
          Connecting dataset…
        </span>
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
  flex: 0 0 306px;
  .copy-section {
    span {
      white-space: nowrap;
    }
    input[type="text"] {
      flex: 0 0 166px;
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
      flex: 0 0 32px;
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

  .connect, .unconnect {
    border-radius: 2px;
    width: 24px;
    height: 24px;
  }
  .connect {
    background-color: $blue--500;
  }
  .unconnect {
    border: 1px solid $blue--500;
  }
  .loading {
    &__svg {
      width: 16px;
      stroke: $blue--500;
      g {
        stroke-width: 2px;
        circle {
          stroke:#36434A;
          stroke-opacity: 0.25;
        }
      }
    }
  }
}
</style>
