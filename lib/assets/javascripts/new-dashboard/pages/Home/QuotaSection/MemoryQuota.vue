<template>
  <QuotaContainer :title="$t(`QuotaSection.memory`)" :perMonth="false">
    <StackedQuotaWidget
      :name="$t(`QuotaSection.yourPlan`)"
      :usedQuota="usedStorage"
      :availableQuota="getAmountInUnit(quotaInBytes)"
      :unit="getUnit(quotaInBytes)"
      :formatToLocale="false"
      :helpLink="storageHelpLink"/>
    <StackedQuotaWidget
      :name="$t(`QuotaSection.addOns`)"
      :usedQuota="usedPremiumDataSubscriptions"
      :unit="getUnit(subscriptionsPremiumSizeInBytes)"
      :formatToLocale="false"
      :helpLink="storageHelpLink" unlimited/>
  </QuotaContainer>
</template>

<script>
import { mapState } from 'vuex';
import QuotaWidget from './QuotaWidget';
import QuotaContainer from './QuotaContainer';
import StackedQuotaWidget from './StackedQuotaWidget';
import { getAmountInUnit, getUnit, getExpBaseTwo } from 'new-dashboard/utils/storage-utils';

const DATA_SUBSCRIPTIONS_COLOR = '#2e51e8';
const DATASETS_COLOR = '#11a2b8';

export default {
  name: 'MemoryQuota',
  components: {
    StackedQuotaWidget,
    QuotaWidget,
    QuotaContainer
  },
  data () {
    return {
      usedApiKeys: 0
    };
  },
  computed: {
    ...mapState({
      quotaInBytes: state => state.user.storage.quota_in_bytes,
      dbSizeInBytes: state => state.user.storage.db_size_in_bytes,
      subscriptionsPublicSizeInBytes: state => state.user.storage.subscriptions_public_size_in_bytes || 51200000,
      subscriptionsPremiumSizeInBytes: state => state.user.storage.subscriptions_premium_size_in_bytes || 40e9
    }),
    usedStorage () {
      return [{
        color: DATASETS_COLOR,
        label: 'Datasets',
        value: getAmountInUnit(35600000, this.storageExponent)
        // value: getAmountInUnit(this.dbSizeInBytes, this.storageExponent)
      }, {
        color: DATA_SUBSCRIPTIONS_COLOR,
        label: 'Public data subscriptions',
        value: getAmountInUnit(this.subscriptionsPublicSizeInBytes, this.storageExponent)
      }];
    },
    usedPremiumDataSubscriptions () {
      return [
        {
          color: DATA_SUBSCRIPTIONS_COLOR,
          label: 'Premium data subscription',
          value: getAmountInUnit(this.subscriptionsPremiumSizeInBytes)
        }
      ];
    },
    storageExponent () {
      return getExpBaseTwo(this.quotaInBytes);
    },
    storageHelpLink () {
      return 'https://carto.com/help/your-account/your-disk-storage/';
    }
  },
  methods: {
    getAmountInUnit,
    getUnit
  }
};
</script>
