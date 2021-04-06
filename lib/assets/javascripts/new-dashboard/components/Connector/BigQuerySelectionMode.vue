<template>
  <div class="u-flex u-flex__justify--center">
    <BigQueryConnectionForm v-if="isServiceAccountdModeSelected"
      :connection="connection" @cancel="$emit('cancel')" @connectionSuccess="connectionSuccess">
    </BigQueryConnectionForm>
    <BigQueryConnectionOAuth v-else-if="isOAuthModeSelected"
      :connection="connection" @cancel="$emit('cancel')" @connectionSuccess="connectionSuccess">
    </BigQueryConnectionOAuth>
    <div class="main" v-else>
      <div class="section-header is-semibold is-small">
        {{$t('ConnectorsPage.BigQuery.fileInputLabel')}}
      </div>
      <div class="u-flex u-flex__justify--between u-mt--24">
        <div @click="selectMode(connectionModes.OAUTH)" class="mode oauth">
          <img svg-inline src="../../assets/icons/datasets/oauth.svg"/>
          <span class="is-semibold is-caption u-mt--16">OAuth</span>
          <span class="text is-txtMidGrey is-caption u-mt--9">{{$t('ConnectorsPage.BigQuery.oauthSmallDescription')}}</span>
        </div>
        <div @click="selectMode(connectionModes.SERVICE_ACCOUNT)" class="mode serviceAccount">
          <img svg-inline src="../../assets/icons/datasets/service-account.svg"/>
          <span class="is-semibold is-caption u-mt--16">Service Account</span>
          <span class="text is-txtMidGrey is-caption u-mt--9">{{$t('ConnectorsPage.BigQuery.serviceAccountSmallDescription')}}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import getCARTOData from 'new-dashboard/store/utils/getCARTOData';
import BigQueryConnectionForm from 'new-dashboard/components/Connector/BigQueryConnectionForm';
import BigQueryConnectionOAuth from 'new-dashboard/components/Connector/BigQueryConnectionOAuth';

const CONNECTION_MODES = {
  SERVICE_ACCOUNT: 'service-account',
  OAUTH: 'oauth'
};

export default {
  name: 'BigQuerySelectionMode',
  components: {
    BigQueryConnectionForm,
    BigQueryConnectionOAuth
  },
  mixins: [],
  props: {
    connection: null
  },
  data () {
    return {
      selected: null,
      connectionModes: CONNECTION_MODES
    };
  },
  mounted () {
    if (this.connection && this.connection.type === 'oauth-service') {
      this.selected = CONNECTION_MODES.OAUTH;
    } else if (this.connection || !this.hasBigQueryOauthEnabled) {
      this.selected = CONNECTION_MODES.SERVICE_ACCOUNT;
    }
  },
  computed: {
    hasBigQueryOauthEnabled () {
      const CARTOData = getCARTOData();
      return CARTOData.config && !!CARTOData.config.oauth_bigquery;
    },
    isServiceAccountdModeSelected () {
      return this.selected === CONNECTION_MODES.SERVICE_ACCOUNT;
    },
    isOAuthModeSelected () {
      return this.selected === CONNECTION_MODES.OAUTH;
    }
  },
  methods: {
    selectMode (mode) {
      this.selected = mode;
    },
    connectionSuccess (id) {
      this.$emit('connectionSuccess', id);
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
.main {
  width: 620px;

  .mode {
    display: flex;
    flex-flow: column;
    align-items: center;
    padding: 24px 36px;
    width: 300px;
    height: 193px;
    border-radius: 4px;
    box-shadow: 0 8px 12px 0 #c8d2da;
    border: solid 1px $neutral--300;
    background-color: $white;
    cursor: pointer;

    .text {
      text-align: center;
    }
  }
}
</style>
