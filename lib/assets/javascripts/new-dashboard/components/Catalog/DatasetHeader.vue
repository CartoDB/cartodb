<template>
  <header
    class="grid u-flex__justify--center u-mb--36 u-mb--20--tablet u-mt--36"
  >
    <div class="grid-cell grid-cell--col8 grid-cell--col8--tablet tilte-container" :class="{ publicWebsite }">
      <nav class="breadcrumbs">
        <p class="text is-caption is-txtMainTextColor" v-if="!isGeography">
          <span class="title is-txtMainTextColor">{{
            dataset.category_name
          }}</span>
          /
          <span class="text is-txtMainTextColor">{{
            dataset.provider_name
          }}</span>
        </p>
        <p class="text is-caption is-txtMainTextColor" v-else>
          <span class="title is-txtMainTextColor">Geography</span>
        </p>
      </nav>
      <h1 class="title is-sectiontitle is-txtMainTextColor u-mt--4">
        {{ dataset.name }}
      </h1>
    </div>

    <div class="u-ml--auto grid-cell grid-cell--col4 grid-cell--col4--tablet buttons-actions" :class="{ publicWebsite }">
      <!-- Primary CTA -->
      <div class="u-flex u-flex__justify--end">
        <Button
          v-if="getActionStatus === 'sign_up'"
          :color="publicWebsite ? 'green' : ''"
          :big="publicWebsite"
          :blank="true"
          url="https://carto.com/signup"
          class="underline-animation"
        >
          <span>Sign up to access sample</span>
        </Button>
        <Button
          v-else-if="getActionStatus === 'interest' && !alreadyInterested"
          :class="{ 'underline-animation': publicWebsite }"
          :color="publicWebsite ? 'green' : ''"
          :big="publicWebsite"
          @click.native="interested"
        >
          <span>I'm interested</span>
        </Button>
        <SubscriptionRequestSuccess
          v-if="getActionStatus === 'interest' && alreadyInterested"
        ></SubscriptionRequestSuccess>
        <Button
          v-else-if="getActionStatus === 'access_sample'"
          @click.native="showModal('sample')"
        >
          Access free sample
        </Button>
        <div
          v-else-if="getActionStatus === 'public_subscription' || getActionStatus === 'premium_subscription'"
          class="u-flex u-flex__direction--column u-flex__align--center"
        >
          <Button
            v-if="getActionStatus === 'public_subscription'"
            @click.native="showModal('subscribe')"
          >
            Subscribe for free
          </Button>
          <Button
            v-else-if="getActionStatus === 'premium_subscription'"
            @click.native="showModal('request')"
          >
            Request subscription
          </Button>
          <Button
            v-if="hasSample"
            class="u-mt--12"
            :reverseColors="true"
            @click.native="showModal('sample')"
          >
            Access free sample
          </Button>
          <Button
            v-else
            class="u-mt--12"
            :reverseColors="true"
            :disabled="true"
          >
            No sample available
          </Button>
        </div>
        <div
          v-else-if="getActionStatus === 'active'"
          class="u-flex u-flex__direction--column u-flex__align--center"
        >
          <Button class="is-outline extra-border navy-blue noCursor">
            Subscribed
            <img class="u-ml--12" src="../../assets/icons/catalog/check.svg" alt="check" />
          </Button>
          <a v-if="dataset && dataset.is_public_data && subscriptionInfo"
            :title="subscriptionInfo.sync_status === 'syncing' ? 'Can not remove a subscription while connecting' : ''"
            @click="subscriptionInfo.sync_status !== 'syncing' && showModal('unsubscribe')"
            :class="{ 'disabled': subscriptionInfo.sync_status === 'syncing' }"
            class="text is-small is-txtSoftGrey u-mt--8 underline">
            Unsubscribe
          </a>
        </div>
        <div
          v-else-if="getActionStatus === 'requested'"
          class="u-flex u-flex__direction--column u-flex__align--center"
        >
          <Button class="is-outline extra-border navy-blue noCursor">
            Requested
            <img class="u-ml--12" src="../../assets/icons/catalog/check.svg" alt="check" />
          </Button>
          <a
            @click="showModal('cancelRequest')"
            class="text is-small is-txtSoftGrey u-mt--8 underline">
            Cancel request
          </a>
        </div>
      </div>
      <!-- Secondary CTA -->
      <div class="u-flex u-flex__justify--end u-mt--16">
        <p
          v-if="subscriptionInfo && subscriptionInfo.status !== 'active'"
          class="text is-small is-txtMainTextColor"
        >
          Any questions? <a href="https://carto.com/request-live-demo/" target="_blank">Contact</a>
        </p>
        <p
          v-else-if="(getActionStatus === 'sign_up' || getActionStatus === 'access_sample') && !isEnterprise && !isDOEnabled"
          class="text is-small is-txtMainTextColor"
        >
          Full dataset only available for <a class="underline" href="https://carto.com/pricing/" target="_blank">Enterprise plans</a>
        </p>
        <p
          v-else-if="getActionStatus === 'interest' && !isEnterprise && !isDOEnabled"
          class="text is-small is-txtMainTextColor"
        >
          Only available for <a class="underline" href="https://carto.com/pricing/" target="_blank">Enterprise plans</a>
        </p>
      </div>
    </div>

    <ModalSubscription
      @closeModal="hideModal()"
      :isOpen="modalOpen"
      :dataset="dataset"
      :type="getDatasetType()"
      :mode="modalMode"
    ></ModalSubscription>

  </header>
