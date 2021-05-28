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
            <span class="is-small is-semibold u-mb--8"> {{ subtitle }}</span>
            <div class="text is-small is-txtMidGrey">
              <template v-if="needExtendedLicense">
                <p>Your current license only allows you to access this dataset within CARTO. In order to access this dataset directly from your data warehouse (e.g. BigQuery, Snowflake, etc.) you need an extended license.</p>
                <p class="u-mt--16">Please request it and we will get back to you with more details.</p>
                <div class="u-flex u-flex__justify--center u-mt--32">
                  <button v-if="!hasBeenRequested" @click="requestExtendedLicense" class="CDB-Button CDB-Button--primary CDB-Button--big">Request extended license</button>
                  <SubscriptionRequestSuccess v-else />
                </div>
              </template>
              <template v-else-if="needRequestAccess">
                <p>Please confirm your request to access your Data Observatory subscription in Azure and we will get back to you shortly. Access details will be displayed on this page as soon as your request has been fulfilled.</p>
                <div class="u-flex u-flex__justify--center u-mt--32">
                  <button v-if="!hasBeenRequested" @click="requestAccess" class="CDB-Button CDB-Button--primary CDB-Button--big">Request access</button>
                  <SubscriptionRequestSuccess v-else />
                </div>
              </template>
              <template v-else>
                <BigQueryAccessParameters v-if="currentAccessPlatform === 'bigquery'" :subscription="currentSubscription"/>
                <OtherAccessParameters v-else :subscription="currentSubscription"/>
                <div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
      {{currentSubscription}}
    </template>
  </Dialog>
</template>

<script>

import { mapState } from 'vuex';
import exportedScssVars from 'new-dashboard/styles/helpers/_assetsDir.scss';
import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';
import SubscriptionRequestSuccess from './SubscriptionRequestSuccess.vue';
import BigQueryAccessParameters from './BigQueryAccessParameters.vue';
import OtherAccessParameters from './OtherAccessParameters.vue';

const PLATFORMS = {
  'bigquery': {
    name: 'BigQuery',
    full_access: 'full_access_status_bq'
  },
  'aws': {
    name: 'Amazon S3',
    full_access: 'full_access_status_aws'
  },
  'azure': {
    name: 'Azure',
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
      connectionsSuccessfullId: null,
      test: 'asdasd'
    };
  },
  computed: {
    ...mapState({
      currentSubscription: state => state.catalog.currentSubscription,
      currentAccessPlatform: state => state.catalog.currentAccessPlatform
    }),
    title () {
      if (this.currentAccessPlatform) {
        return PLATFORMS[this.currentAccessPlatform].name;
      }
    },
    logo () {
      if (this.currentAccessPlatform) {
        return `${exportedScssVars.assetsDir && exportedScssVars.assetsDir.replace(/\"/g, '')}/images/layout/platforms/${this.currentAccessPlatform}.svg`;
      }
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
      if (this.currentSubscription && this.currentAccessPlatform) {
        if (this.currentSubscription.license_type !== LICENSE_TYPE.carto) need = false;
      }
      return need;
    },
    needRequestAccess () {
      let need = false;
      if (this.currentSubscription && this.currentAccessPlatform) {
        if (this.currentSubscription.license_type !== LICENSE_TYPE.carto) {
          const status = this.currentSubscription[PLATFORMS[this.currentAccessPlatform].full_access];
          if (status !== 'granted' && this.currentAccessPlatform !== 'bigquery') need = true;
        }
      }
      return need;
    },
    subtitle () {
      let subtitle = '';

      if (this.needExtendedLicense) {
        subtitle = 'You need an extended license for this functionality';
      } else if (this.needRequestAccess) {
        subtitle = 'Access not fulfilled yet';
      } else {
        subtitle = 'Access details';
      }

      return subtitle;
    }
  },
  methods: {
    requestExtendedLicense () {
      this.$store.dispatch('catalog/requestExtendedLicense', this.currentSubscription.id);
    },
    requestAccess () {
      this.$store.dispatch('catalog/requestAccess', {
        subscriptionId: this.currentSubscription.id,
        requestedPlatformProperty: PLATFORMS[this.currentAccessPlatform].full_access
      });
    },
    handleClose () {
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
