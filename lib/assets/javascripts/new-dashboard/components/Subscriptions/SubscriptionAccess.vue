<template>
  <Dialog ref="dialog"
    :backText="null"
    :headerTitle="'Connection details'"
    :headerImage="require('../../assets/icons/datasets/add-connection.svg')"
    :emitOnClose="true"
    @onClose="handleClose">
    <template slot="sub-header">
      <h3 class="title is-caption is-regular is-txtMidGrey u-flex u-flex__align--center" >
        <img height="21" class="u-mr--8" :src="logo">
        {{ $t('DataPage.accessIn') }} {{title}}
      </h3>
    </template>
    <template #default>
      <div class="u-flex u-flex__justify--center">
        <div class="main u-flex u-flex__direction--column">
          <div class="u-flex u-flex__direction--column u-mb--32">
            <span class="is-small is-semibold u-mb--8" :class="{'alert': needExtendedLicense || needRequestAccess}"> {{ subtitle }}</span>
            <div class="text is-small is-txtMidGrey">
              <template v-if="needExtendedLicense">
                <p>Your current license only allows you to access this dataset within CARTO. In order to access this dataset directly from your data warehouse (e.g. BigQuery, Snowflake, etc.) you need an extended license.</p>
                <p class="u-mt--16">Please request it and we will get back to you with more details.</p>
                <div class="u-flex u-flex__justify--center u-mt--32">
                  <button v-if="!hasBeenRequested" @click="requestExtendedLicense" class="CDB-Button CDB-Button--primary CDB-Button--big">Request extended license</button>
                  <SubscriptionRequestSuccess v-else />
                </div>
                <div v-if="requestError" class="is-txtAlert u-flex u-flex__justify--center u-mt--8">
                  <p>An error has occurred: {{requestError}}</p>
                </div>
              </template>
              <template v-else-if="needRequestAccess">
                <p>Please confirm your request to access your Data Observatory subscription in {{platform}} and we will get back to you shortly. Access details will be displayed on this page as soon as your request has been fulfilled.</p>
                <div class="u-flex u-flex__justify--center u-mt--32">
                  <button v-if="!hasBeenRequested" @click="requestAccess" class="CDB-Button CDB-Button--primary CDB-Button--big">Request access</button>
                  <SubscriptionRequestSuccess v-else />
                </div>
                <div v-if="requestError" class="is-txtAlert u-flex u-flex__justify--center u-mt--8">
                  <p>An error has occurred: {{requestError}}</p>
                </div>
              </template>
              <template v-else>
                <BigQueryAccessParameters v-if="currentAccessPlatform === 'bigquery'" :subscription="currentSubscription"/>
                <OtherAccessParameters v-else :platformName="platform" :platform="currentAccessPlatform" :subscription="currentSubscription"/>
                <div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script>

import { mapState } from 'vuex';
import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';
import SubscriptionRequestSuccess from './SubscriptionRequestSuccess.vue';
import BigQueryAccessParameters from './BigQueryAccessParameters.vue';
import OtherAccessParameters from './OtherAccessParameters.vue';

/* global __ASSETS_DIR__:false */
// __ASSETS_DIR__ is injected via Webpack
const assetsDir = __ASSETS_DIR__;

const PLATFORMS = {
  'bigquery': {
    name: 'BigQuery',
    hubspot: 'BigQuery',
    full_access: 'full_access_status_bq'
  },
  'aws': {
    name: 'Amazon S3',
    hubspot: 'AWS',
    full_access: 'full_access_status_aws'
  },
  'azure': {
    name: 'Azure',
    hubspot: 'Azure',
    full_access: 'full_access_status_azure'
  }
};

const LICENSE_TYPE = {
  full: 'full-access',
  free: 'free',
  carto: 'carto-access'
};

