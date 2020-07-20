<template>
  <div class="dataset-listItem-extra-container u-flex u-flex__direction--column u-pt--12 u-pl--24 u-pb--24">
    <SubscriptionStatus :status="dataset.status" :expiresDate="dataset.expires_at" class="u-width--100"></SubscriptionStatus>
    <div class="u-ml--16">
       <div class="is-caption u-mt--12 is-small"><span class="is-txtSoftGrey">{{$t('Subscriptions.datasetSize')}}</span> <span>{{dataset.estimated_size / 1000000}} MB</span></div>
       <SubscriptionActions :dataset="dataset" class="u-mt--28"></SubscriptionActions>
      <SlugCopy :slug="dataset.slug" class="u-mt--24"></SlugCopy>
    </div>
  </div>
</template>

<script>

import SubscriptionStatus from '@carto/common-ui/do-catalog/src/components/subscriptions/SubscriptionStatus';
import SubscriptionActions from '@carto/common-ui/do-catalog/src/components/subscriptions/SubscriptionActions';
import SlugCopy from '@carto/common-ui/do-catalog/src/components/subscriptions/SlugCopy';

export default {
  name: 'DatasetListItemExtra',
  components: {
    SubscriptionStatus,
    SubscriptionActions,
    SlugCopy
  },
  props: {
    dataset: {
      type: Object,
      required: true
    }
  },
  data: function () {
    return {};
  },
  methods: {}
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';
.dataset-listItem-extra-container {
  flex: 0 0 306px;
}
</style>
