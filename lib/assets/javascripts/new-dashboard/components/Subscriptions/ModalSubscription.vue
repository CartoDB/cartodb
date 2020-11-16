<template>
  <div
    v-if="isOpen"
    class="modal u-flex u-flex__justify--center u-flex__align--center"
  >
    <div @click="closeModal()" class="close-modal">
      <img src="../../assets/icons/catalog/modal/close.svg" alt="close" />
    </div>

    <div class="grid u-flex__justify--center">
      <div class="modal-col grid-cell--col6">
        <div class="u-align--center">
          <img
            v-if="getHeaderIcon"
            :src="require('new-dashboard/assets/icons/catalog/modal/' + getHeaderIcon)"
            alt="Request data"
          />
          <h2 class="title is-title-small is-txtNavyBlue u-mt--24">
            {{ getTitle }}
          </h2>
          <p class="text is-caption is-txtNavyBlue u-mt--12" v-html="getSubTitle"></p>
        </div>
        <ul>
          <DatasetListItem
            :key="dataset.slug"
            :dataset="dataset"
            :minimal="true"
            :warning="getWarning"
          ></DatasetListItem>
        </ul>

        <p class="text is-caption-xsmall u-mt--16" v-if="currentMode == 'sample' || currentMode == 'connectingSample'">
          {{ getDescription }}
        </p>

        <div
          class="license u-mt--24"
          v-if="currentMode !== 'unsubscribe' && getLicense"
        >
          <p class="text is-small is-txtBaseGrey license-description">
            <span v-html="getLicense"></span>
            <a v-if="getLicenseLink" class="text is-small" :href="getLicenseLink" target="_blank">Continue reading</a>
          </p>

          <p v-if="currentMode === 'subscribed' || currentMode === 'requested' || currentMode === 'connectingSample'"
            class="text u-mt--16 is-caption-small is-txtNavyBlue u-flex"
          >
            <img class="u-mr--12" src="../../assets/icons/catalog/check.svg" alt="check" />
            {{ getAcceptedLicense }}
          </p>

          <label v-else class="text u-flex u-flex__align--center u-mt--16">
            <span class="checkbox u-mr--12">
              <input
                class="checkbox-input"
                type="checkbox"
                name="option.id"
                v-model="licenseStatus"
              />
              <span class="checkbox-decoration">
                <svg
                  viewBox="0 0 12 12"
                  svg-inline=""
                  role="presentation"
                  focusable="false"
                  tabindex="-1"
                  class="checkbox-decorationMedia"
                >
                  <path
                    d="M1.65 3.803l2.84 3.169L10.38.717"
                    fill="none"
                    class="checkbox-check"
                  ></path>
                </svg>
              </span>
            </span>
            <span class="is-txtNavyBlue is-caption-small">{{ getAcceptLicense }}</span>
          </label>
        </div>

        <p
          v-if="currentMode === 'request'"
          class="text is-caption is-txtNavyBlue u-mt--40 u-align--center"
        >
          Once you confirm your request, a
          <span class="is-semibold">CARTO team member will get in touch</span>
          to give you more information and go over any questions you may have.
        </p>

        <div
          v-else-if="currentMode === 'unsubscribe'"
          class="text is-caption is-txtNavyBlue u-mt--40"
        >
          If you unsubcribe this dataset the following content will be removed:
          <ul class="u-mt--20 u-ml--32" style="list-style: disc;">
            <li>
              If you imported the dataset, it will disappear from
              <span class="is-semibold">your datasets</span> list.
            </li>
            <li>
              All <span class="is-semibold">maps</span> where you are using the
              dataset will be removed.
            </li>
            <li>
              The dataset will stop working in
              <span class="is-semibold">apps</span> where it is being used
              through API.
            </li>
          </ul>
        </div>

        <p
          v-else-if="currentMode === 'requested'"
          class="text is-caption is-txtNavyBlue u-mt--40 u-flex u-flex__justify--center u-flex__align-cen"
        >
          <img class="u-mr--12" src="../../assets/icons/catalog/check.svg" alt="check" />
          Your subscription request has been added to your subscriptions.
        </p>

        <div class="grid u-flex__justify--center u-mt--36">
          <Button
            @click.native="closeModal()"
            :isOutline="true"
            :color="(currentMode === 'unsubscribe' || currentMode === 'cancelRequest') ? 'navy-blue' : ''"
            class="noBorder"
            >{{ getCloseText }}
          </Button>
          <Button
            v-if="currentMode === 'subscribe'"
            @click.native="subscribe()"
            class="u-ml--16"
            :class="{ 'require-licence': !licenseAccepted, 'is-loading': loading }"
          >
          <span class="loading u-flex u-flex__align-center u-mr--12">
            <img svg-inline src="../../assets/icons/catalog/loading_white.svg" class="loading__svg"/>
          </span>
            Confirm subscription
          </Button>

          <Button
            v-else-if="currentMode === 'unsubscribe'"
            @click.native="unsubscribe()"
            class="u-ml--16"
            :class="{ 'is-loading': loading }"
            :color="'red'"
          >
          <span class="loading u-flex u-flex__align-center u-mr--12">
            <img svg-inline src="../../assets/icons/catalog/loading_white.svg" class="loading__svg"/>
          </span>
            Confirm unsubscription
          </Button>

          <Button
            v-else-if="currentMode === 'request'"
            @click.native="request()"
            class="u-ml--16"
            :class="{ 'require-licence': !licenseAccepted, 'is-loading': loading  }"
          >
          <span class="loading u-flex u-flex__align-center u-mr--12">
            <img svg-inline src="../../assets/icons/catalog/loading_white.svg" class="loading__svg"/>
          </span>
            Confirm request
          </Button>

          <Button
            v-else-if="currentMode === 'cancelRequest'"
            @click.native="cancelRequest()"
            class="u-ml--16"
            :class="{ 'is-loading': loading }"
            :color="'red'"
          >
          <span class="loading u-flex u-flex__align-center u-mr--12">
            <img svg-inline src="../../assets/icons/catalog/loading_white.svg" class="loading__svg"/>
          </span>
            Confirm cancellation
          </Button>

          <Button
            v-if="currentMode === 'sample'"
            @click.native="connectSample()"
            class="u-ml--16"
            :class="{ 'require-licence': !licenseAccepted, 'is-loading': loading }"
          >
          <span class="loading u-flex u-flex__align-center u-mr--12">
            <img svg-inline src="../../assets/icons/catalog/loading_white.svg" class="loading__svg"/>
          </span>
            Connect sample
          </Button>

          <router-link
            v-else-if="currentMode === 'subscribed' || currentMode === 'requested'"
            :to="{ name: 'subscriptions' }">
              <Button
                @click.native="closeModal()"
                class="u-ml--16"
                :color="'green'"
              >
                <img class="u-mr--12" src="../../assets/icons/catalog/check_white.svg" alt="check" />
                Check your subscriptions
              </Button>
          </router-link>

          <a v-else-if="currentMode === 'connectingSample'" href="./../../../">
            <Button
              @click.native="closeModal()"
              class="u-ml--16"
              :color="'green'"
            >
              <img class="u-mr--12" src="../../assets/icons/catalog/check_white.svg" alt="check" />
              Go to Your Datasets
            </Button>
          </a>

        </div>
        <div class="grid u-flex__justify--center u-mt--24">
          <span v-if="error" class="error-msg">There was an issue with the subscription. Please contact CARTO support (support@carto.com)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Button from '../Button.vue';
