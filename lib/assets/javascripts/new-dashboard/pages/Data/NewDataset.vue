<template>
  <Dialog ref="dialog"
    :headerTitle="getHeaderTitleFromMode"
    :headerImage="require('../../assets/icons/datasets/subsc-add-icon.svg')"
    :showSubHeader="showSubheader"
    :backText="false"
  >
    <template #sub-header>
      <ul class="modal-tab title is-small">
        <li @click="selectTab(TABS.newDataset)" :class="{'is-selected' : selectedTab == TABS.newDataset}">{{$t('NewMapDatasetCard.tabs.newDataset')}}</li>
        <li @click="selectTab(TABS.yourDatasets)" :class="{'is-selected' : selectedTab == TABS.yourDatasets}">{{$t('NewMapDatasetCard.tabs.yourDatasets')}}</li>
        <li @click="selectTab(TABS.sharedWithYou)" :class="{'is-selected' : selectedTab == TABS.sharedWithYou}" v-if="datasetsMetadata.total_shared">
          {{$tc('NewMapDatasetCard.tabs.sharedWithYou', datasetsMetadata.total_shared)}}
        </li>
      </ul>
    </template>
    <template #default>
      <div v-if="selectedTab === TABS.newDataset">
        <template v-if="!loading">
          <template v-if="connections.length > 0">
            <h3 class="is-caption is-semibold">{{ $t('DataPage.fromYourConnections') }}</h3>
            <ConnectorSection class="u-mt--24" :connectors="connections" @connectionSelected="connectionSelected"></ConnectorSection>
            <h3 class="is-caption is-semibold u-mt--36 u-mb--16">{{ $t('DataPage.fromNewConnections') }}</h3>
          </template>
          <ConnectorSection @connectorSelected="fileSelected" :label="$t('DataPage.localFiles')" :connectors="localFiles" carousel></ConnectorSection>
          <ConnectorsList @connectorSelected="connectorSelected"></ConnectorsList>
        </template>
        <LoadingState v-else primary/>
      </div>
      <div ref="datasetListForConnectors" v-else-if="selectedTab === TABS.yourDatasets || selectedTab === TABS.sharedWithYou">
        <DatasetListForConnectors
          v-if="!creeatingMapOrLayer"
          :sharedTab='selectedTab === TABS.sharedWithYou'
          :multiSelect="mode==='map'"
          @datasetSelected="updateDatasetSelection"
          @goToConnectTab="selectTab(TABS.newDataset)"
        ></DatasetListForConnectors>
        <LoadingState v-else primary/>
      </div>
    </template>
    <template #footer>
      <div v-if="selectedTab === TABS.yourDatasets || selectedTab === TABS.sharedWithYou" class="modal-footer u-flex u-flex__justify--end">
        <button v-if="mode==='map' && !creeatingMapOrLayer" @click="createMap" :disabled="!canCreateMaps || selectedDatasets.length == 0" class="button is-primary">{{$t(`DataPage.createMap`)}}</button>
        <button v-if="mode==='layer' && !creeatingMapOrLayer" @click="createLayer" :disabled="selectedDatasets.length == 0" class="button is-primary">{{$t(`DataPage.createLayer`)}}</button>
      </div>
    </template>
  </Dialog>
</template>

<script>

import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';
import ConnectorsList from 'new-dashboard/components/Connector/ConnectorsList';
import ConnectorSection from 'new-dashboard/components/Connector/ConnectorSection';
import LoadingState from 'new-dashboard/components/States/LoadingState';
import DatasetListForConnectors from 'new-dashboard/components/Connector/DatasetListForConnectors';
import uploadData from 'new-dashboard/mixins/connector/uploadData';
import { getImportOption } from 'new-dashboard/utils/connector/import-option';
import { LOCAL_FILES } from 'new-dashboard/utils/connector/local-file-option';
import { mapState } from 'vuex';

const TABS = {
  newDataset: 'new-dataset',
  yourDatasets: 'your-datasets',
  sharedWithYou: 'shared-with-you'
};

export default {
  name: 'NewDataset',
  inject: ['addLayer'],
  mixins: [uploadData],
  components: {
    Dialog,
    ConnectorSection,
    ConnectorsList,
    LoadingState,
    DatasetListForConnectors
  },
  props: {
    mode: String
  },
  computed: {
    ...mapState({
      baseUrl: state => state.user.base_url,
      loading: state => state.connectors.loadingConnections,
      rawConnections: state => state.connectors.connections,
      datasetsMetadata: state => state.datasets.metadata
    }),
    connections () {
      return this.rawConnections ? this.rawConnections.map(raw => {
        const option = getImportOption(raw.connector);
        return { id: option.name, connection_id: raw.id, label: raw.name, beta: option.options && option.options.beta };
      }) : [];
    },
    getRouteNamePrefix () {
      return this.$route.name.replace('new-dataset', '');
    },
    showSubheader () {
      return (this.mode === 'map' || this.mode === 'layer') && (!this.creeatingMapOrLayer);
    },
    canCreateMaps () {
      return this.$store.getters['user/canCreateMaps'];
    }
  },
  data: () => {
    return {
      localFiles: LOCAL_FILES,
      selectedTab: TABS.newDataset,
      selectedDatasets: [],
      creeatingMapOrLayer: false
    };
  },
  created: function () {
    this.TABS = TABS;
    this.selectedTab = this.mode === 'dataset' ? TABS.newDataset : TABS.yourDatasets;
  },
  mounted: function () {
    this.$store.dispatch('connectors/fetchConnectionsList');
    this.$store.dispatch('datasets/setURLOptions', {filter: 'mine'});
  },
  methods: {
    fileSelected (id) {
      this.navigateToFile(id);
    },
    connectorSelected (id) {
      if (id === 'url') {
        this.navigateToFile(id);
        return true;
      }
      this.$router.push({ name: `${this.$route.name}-connector-selected`, params: { connector: id } });
    },
    navigateToFile (id) {
      this.$router.push({ name: `${this.getRouteNamePrefix}add-local-file`, params: { extension: id } });
    },
    connectionSelected (id) {
      this.$router.push({ name: `${this.getRouteNamePrefix}new-dataset-connection-dataset`, params: { id: id } });
    },
    selectTab (tabName) {
      this.selectedTab = tabName;
      this.selectedDatasets = [];
    },
    updateDatasetSelection (datasets) {
      this.selectedDatasets = datasets;
    },
    async createMap () {
      if (this.mode === 'map') {
        this.creeatingMapOrLayer = true;
        const id = await this.$store.dispatch('maps/createVisualizationFromDataset', this.selectedDatasets.map(d => d.name));
        window.location.replace(`${this.baseUrl}/builder/${id}`);
      }
    },
    createLayer () {
      this.creeatingMapOrLayer = true;
      this.addLayer({...this.selectedDatasets[0]}, this.$refs.datasetListForConnectors);
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.modal-tab {
  display: flex;

  li {
    margin-right: 24px;
    padding: 8px 0 14px;
    transition: border-color 0.1s;
    border-bottom: 4px solid transparent;
    color: $link__color;

    &:hover {
      border-color: $link__color;
      cursor: pointer;
    }

    &.is-selected {
      border-color: $text__color;
      color: $text__color;
    }
  }
}

.modal-footer {
  padding: 24px 0;
}

.align-right {
  text-align: right;
}
</style>
