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
          <template slot="actionButton">
            <router-link :to="{ name: 'new-connection' }" v-if="connections.length">
              <button class="button is-primary">{{ $t(`DataPage.newConnection`) }}</button>
            </router-link>
          </template>
        </SectionTitle>
      </div>
      <div class="u-width--100 u-mt-50 grid-cell">
        <template v-if="initialState && home">
          <InitialState :title="$t(`DataPage.zeroCase.title`)">
            <template slot="icon">
              <img svg-inline src="../../../assets/icons/datasets/initialStateConnection.svg">
            </template>
            <template slot="description">
              <p class="text is-caption is-txtGrey" v-html="$t(`DataPage.zeroCase.description`)"></p>
            </template>
            <template slot="actionButton">
              <router-link :to="{ name: 'new-connection' }">
                <button class="button is-primary">{{ $t(`DataPage.zeroCase.createDataset`) }}</button>
              </router-link>
            </template>
          </InitialState>
        </template>
        <template v-else-if="!loading">
          <div class="emptyState u-pl--64 u-mb--60" v-if="!connections.length">
            <h3 class="is-body is-semibold u-mt--64">{{$t('DataPage.startAddingConnections')}}</h3>
            <p class="u-mt--16 is-caption">{{$t('DataPage.connectDescription')}}</p>
            <router-link :to="{ name: 'new-connection' }">
              <button class="button is-primary u-mt--48" style="margin-bottom: 56px;"> {{$t('DataPage.newConnection')}} </button>
            </router-link>
            <img class="logo" width="314" src="../../../assets/images/connectors/connectors.png">
          </div>
          <div class="connections-container grid" v-else>
            <div v-for="connection in connections" :key="connection.raw.id" class="connector-wrapper grid-cell grid-cell--col4">
              <Connection
                :id="connection.raw.id"
                :type="connection.default.name"
                :label="connection.default.title"
                :beta="connection.default.options.beta"
                :connectionName="connection.raw.name"
                :connectionParams="connection.raw.parameters"
                :connectionType="connection.default.type"
                @click.native="navigateToEditConnection(connection)"/>
            </div>
          </div>
        </template>
        <LoadingState v-else primary/>
      </div>
    </div>
    <router-view></router-view>
  </section>
</template>

<script>

import SectionTitle from 'new-dashboard/components/SectionTitle';
import LoadingState from 'new-dashboard/components/States/LoadingState';
import VisualizationsTitle from 'new-dashboard/components/VisualizationsTitle';
import Connection from 'new-dashboard/components/Connector/Connection';
import { getImportOption } from 'new-dashboard/utils/connector/import-option';
import InitialState from 'new-dashboard/components/States/InitialState';
import { mapState } from 'vuex';

export default {
  name: 'YourConnections',
  components: {
    LoadingState,
    SectionTitle,
    VisualizationsTitle,
    InitialState,
    Connection
  },
  props: {
    home: Boolean
  },
  computed: {
    ...mapState({
      loading: state => state.connectors.loadingConnections,
      rawConnections: state => state.connectors.connections,
      initialState: state => state.config.isFirstTimeViewingDashboard
    }),
    connections () {
      return this.rawConnections ? this.rawConnections.map(raw => {
        return { raw, default: getImportOption(raw.connector) };
      }) : [];
    }
  },
  mounted: function () {
    this.$store.dispatch('connectors/fetchConnectionsList');
  },
  methods: {
    navigateToEditConnection (connection) {
      if (connection.default.type === 'database') {
        this.$router.push({ name: 'edit-connection', params: { id: connection.raw.id } });
      }
    }
  }
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