import DatasetListItem from '../Catalog/browser/DatasetListItem';

export default {
  name: 'ModalSubscription',
  components: {
    Button,
    DatasetListItem
  },
  props: {
    isOpen: Boolean,
    dataset: Object,
    type: {
      type: String,
      required: true,
      validator: value => {
        return ['geography', 'dataset'].indexOf(value) !== -1;
      }
    },
    mode: {
      type: String,
      required: false,
      validator: value => {
        return ['subscribe', 'unsubscribe', 'request', 'cancelRequest', 'sample'].indexOf(value) !== -1;
      }
    }
  },
  data () {
    return {
      currentMode: null,
      licenseStatus: false,
      loading: false,
      error: false
    };
  },
  computed: {
    ...mapState({
      user: state => state.user
    }),
    getHeaderIcon () {
      if (this.currentMode === 'subscribe') {
        return 'data-add.svg';
      } else if (this.currentMode === 'unsubscribe') {
        return 'data-drop.svg';
      } else if (this.currentMode === 'request') {
        return 'data-request.svg';
      } else if (this.currentMode === 'sample') {
        return 'data-add.svg';
      } else if (this.currentMode === 'subscribed') {
        return 'data-check.svg';
      } else if (this.currentMode === 'requested') {
        return 'data-requested.svg';
      } else if (this.currentMode === 'cancelRequest') {
        return 'data-drop.svg';
      } else if (this.currentMode === 'connectingSample') {
        return 'data-loading.svg';
      }
    },
    getTitle () {
      if (this.currentMode === 'subscribe') {
        return 'Confirm your subscription';
      } else if (this.currentMode === 'unsubscribe') {
        return 'Confirm your unsubscription';
      } else if (this.currentMode === 'request') {
        return 'Confirm your request';
      } else if (this.currentMode === 'sample') {
        return 'Connect your sample';
      } else if (this.currentMode === 'subscribed') {
        return 'Subscription confirmed';
      } else if (this.currentMode === 'requested') {
        return 'Subscription request confirmed';
      } else if (this.currentMode === 'cancelRequest') {
        return 'Confirm cancellation of subscription request';
      } else if (this.currentMode === 'connectingSample') {
        return 'Your sample is almost ready';
      }
    },
    getSubTitle () {
      if (this.currentMode === 'subscribe') {
        return 'You are going to subscribe to the following dataset:';
      } else if (this.currentMode === 'unsubscribe') {
        return 'You are going to unsubscribe to the following dataset:';
      } else if (this.currentMode === 'request') {
        return 'You are going to request a subscription to the following dataset:';
      } else if (this.currentMode === 'sample') {
        return 'You are going to access the following sample dataset:';
      } else if (this.currentMode === 'subscribed') {
        return 'Your subscription has been activated successfully.';
      } else if (this.currentMode === 'requested') {
        return 'We have received your subscription request and we will contact you really soon about the following dataset:';
      } else if (this.currentMode === 'cancelRequest') {
        return 'You are going to cancel the request to start the subscription process for the following dataset:';
      } else if (this.currentMode === 'connectingSample') {
        return 'Your sample is being processed and will be available from <a href="./../../../">Your Datasets</a> shortly.';
      }
    },
    getDescription () {
      if (this.currentMode === 'sample') {
        return 'The sample data is for trial evaluation purposes only and may differ slightly from final product data.';
      } else if (this.currentMode === 'connectingSample') {
        return 'The sample data is for trial evaluation purposes only and may differ slightly from final product data.';
      }
    },
    getWarning () {
      if (this.currentMode === 'sample' || this.currentMode === 'connectingSample') {
        if (this.dataset.sample_info && this.dataset.sample_info.default_source) {
          const source = this.dataset.sample_info.default_source;
          const htmlSource = `&nbsp;<span class="is-semibold is-italic" title="${source}">${source}</span>`;
          return `(*) Sample not available: this sample is for${htmlSource}`;
        }
      }
    },
    getAcceptLicense () {
      if (this.currentMode === 'sample') {
        return 'I accept the Terms of Use';
      } else {
        return 'I accept the License';
      }
    },
    getAcceptedLicense () {
      if (this.currentMode === 'connectingSample') {
        return 'I accepted the Terms of Use';
      } else {
        return 'I accepted the License';
      }
    },
    getCloseText () {
      if (
        this.currentMode === 'subscribed' ||
        this.currentMode === 'requested' ||
        this.currentMode === 'connectingSample'
      ) {
        return 'Close';
      }
      return 'Cancel';
    },
    getLicense () {
      let license = '';
      if (this.currentMode === 'sample' || this.currentMode === 'connectingSample') {
        license = 'This sample is for evaluation purposes only and may be used internally only for non-commercial purposes. This sample is subject to limited, non-exclusive, non-transferable, non-sublicensable and revocable rights and license to use. Any rights not expressly granted are withheld.';
      } else if (this.dataset && this.dataset.licenses) {
        license = `${this.dataset.licenses} `;
      }
      return license;
    },
    getLicenseLink () {
      let licenseLink = '';
      if (this.currentMode !== 'sample' && this.currentMode !== 'connectingSample') {
        if (this.dataset && this.dataset.licenses_link) {
          licenseLink = this.dataset.licenses_link;
        }
      }
      return licenseLink;
    },
    licenseAccepted () {
      return !this.getLicense || this.licenseStatus;
    }
  },
  methods: {
    closeModal () {
      this.licenseStatus = false;
      this.$emit('closeModal');
    },
    async subscribe () {
      this.error = false;
      this.loading = true;
      if (
        await this.$store.dispatch('catalog/performSubscribe', {
          id: this.dataset.id,
          type: this.type
        }) &&
        await this.$store.dispatch('catalog/performSubscriptionSync', this.dataset.id)
      ) {
        await this.$store.dispatch('catalog/fetchSubscriptionsList');
        this.currentMode = 'subscribed';
      } else {
        this.error = true;
      }
      this.loading = false;
    },
    async unsubscribe () {
      this.loading = true;
      if (
        await this.$store.dispatch('catalog/performSubscriptionUnsync', this.dataset.id) &&
        await this.$store.dispatch('catalog/performUnsubscribe', {
          id: this.dataset.id,
          type: this.type
        })
      ) {
        await this.$store.dispatch('catalog/fetchSubscriptionsList');
        this.closeModal();
      }
      this.loading = false;
    },
    async request () {
      this.error = false;
      this.loading = true;
      if (
        await this.$store.dispatch('catalog/requestDataset', {
          user: this.user,
          dataset: this.dataset
        }) &&
        await this.$store.dispatch('catalog/performSubscribe', {
          id: this.dataset.id,
          type: this.type
        })
      ) {
        await this.$store.dispatch('catalog/fetchSubscriptionsList');
        this.currentMode = 'requested';
      } else {
        this.error = true;
      }
      this.loading = false;
    },
    async cancelRequest () {
      this.loading = true;
      if (
        await this.$store.dispatch('catalog/performUnsubscribe', {
          id: this.dataset.id,
          type: this.type
        }) &&
        await this.$store.dispatch('catalog/requestDataset', {
          user: this.user,
          dataset: this.dataset,
          requestStatus: 'cancel'
        })
      ) {
        await this.$store.dispatch('catalog/fetchSubscriptionsList');
        this.closeModal();
      }
      this.loading = false;
    },
    async connectSample () {
      this.error = false;
      this.loading = true;
      if (
        await this.$store.dispatch('catalog/requestDataset', {
          user: this.$store.state.user,
          dataset: this.dataset
        }) &&
        await this.$store.dispatch('catalog/connectSubscriptionSample', this.dataset.id)
      ) {
        this.currentMode = 'connectingSample';
      } else {
        this.error = true;
      }
      this.loading = false;
    }
  },
  watch: {
    mode () {
      this.currentMode = this.mode;
    },
    isOpen () {
      this.error = false;
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.modal {
  position: fixed;
  z-index: 5; // Min value for Dashboard
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba($white, 0.96);
  overflow-y: auto;
}

.modal-col {
  max-width: 800px;
}

.close-modal {
  position: absolute;
  top: 32px;
  right: 24px;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.u-align--center {
  text-align: center;
}

.list-item {
  border: none;
  margin-top: 42px;
  background-color: $white;
  box-shadow: 0 4px 16px 0 rgba(44, 44, 44, 0.16);
  &:hover {
    background-color: $white;
  }
}

.is-title-small {
  font-weight: 700;
  font-size: 24px;
  line-height: 32px;
}

.is-caption-small {
  font-size: 14px;
  line-height: 1.43;
}

.is-caption-xsmall {
  font-size: 12px;
  line-height: 16px;
}

.license {
  background-color: $neutral--100;
  padding: 24px;
}

.require-licence {
  pointer-events: none;
  opacity: 0.4;
}

.license-description {
  max-height: 80px;
  overflow-y: auto;
  padding-right: 8px;
}

.loading {
  &__svg {
    width: 16px;
  }
}

.button {
  height: 36px;

  &:not(.is-loading) {
    .loading {
      display: none;
    }
  }
  &.is-loading {
    pointer-events: none;
  }
}

.error-msg {
  font-size: 12px;
  line-height: 20px;
  color: $red--500;
}
</style>