export default {
  name: 'SubscriptionAccess',
  components: {
    Dialog,
    BigQueryAccessParameters,
    OtherAccessParameters,
    SubscriptionRequestSuccess
  },
  props: {
    backNamedRoute: {
      default: ''
    }
  },
  data () {
    return {
    };
  },
  computed: {
    ...mapState({
      currentSubscription: state => state.catalog.currentSubscription,
      currentAccessPlatform: state => state.catalog.currentAccessPlatform,
      requestError: state => state.catalog.requestError
    }),
    title () {
      let title = '';
      if (this.currentAccessPlatform) {
        title = PLATFORMS[this.currentAccessPlatform].name;
      }
      return title;
    },
    logo () {
      let logo = '';
      if (this.currentAccessPlatform) {
        logo = `${assetsDir && assetsDir.replace(/\"/g, '')}/images/layout/platforms/${this.currentAccessPlatform}.svg`;
      }
      return logo;
    },
    platform () {
      return PLATFORMS[this.currentAccessPlatform].name;
    },
    hasBeenRequested () {
      let field = 'full_access_status_bq';
      if (this.needRequestAccess) {
        field = PLATFORMS[this.currentAccessPlatform].full_access;
      }
      return this.currentSubscription[field] === 'requested';
    },
    needExtendedLicense () {
      let need = true;
      if (
        this.currentSubscription &&
        this.currentAccessPlatform &&
        this.currentSubscription.license_type !== LICENSE_TYPE.carto
      ) {
        need = false;
      }
      return need;
    },
    needRequestAccess () {
      let need = false;
      if (
        this.currentSubscription &&
        this.currentAccessPlatform &&
        this.currentSubscription.license_type !== LICENSE_TYPE.carto
      ) {
        const status = this.currentSubscription[PLATFORMS[this.currentAccessPlatform].full_access];
        if (status !== 'granted' && this.currentAccessPlatform !== 'bigquery') need = true;
      }
      return need;
    },
    subtitle () {
      let subtitle = '';

      if (this.needExtendedLicense) {
        subtitle = 'You need an extended license for this functionality';
      } else if (this.needRequestAccess) {
        subtitle = 'Please request access first';
      } else {
        subtitle = 'Access details';
      }

      return subtitle;
    }
  },
  methods: {
    requestExtendedLicense () {
      this.cleanErrors();
      this.sendToHubspotExtended();
      this.$store.dispatch('catalog/requestExtendedLicense', this.currentSubscription.id);
      this.sendRequestExtendedMetrics();
    },
    requestAccess () {
      this.cleanErrors();
      this.sendToHubspotAccess();
      this.$store.dispatch('catalog/requestAccess', {
        subscriptionId: this.currentSubscription.id,
        requestedPlatformProperty: PLATFORMS[this.currentAccessPlatform].full_access
      });
      this.sendRequestAccessMetrics();
    },
    sendToHubspotExtended () {
      this.$store.dispatch('catalog/requestAccessHubspot', {
        dataset: this.currentSubscription,
        platform: PLATFORMS[this.currentAccessPlatform].hubspot,
        type: 'License Extension'
      });
    },
    sendToHubspotAccess () {
      this.$store.dispatch('catalog/requestAccessHubspot', {
        dataset: this.currentSubscription,
        platform: PLATFORMS[this.currentAccessPlatform].hubspot,
        type: 'New Request'
      });
    },
    sendRequestExtendedMetrics () {
      this.$store.dispatch(
        'catalog/sendRequestExtendedMetrics',
        {
          datasetId: this.currentSubscription.id,
          licenseType: this.currentSubscription.license_type
        });
    },
    sendRequestAccessMetrics () {
      let platform = this.currentAccessPlatform;
      if (platform === 'bigquery') platform = 'bq';
      this.$store.dispatch(
        'catalog/sendRequestAccessMetrics',
        {
          datasetId: this.currentSubscription.id,
          platform,
          licenseType: this.currentSubscription.license_type
        });
    },
    cleanErrors () {
      this.$store.commit('catalog/setRequestError', null);
    },
    handleClose () {
      this.cleanErrors();
      this.$store.commit('catalog/setCurrentSubscription', null);
      this.$store.commit('catalog/setCurrentAccessPlatform', null);
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
h3.title {
  white-space: nowrap;
}
.main {
  width: 620px;
}

.alert {
  position: relative;
  &:before {
    content: '';
    position: absolute;
    display: block;
    top: -4px;
    left: -32px;
    height: 24px;
    width: 24px;
    background-image: url('../../assets/icons/common/alert.svg');
    background-position: center;
    background-repeat: no-repeat;
    background-size: 24px;
  }
}
.code-block-wrapper {
  label {
    flex: 1;
    text-align: right;
    text-transform: capitalize;
  }

  /deep/ .CodeMirror {
    border-radius: 4px;
    width: 512px;
    margin: 0;
  }
}
</style>
