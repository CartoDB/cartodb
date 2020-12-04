<template>
  <section class="u-mt--64">
    <div class="container grid">
      <div class="u-width--100">
        <SectionTitle class="grid-cell">
          <template slot="icon">
            <img src="../../../assets/icons/datasets/connection.svg" width="24" height="24" />
          </template>
          <template slot="title">
            <VisualizationsTitle :defaultTitle="$t('DataPage.tabs.connections')"/>
          </template>
        </SectionTitle>
      </div>
      <div class="u-width--100 u-mt-50 grid-cell">
        <div class="emptyState u-pl--64 u-mb--60" v-if="!connections || !connections.length">
          <h3 class="is-body is-semibold u-mt--64">{{$t('DataPage.startAddingConnections')}}</h3>
          <p class="u-mt--16 is-caption">{{$t('DataPage.connectDescription')}}</p>
          <router-link :to="{ name: 'new-connection' }">
            <button class="button is-primary u-mt--48" style="margin-bottom: 56px;"> {{$t('DataPage.newConnection')}} </button>
          </router-link>
          <img class="logo" width="314" src="../../../assets/images/connectors/connectors.png">
        </div>
        <div class="connections-container grid" v-else>
          <div v-for="connection in connections" :key="connection.raw.id" class="connector-wrapper grid-cell grid-cell--col4">
            <ConnectorLarge
              :type="connection.raw.connector"
              :label="connection.default.title"
              :beta="connection.default.options.beta"
              :connectionName="connection.raw.name"
              :connectionParams="connection.raw.parameters"
              :connectionType="connection.default.type"/>
          </div>
        </div>
      </div>
    </div>
    <router-view></router-view>
  </section>
</template>

<script>

import SectionTitle from 'new-dashboard/components/SectionTitle';
import VisualizationsTitle from 'new-dashboard/components/VisualizationsTitle';
import ConnectorLarge from 'new-dashboard/components/Connector/ConnectorLarge';
import { IMPORT_OPTIONS } from 'builder/components/modals/add-layer/content/imports/import-options';

export default {
  name: 'YourConnections',
  components: {
    SectionTitle,
    VisualizationsTitle,
    ConnectorLarge
  },
  data: () => {
    return {
      rawConnections: [
        {id: '36103518-12a5-4983-9b1f-c7abb5887a90', name: 'A_very_very_very_long_connection_name', connector: 'mysql', type: 'db-connector', parameters: {server: 'x'}},
        {id: '36103518-12a5-4983-9b1f-c7abb5887a99', name: 'othercon2', connector: 'bigquery', type: 'db-connector', parameters: {server: 'x'}},
        {id: '36103518-12a5-4983-9b1f-c7abb5887a98', name: 'othercon3', connector: 'gdrive', type: 'db-connector', parameters: {server: 'x'}},
        {id: '36103518-12a5-4983-9b1f-c7abb5887a97', name: 'othercon4', connector: 'postgresql', type: 'db-connector', parameters: {server: 'x'}}
      ]
    };
  },
  computed: {
    connections () {
      return this.rawConnections.map(raw => {
        return {raw, default: Object.values(IMPORT_OPTIONS).find(({ name }) => raw.connector === name)};
      });
    }
  },
  methods: {}
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
.emptyState {
  border-radius: 4px;
  border: solid 1px #dddddd;
  position: relative;
  p {
    max-width: 467px;
  }
  .logo {
    position: absolute;
    right: 0;
    top: 0;
  }
}

.connections-container {
  .connector-wrapper {
    padding: 0;

    &:not(:nth-child(3n)) {
      padding-right: 28px;
    }

    &:not(:nth-child(-n+3)) {
      margin-top: 28px;
    }
  }
}
</style>
