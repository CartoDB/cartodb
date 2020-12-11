<template>
  <QuotaContainer :title="$t(`QuotaSection.memory`)" :perMonth="false">
    <StackedQuotaWidget
      :name="$t(`QuotaSection.yourPlan`)"
      :usedQuota="usedStorage"
      :availableQuota="getAmountInUnit(availableQuota)"
      :unit="getUnit(availableQuota)"
      :formatToLocale="false"
      :helpLink="storageHelpLink"/>
    <StackedQuotaWidget
      v-if="subscriptionsPremiumSizeInBytes"
      :name="$t(`QuotaSection.addOns`)"
      :usedQuota="usedPremiumDataSubscriptions"
      :unit="getUnit(subscriptionsPremiumSizeInBytes)"
      :formatToLocale="false"
      :helpLink="storageHelpLink" unlimited/>
  </QuotaContainer>
</template>

<script>
import { mapState } from 'vuex';
import QuotaContainer from './QuotaContainer';
import StackedQuotaWidget from './StackedQuotaWidget';
import { getAmountInUnit, getUnit, getExpBaseTwo } from 'new-dashboard/utils/storage-utils';

const DATA_SUBSCRIPTIONS_COLOR = '#2e51e8';
const DATASETS_COLOR = '#11a2b8';

export default {
  name: 'MemoryQuota',
  components: {
    StackedQuotaWidget,
    QuotaContainer
  },
  data () {
    return {
    };
  },
  computed: {
    ...mapState({
      quotaInBytes: state => state.user.storage.quota_in_bytes,
      dbSizeInBytes: state => state.user.storage.db_size_in_bytes,
      subscriptionsPublicSizeInBytes: state => state.user.storage.subscriptions_public_size_in_bytes,
      subscriptionsPremiumEstimatedSizeInBytes: state => state.user.storage.subscriptions_premium_estimated_size_in_bytes,
      subscriptionsPremiumSizeInBytes: state => state.user.storage.subscriptions_premium_size_in_bytes
    }),
    availableQuota () {
      return this.quotaInBytes - this.subscriptionsPremiumEstimatedSizeInBytes;
    },
    datasetsSize () {
      return Math.max(0, this.dbSizeInBytes - this.subscriptionsPremiumSizeInBytes - this.subscriptionsPublicSizeInBytes);
    },
    usedStorage () {
      return [{
        color: DATASETS_COLOR,
        label: 'Datasets',
        value: getAmountInUnit(this.datasetsSize, this.storageExponent)
      }, ...(this.subscriptionsPublicSizeInBytes ? [{
        color: DATA_SUBSCRIPTIONS_COLOR,
        label: 'Public data subscriptions',
        value: getAmountInUnit(this.subscriptionsPublicSizeInBytes, this.storageExponent)
      }] : [])];
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
