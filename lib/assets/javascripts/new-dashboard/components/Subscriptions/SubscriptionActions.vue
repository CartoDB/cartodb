<template>
  <div class="u-flex actions" :class="{'u-flex__direction--column': mode === 'column', 'u-flex__align--center': mode !== 'column'}">
    <div v-if="dataset.sync_status !== 'syncing'" class="u-flex u-flex__align--center"
      :class="{ disabled: dataset.status !== 'active' || dataset.sync_status !== 'synced' }">
      <SubscriptionButtonTooltip v-if="dataset.sync_status === 'unsynced' && (dataset.unsynced_errors && dataset.unsynced_errors.length > 0)">
        <button type="button" class="u-mr--8 u-flex u-flex__align--center u-flex__justify--center">
          <img src="../../assets/icons/catalog/error-triangle.svg" :class="smallClass">
          <div class="tooltip text bgWhite is-small is-txtSoftGrey">
            <h1>Connection error</h1>
            <p>An error occurred during connection. Please, contact support@carto.com.</p>
          </div>
        </button>
      </SubscriptionButtonTooltip>
      <SubscriptionButtonTooltip v-else-if="dataset.sync_status === 'unsynced' && dataset.status === 'active'">
        <button type="button" class="u-mr--8 u-flex u-flex__align--center u-flex__justify--center">
          <img src="../../assets/icons/catalog/information-not-connected.svg" :class="smallClass">
          <div class="tooltip text bgWhite is-small is-txtSoftGrey">
            <h1>Not connected</h1>
            <p>This dataset is not connected. Please, contact support@carto.com.</p>
          </div>
        </button>
      </SubscriptionButtonTooltip>
      <SubscriptionButtonTooltip v-else-if="dataset.sync_status === 'unsyncable' && dataset.unsyncable_reason.includes('exceeds the quota available')">
        <button type="button" class="u-mr--8 u-flex u-flex__align--center u-flex__justify--center">
          <img src="../../assets/icons/catalog/warning-triangle.svg" :class="smallClass" @click="connect">
          <div class="tooltip text bgWhite is-small is-txtSoftGrey">
            <h1>Insufficient storage</h1>
            <p>
              {{dataset.unsyncable_reason}}.
              Click the icon to check again.
            </p>
          </div>
        </button>
      </SubscriptionButtonTooltip>
      <SubscriptionButtonTooltip v-else-if="dataset.sync_status === 'unsyncable' && dataset.unsyncable_reason.includes('exceeds the maximum')">
        <button type="button" class="u-mr--8 u-flex u-flex__align--center u-flex__justify--center">
          <img src="../../assets/icons/catalog/information-circle.svg" :class="smallClass">
          <div class="tooltip text bgWhite is-small is-txtSoftGrey" :class="smallClass">
            <h1>Unable to connect</h1>
            <p>This dataset is too large for Builder. You can use CARTOFrames to access the data.</p>
          </div>
        </button>
      </SubscriptionButtonTooltip>
      <a class="text is-caption" :class="smallClass" :href="`${user.base_url}/dashboard/datasets/?id=${dataset.sync_table}&create=true`">Create map</a>
      <span class="u-ml--8 u-mr--8">|</span>
      <a class="text is-caption" :class="smallClass" :href="`${user.base_url}/dataset/${dataset.sync_table}`">View dataset</a>
    </div>
    <div v-if="dataset.sync_status === 'syncing'" class="u-flex u-flex__align--center">
      <span class="loading u-mr--12 u-flex u-flex__align--center">
        <img svg-inline src="../../assets/icons/catalog/loading.svg" class="loading__svg"/>
      </span>
      <span class="text is-txtSoftGrey is-caption" :class="smallClass">
        Connecting dataset…
      </span>
    </div>
    <div v-if="mode !== 'column'" class="white-separator u-ml--12 u-mr--12"></div>
    <div :class="{ 'u-mt--12': mode === 'column', disabled: dataset.status !== 'active', 'u-flex u-flex__align--center': true }">
      <a class="text is-caption" :class="smallClass" href="#" @click="downloadNotebook">
        Explore with CARTOFrames
      </a>
      <span class="u-ml--8 u-mr--8">|</span>
      <SubscriptionsQuickActions @onAccess="openAccess"></SubscriptionsQuickActions>
    </div>
  </div>
</template>

<script>

import { mapState } from 'vuex';
import SubscriptionButtonTooltip from './SubscriptionButtonTooltip';
import SubscriptionsQuickActions from './SubscriptionsQuickActions';

export default {
  name: 'SubscriptionActions',
  components: {
    SubscriptionButtonTooltip,
    SubscriptionsQuickActions
  },
  props: {
    mode: {
      type: String,
      default: 'column'
    },
    dataset: {
      type: Object,
      required: true
    }
  },
  data () {
    return {};
  },
  computed: {
    ...mapState({
      user: state => state.user
    }),
    smallClass () {
      return {
        'small': this.mode !== 'column'
      };
    }
  },
  methods: {
    openAccess (platform) {
      this.$store.commit('catalog/setCurrentSubscription', this.dataset);
      this.$store.commit('catalog/setCurrentAccessPlatform', platform);
      this.sendMetrics(platform);
    },
    sendMetrics (platform) {
      if (platform === 'bigquery') platform = 'bq';
      this.$store.dispatch(
        'catalog/sendAccessAttemptMetrics',
        {
          datasetId: this.dataset.id,
          platform,
          licenseType: this.dataset.license_type
        });
    },
    downloadNotebook (e) {
      e.preventDefault();
      this.$store.dispatch('catalog/downloadNotebook', { id: this.dataset.slug, type: this.dataset.type });
    },
    async connect () {
      await this.$store.dispatch('catalog/performSubscriptionSync', this.dataset.id);
      this.$store.dispatch('catalog/fetchSubscriptionsList', true);
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';
.actions {
  position: relative
}
.disabled {
  >a,
  >.quick-actions {
    opacity: 0.4;
    pointer-events: none;
  }
  >span {
    opacity: 0.4;
  }
}
.white-separator {
  width: 2px;
  height: 40px;
  background-color: $white;
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

.is-caption.small {
  font-size: 14px;
  line-height: 20px;
}

img.small {
  height: 20px;
}
</style>