</template>

<script>
import { mapState } from 'vuex';
import Button from '../Button';
import ModalSubscription from '../Subscriptions/ModalSubscription';
import SubscriptionRequestSuccess from '../Subscriptions/SubscriptionRequestSuccess';
import { formURL } from 'new-dashboard/utils/catalog/form-url';

export default {
  name: 'DatasetHeader',
  props: {
    publicWebsite: Boolean
  },
  data () {
    return {
      modalOpen: false,
      modalMode: null
    };
  },
  components: {
    Button,
    ModalSubscription,
    SubscriptionRequestSuccess
  },
  computed: {
    ...mapState({
      dataset: state => state.catalog.dataset,
      interestedSubscriptions: state => state.catalog.interestedSubscriptions
    }),
    subscriptionInfo () {
      return this.$store.getters['catalog/getSubscriptionByDataset'](
        this.dataset.id
      );
    },
    getActionStatus () {
      if (this.publicWebsite) {
        return this.hasSample ? 'sign_up' : 'interest';
      }
      if (this.isSubscribed) {
        return this.subscriptionInfo.status;
      }
      if (this.isDOEnabled && this.dataset.is_public_data !== undefined) {
        return this.dataset.is_public_data ? 'public_subscription' : 'premium_subscription';
      }
      if (this.hasSample) {
        return 'access_sample';
      }
      return 'interest';
    },
    alreadyInterested () {
      return this.interestedSubscriptions.indexOf(this.dataset.id) >= 0;
    },
    isGeography () {
      return this.$route.params.entity_type === 'geography';
    },
    isSubscribed () {
      const possibleLicenceStates = ['requested', 'active', 'expired'];
      return this.subscriptionInfo && this.subscriptionInfo.status &&
             possibleLicenceStates.indexOf(this.subscriptionInfo.status) >= 0;
    },
    isDOEnabled () {
      return this.$store.state.user && this.$store.state.user.do_enabled;
    },
    isEnterprise () {
      return this.$store.state.user && this.$store.state.user.is_enterprise;
    },
    hasSample () {
      return this.dataset.sample_info && !!this.dataset.sample_info.id;
    }
  },
  methods: {
    async interested () {
      if (this.publicWebsite) {
        window.open(formURL(this.dataset), '_blank');
      } else {
        if (
          await this.$store.dispatch('catalog/requestDataset', {
            user: this.$store.state.user,
            dataset: this.dataset
          })
        ) {
          this.$store.commit('catalog/addInterestedSubscriptions', this.dataset.id);
        }
      }
    },
    showModal (mode) {
      this.modalMode = mode;
      this.modalOpen = true;
      document.body.classList.add('u-overflow-hidden');
    },
    hideModal () {
      this.modalMode = null;
      this.modalOpen = false;
      document.body.classList.remove('u-overflow-hidden');
    },
    getDatasetType () {
      return this.isGeography ? 'geography' : 'dataset';
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';
.u-ml--auto {
  margin-left: auto;
}

a.disabled {
  cursor: default;
  text-decoration: none;
}

.underline {
  cursor: pointer;
  text-decoration: underline;
}

@media (max-width: $layout-mobile) {
  .tilte-container.grid-cell--col8--tablet {
    max-width: 100%;
    flex: 1 1 100%;
  }
  .buttons-actions {
    position: fixed;
    left: 0;
    bottom: 0;
    z-index: 1;
    min-width: 100%;
    background-color: $white;
    box-shadow: 0 4px 16px 0 rgba($neutral--800, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    height: 120px;
    flex-direction: column;
  }
}

.is-sectiontitle {
  font-size: 24px;
  line-height: 36px;
}

.publicWebsite {
  background-color: $color-primary;
  h1, p, a, span {
    color: white;
  }
}

.underline-animation {
  & > span {
    display: block;
    position: relative;
    overflow: hidden;
    &:before {
      content: '';
      position: absolute;
      transition: transform .3s ease;
      left: -1px;
      bottom: 0;
      width: 100%;
      height: 2px;
      background: currentColor;
      transform: translateX(-100%);
    }
  }
  &:hover > span:before {
    transform: none;
  }
}
</style>
