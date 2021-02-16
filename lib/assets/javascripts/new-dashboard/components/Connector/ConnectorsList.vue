<template>
  <div>
    <ConnectorSection @connectorSelected="connectorSelected" :label="$t('DataPage.databases')" :connectors="dataBaseConnectors"></ConnectorSection>
    <ConnectorSection @connectorSelected="connectorSelected" :label="$t('DataPage.cloudFiles')" :connectors="cloudConnectors"></ConnectorSection>
    <ConnectorSection v-if="showAllConnectors" @connectorSelected="connectorSelected" :label="$t('DataPage.othersFiles')" :connectors="othersConnectors"></ConnectorSection>
    <template v-if="!requestedConnectorLoading">
      <template v-if="!requestedConnectorSuccess">
        <div class="u-flex u-mt--48 u-pt--32 u-pb--32 u-pr--48 u-pl--48 request-connector">
          <div class="u-flex__grow--1 message">
            <div class="is-small is-semibold">{{ $t('DataPage.requestConnector') }}</div>
            <div class="text is-small is-txtMidGrey u-mt--4">{{ $t('DataPage.requestConnectorSubtitle') }}</div>
          </div>
          <div class="u-flex__grow--1 u-flex u-flex__justify--end form">
            <div class="Form-rowData Form-rowData--noMargin Form-inputWrapper">
              <input type="text" v-model="requestedConnector" class="Form-input Form-inputInline Form-input--longer CDB-Text CDB-Size-medium" value="" :placeholder="$t('DataPage.requestConnectorPlaceholder')" />
              <button type="submit" class="Form-inputSubmitInline is-small is-txtPrimary is-semibold" @click="requestConnector" :disabled="!requestedConnector">
                <span>{{ $t('DataPage.requestConnectorSubmit') }}</span>
              </button>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="u-flex u-mt--48 u-pt--32 u-pb--32 u-pr--48 u-pl--48 request-connector">
          <div class="u-flex__grow--1 message">
            <div class="is-small is-semibold">{{ $t('DataPage.requestConnectorSuccess') }}</div>
            <div class="text is-small is-txtMidGrey u-mt--4">{{ $t('DataPage.requestConnectorSuccessSubtitle',  {connector: requestedConnector}) }}</div>
          </div>
          <div class="u-flex__grow--1 u-flex u-flex__justify--end form">
            <button type="button" class="button" @click="acceptSuccessRequest">
              <span>{{ $t('DataPage.requestConnectorSuccessButton') }}</span>
            </button>
          </div>
        </div>
      </template>
    </template>
    <template v-else>
      <div class="u-flex u-flex__direction--column u-flex__align--center u-flex__justify--center u-mt--48 u-pt--16 u-pb--24 u-pr--48 u-pl--48 request-connector">
        <div class="text is-small is-txtMidGrey u-mt--4 u-mb--16">{{ $t('DataPage.requestConnectorLoading') }}</div>
        <img svg-inline src="../../assets/icons/common/loading.svg" class="loading__svg"/>
      </div>
    </template>
  </div>
</template>

<script>

import ConnectorSection from 'new-dashboard/components/Connector/ConnectorSection';
import { IMPORT_OPTIONS, IMPORT_OPTIONS_ORDER } from 'builder/components/modals/add-layer/content/imports/import-options';
import { mapState } from 'vuex';

export default {
  name: 'ConnectorList',
  components: {
    ConnectorSection
  },
  props: {
    showAllConnectors: {
      default: true
    }
  },
  data: () => {
    return {
      requestedConnector: '',
      requestedConnectorLoading: false,
      requestedConnectorSuccess: false
    };
  },
  computed: {
    ...mapState({
      rawConnections: state => state.connectors.connections,
      twitterEnabled: state => state.user && state.user.twitter && state.user.twitter.enabled
    }),
    dataBaseConnectors () {
      return this.connectorsByType('database');
    },
    otherConnectors () {
      return this.connectorsByType('other');
    },
    cloudConnectors () {
      const connectors = this.connectorsByType('cloud');
      if (this.showAllConnectors) {
        connectors.push({ id: 'url', label: 'URL' });
      }
      return connectors;
    },
    othersConnectors () {
      const connectors = this.connectorsByType('other');
      if (!this.twitterEnabled) {
        return connectors.filter(c => c.id !== 'twitter');
      }
      return connectors;
    }
  },
  methods: {
    async requestConnector () {
      this.requestedConnectorLoading = true;
      await this.$store.dispatch('connectors/requestConnector', {
        user: this.$store.state.user,
        connector: this.requestedConnector
      });
      this.requestedConnectorLoading = false;
      this.requestedConnectorSuccess = true;
    },
    acceptSuccessRequest () {
      this.requestedConnectorSuccess = false;
      this.requestedConnector = '';
    },
    connectorsByType (type) {
      return IMPORT_OPTIONS_ORDER.reduce((acc, current) => {
        const opt = IMPORT_OPTIONS[current];
        if (opt.type === type) {
          acc.push(opt);
        }
        return acc;
      }, []).map(c => {
        return {
          id: c.name,
          label: c.title,
          beta: c.options && c.options.beta,
          disabled: !this.isConnectorEnabled(c)
        };
      });
    },
    connectorSelected (id) {
      this.$emit('connectorSelected', id);
    },
    isConnectorEnabled (c) {
      if (c.type === 'database' && c.name !== 'bigquery') {
        return true;
      }
      return this.rawConnections && !this.rawConnections.find(r => r.connector === (c.options && c.options.service));
    }
  }
};
</script>

<style scoped lang="scss">
  @import "new-dashboard/styles/variables";

  .loading__svg {
    height: 32px;
    width: 32px;
    outline: none;

    path {
      stroke: $blue--400;
      stroke-width: 2;
    }

    circle {
      stroke: $neutral--300;
      stroke-opacity: 1;
      stroke-width: 2;
    }
  }

  .request-connector {
    border: 1px solid $neutral--300;
    border-radius: 4px;
    margin-bottom: 24px;

    .Form-inputWrapper {
      width: 318px;
    }
  }
</style>
