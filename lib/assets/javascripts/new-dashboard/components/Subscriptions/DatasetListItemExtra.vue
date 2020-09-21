<template>
  <div class="dataset-listItem-extra-container u-flex u-flex__direction--column u-pl--24">
    <SubscriptionStatus :status="dataset.status" :expiresDate="dataset.expires_at" class="u-width--100"></SubscriptionStatus>
    <div class="u-ml--16">
      <SubscriptionActions :dataset="dataset" class="u-mt--28"></SubscriptionActions>
      <SlugCopy v-if="dataset.status === 'active' && dataset.slug" :slug="dataset.slug" class="u-mt--24"></SlugCopy>
    </div>
  </div>
</template>

<script>

import SubscriptionStatus from './SubscriptionStatus';
import SubscriptionActions from './SubscriptionActions';
import SlugCopy from './SlugCopy';

export default {
  name: 'DatasetListItemExtra',
  components: {
    SubscriptionStatus,
    SubscriptionActions,
    SlugCopy
  },
  computed: {
    getDatasetSize () {
      if (!this.dataset.estimated_size || this.dataset.estimated_size === 0) {
        return '0 B';
      }
      const k = 1024;
      const dm = 2;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const i = Math.floor(Math.log(this.dataset.estimated_size) / Math.log(k));

      return parseFloat((this.dataset.estimated_size / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
  },
  props: {
    dataset: {
      type: Object,
      required: true
    }
  },
  data () {
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
