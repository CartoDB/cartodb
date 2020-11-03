<template>
  <header
    class="grid u-flex__justify--center u-mb--36 u-mb--20--tablet u-mt--36"
  >
    <div class="grid-cell grid-cell--col9 grid-cell--col8--tablet tilte-container" :class="{ publicWebsite }">
      <nav class="breadcrumbs">
        <p class="text is-caption is-txtMainTextColor" v-if="!isGeography">
          <span class="title is-txtMainTextColor">{{
            dataset.category_name
          }}</span>
          /
          <span class="text is-txtMainTextColor">{{
            dataset.data_source_name
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

    <div class="u-ml--auto grid-cell grid-cell--col3 grid-cell--col4--tablet buttons-actions" :class="{ publicWebsite }">
      <div class="u-flex u-flex__justify--end">
        <!-- <Button
          v-if="hasSample && getSubscriptionStatus === 'interested' && !interestedInSubscription"
          :color="publicWebsite ? 'green' : ''"
          :big="publicWebsite"
          url="https://carto.com/signup"
        >
          Sign up to access sample
        </Button> -->
        <Button
          v-if="getSubscriptionStatus === 'interested' && !interestedInSubscription"
          :color="publicWebsite ? 'green' : ''"
          :big="publicWebsite"
          @click.native="interested"
        >
          I'm interested
        </Button>
        <SubscriptionRequestSuccess
          v-else-if="getSubscriptionStatus === 'interested' && interestedInSubscription"
        ></SubscriptionRequestSuccess>
        <Button
          v-else-if="getSubscriptionStatus === 'free_subscription'"
          @click.native="showModal('subscribe')"
        >
          Subscribe for free
        </Button>
        <Button
          v-else-if="getSubscriptionStatus === 'request_subscription'"
          @click.native="showModal('request')"
        >
          Request subscription
        </Button>
        <div
          v-else-if="getSubscriptionStatus === 'active'"
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
          v-else-if="getSubscriptionStatus === 'requested'"
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
      <p
        v-if="subscriptionInfo && subscriptionInfo.status !== 'active'"
        class="text is-small is-txtMainTextColor u-mt--16 right-align"
      >
        Any questions? <a href="https://carto.com/request-live-demo/" target="_blank">Contact</a>
      </p>
      <!-- <p
        v-else-if="hasSample && !subscriptionInfo && !isEnterprise"
        class="text is-small is-txtMainTextColor u-mt--16 right-align"
      >
        Full dataset available for <a class="underline" href="https://carto.com/pricing/" target="_blank">Enterprise plans</a>
      </p> -->
      <p
        v-else-if="!subscriptionInfo && !isEnterprise"
        class="text is-small is-txtMainTextColor u-mt--16 right-align"
      >
        Only available for <a class="underline" href="https://carto.com/pricing/" target="_blank">Enterprise plans</a>
      </p>
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
    isPublicWebsite () {
      return !(this.$store.state.user && this.$store.state.user.id);
    },
    isGeography () {
      return this.$route.params.type === 'geography';
    },
    getSubscriptionStatus () {
      const possibleLicenceStates = ['requested', 'active', 'expired'];
      if (
        !this.isPublicWebsite &&
        this.subscriptionInfo &&
        this.subscriptionInfo.status &&
        possibleLicenceStates.indexOf(this.subscriptionInfo.status) >= 0
      ) {
        return this.subscriptionInfo.status;
      }
      if (this.isPublicWebsite || !this.isDOEnabled) {
        return 'interested';
      } else if (
        this.isDOEnabled &&
        this.dataset.is_public_data !== undefined
      ) {
        return this.dataset.is_public_data
          ? 'free_subscription'
          : 'request_subscription';
      }
      return null;
    },
    interestedInSubscription () {
      return this.interestedSubscriptions.indexOf(this.dataset.id) >= 0;
    },
    isEnterprise () {
      return this.$store.state.user && this.$store.state.user.is_enterprise;
    },
    isDOEnabled () {
      return this.$store.state.user && this.$store.state.user.do_enabled;
    },
    hasSample () {
      return this.dataset.available_in && this.dataset.available_in.indexOf('bq-sample') >= 0;
    }
  },
  methods: {
    getFormURL () {
      return formURL(this.dataset);
    },
    async interested () {
      if (this.isPublicWebsite) {
        window.location.replace(this.getFormURL());
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
.right-align {
  text-align: right;
}

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
</style>
