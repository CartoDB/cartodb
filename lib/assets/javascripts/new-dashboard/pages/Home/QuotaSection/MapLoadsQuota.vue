<template>
  <QuotaContainer :title="$t(`QuotaSection.mapLoads`)" :perMonth="true">
    <StackedQuotaWidget
      :name="$t(`QuotaSection.quota`)"
      :usedQuota="mapViews"
      :availableQuota="mapViewsQuota"
      :formatToLocale="true"
      :helpLink="storageHelpLink" qualitative/>
  </QuotaContainer>
</template>

<script>
import { mapState } from 'vuex';
import QuotaContainer from './QuotaContainer';
import StackedQuotaWidget from './StackedQuotaWidget';
import { apiKeysTypes } from 'new-dashboard/core/constants/api-keys';

export default {
  name: 'MapLoadsQuota',
  components: {
    StackedQuotaWidget,
    QuotaContainer
  },
  beforeMount () {
    this.getApiKeysTotal();
  },
  data () {
    return {
      usedApiKeys: 0
    };
  },
  computed: {
    ...mapState({
      mapViewsQuota: state => state.user.map_views_quota,
      mapViews: state => state.user.map_views
    }),
    storageHelpLink () {
      return 'https://carto.com/help/your-account/your-disk-storage/';
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
    getAmountInUnit (number, exponent) {
      return number / Math.pow(2, exponent);
    },
    getApiKeysTotal () {
      this.$store.state.client.getApiKeys(apiKeysTypes.REGULAR,

        (err, _, data) => {
          if (err) {
            return;
          }
          this.usedApiKeys = data.count;
        }
      );
    }
  }
};
</script>
