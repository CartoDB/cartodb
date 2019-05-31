<template>
  <QuotaContainer :title="title" :perMonth="perMonth">
    <QuotaWidget :name="$t(`QuotaSection.storage`)"
      :usedQuota="getAmountInUnit(usedStorage, amountExponent)"
      :availableQuota="getAmountInUnit(availableStorage, amountExponent)"
      :unit="getUnit(amountExponent)"
      :formatToLocale="false"
      :helpLink="storageHelpLink"
      ></QuotaWidget>

    <QuotaWidget v-if="hasTableLimits" :name="$t(`QuotaSection.publicMaps`)"
      :usedQuota="usedPublicMaps"
      :availableQuota="availablePublicMaps"
      helpLink=""
      ></QuotaWidget>
    <QuotaWidget v-if="hasPublicMapLimits" :name="$t(`QuotaSection.datasets`)"
      :usedQuota="usedDatasets"
      :availableQuota="availableDatasets"
      helpLink=""
      ></QuotaWidget>
    <QuotaWidget v-if="hasApiKeysLimits" :name="$t(`QuotaSection.apiKeys`)"
      :usedQuota="usedApiKeys"
      :availableQuota="availableApiKeys"
      helpLink=""
      ></QuotaWidget>
  </QuotaContainer>
</template>

<script>
import { mapState } from 'vuex';
import QuotaWidget from './QuotaWidget';
import QuotaContainer from './QuotaContainer';
import CartoNode from 'carto-node';
import apiKeysCollectionTypes from 'dashboard/data/api-keys-collection-types';

const limitsUsers = ['Professional', '[DEDICATED]'];

export default {
  name: 'AccountQuota',
  components: {
    QuotaWidget,
    QuotaContainer
  },
  props: {
    title: String,
    perMonth: Boolean
  },
  beforeMount () {
    this.getApiKeysTotal();
  },
  data () {
    return {
      client: new CartoNode.AuthenticatedClient(),
      usedApiKeys: 0
    };
  },
  computed: {
    ...mapState({
      availableStorage: state => state.user.quota_in_bytes,
      remainingStorage: state => state.user.remaining_byte_quota,
      availablePublicMaps: state => state.user.public_map_quota,
      linkMapsTotal: state => state.user.link_privacy_map_count,
      passwordMapsTotal: state => state.user.password_privacy_map_count,
      publicMapsTotal: state => state.user.public_privacy_map_count,
      availableDatasets: state => state.user.table_quota,
      usedDatasets: state => state.user.table_count,
      availableApiKeys: state => state.user.regular_api_key_quota,
      planAccountType: state => state.user.account_type
    }),
    usedStorage () {
      return this.availableStorage - this.remainingStorage;
    },
    amountExponent () {
      return this.getExpBaseTwo(this.availableStorage) - 10;
    },
    storageHelpLink () {
      return 'https://carto.com/help/your-account/your-disk-storage/';
    },
    hasTableLimits() {
      return limitsUsers.includes(this.planAccountType);
    },
    hasPublicMapLimits() {
      return limitsUsers.includes(this.planAccountType);
    },
    hasApiKeysLimits() {
      return limitsUsers.includes(this.planAccountType);
    },
    usedPublicMaps () {
      return this.linkMapsTotal + this.passwordMapsTotal + this.publicMapsTotal;
    }
  },
  methods: {
    getExpBaseTwo (sizeInBytes) {
      if (sizeInBytes === 0) {
        return 0;
      }

      let exponent = 0;
      if (Math.log2) {
        exponent = Math.log2(sizeInBytes);
      } else {
        exponent = Math.log(sizeInBytes) * Math.LOG2E;
      }

      return Math.round(exponent / 10) * 10;
    },
    getUnit (exponent) {
      if (exponent < 10) {
        return 'B';
      } else if (exponent < 20) {
        return 'KB';
      } else if (exponent < 30) {
        return 'MB';
      } else if (exponent < 40) {
        return 'GB';
      } else if (exponent < 50) {
        return 'TB';
      } else if (exponent < 60) {
        return 'PB';
      } else if (exponent < 70) {
        return 'EB';
      } else {
        return '?';
      }
    },
    getAmountInUnit (number, exponent) {
      return number / Math.pow(2, exponent);
    },
    getApiKeysTotal () {
      this.client.getApiKeys(apiKeysCollectionTypes.REGULAR,

        (err, _, data) => {
          if (err) {
            return;
          }
          this.usedApiKeys = data.count;
        }
      );
    }
  }
}
</script>
