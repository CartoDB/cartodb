<template>
  <div class="u-flex" :class="{'u-flex__direction--column': mode === 'column', 'u-flex__align--center': mode !== 'column'}">
    <div v-if="dataset.sync_status !== 'syncing'" class="u-flex u-flex__align--center"
      :class="{ disabled: dataset.status !== 'active' && dataset.sync_status !== 'synced' }">
      <!-- <SubscriptionButtonTooltip v-if="dataset.sync_status === 'synced'">
        <button type="button" class="u-mr--8 connect" @click="unconnect">
          <div class="tooltip text is-small is-txtWhite">
            Disconnect from Dashboard
          </div>
        </button>
      </SubscriptionButtonTooltip> -->
      <SubscriptionButtonTooltip v-if="dataset.status === 'active' && dataset.sync_status === 'unsynced' && (!dataset.unsynced_errors || dataset.unsynced_errors === '')">
        <button type="button" class="u-mr--8 unconnect" @click="connect">
          <div class="tooltip text is-small is-txtWhite">
            Connect to Dashboard
          </div>
        </button>
      </SubscriptionButtonTooltip>
      <SubscriptionButtonTooltip v-else-if="dataset.status === 'active' && dataset.sync_status === 'unsynced'">
        <button type="button" class="u-mr--8 u-flex u-flex__align--center u-flex__justify--center">
          <img src="../../assets/icons/catalog/alert-triangle.svg" :class="smallClass">
          <div class="tooltip text bgWhite is-small is-txtSoftGrey">
            <h1>Unable to connect</h1>
            <p>{{dataset.unsynced_errors ? `An error ocurred during the synchronization. Error code: ${dataset.unsynced_errors}.` : ''}}</p>
          </div>
        </button>
      </SubscriptionButtonTooltip>
      <SubscriptionButtonTooltip v-else-if="dataset.sync_status === 'unsyncable'">
        <button type="button" class="u-mr--8 u-flex u-flex__align--center u-flex__justify--center">
          <img src="../../assets/icons/catalog/information-circle.svg" :class="smallClass">
          <div class="tooltip text bgWhite is-small is-txtSoftGrey" :class="smallClass">
            <h1>Insufficient storage</h1>
            <p>{{dataset.unsyncable_reason}}</p>
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
    <div :class="{ 'u-mt--12': mode === 'column', disabled: dataset.status !== 'active' }">
      <a class="text is-caption" :class="smallClass" href="#" @click="downloadNotebook">
        Explore with CARTOFrames
      </a>
    </div>
  </div>
</template>

<script>

import { mapState } from 'vuex';
import SubscriptionButtonTooltip from './SubscriptionButtonTooltip';

export default {
  name: 'SubscriptionActions',
  components: {
    SubscriptionButtonTooltip
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
    downloadNotebook (e) {
      e.preventDefault();
      this.$store.dispatch('catalog/downloadNotebook', { id: this.dataset.slug, type: this.dataset.type });
    },
    async connect () {
      await this.$store.dispatch('catalog/fetchSubscriptionSync', this.dataset.id);
      this.$store.dispatch('catalog/fetchSubscriptionsList', true);
    },
    async unconnect () {
      await this.$store.dispatch('catalog/fetchSubscriptionUnSync', this.dataset.id);
      this.$store.dispatch('catalog/fetchSubscriptionsList');
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';
.connect, .unconnect {
  border-radius: 2px;
  width: 24px;
  height: 24px;
  background-repeat: no-repeat;
  background-position: center;
}
.connect {
  background-color: $blue--500;
  border: 1px solid $blue--500;
  background-image: url('../../assets/icons/catalog/connect.svg');
  &:hover {
    background-color: $white;
    background-image: url('../../assets/icons/catalog/unconnect.svg');
  }
}
.unconnect {
  border: 1px solid $blue--500;
  background-image: url('../../assets/icons/catalog/unconnect.svg');
  &:hover {
    background-color: $blue--500;
    background-image: url('../../assets/icons/catalog/connect.svg');
  }
}
.disabled {
  >a {
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
