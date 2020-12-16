<template>
  <Dialog
    :headerTitle="getHeaderTitleFromMode"
    :headerImage="require('../../assets/icons/datasets/subsc-add-icon.svg')"
    :showSubHeader="showSubheader"
    :backText="false"
  >
    <template #sub-header>
      <ul class="modal-tab title is-small">
        <li @click="selectTab(TABS.newDataset)" :class="{'is-selected' : selectedTab == TABS.newDataset}">{{$t('NewMapDatasetCard.tabs.newDataset')}}</li>
        <li @click="selectTab(TABS.yourDatasets)" :class="{'is-selected' : selectedTab == TABS.yourDatasets, 'is-deactivated': datasetsMetadata.total_entries == 0}">{{$t('NewMapDatasetCard.tabs.yourDatasets')}}</li>
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
            <ConnectorSection class="u-mt--24" :connectors="connections" @conenectionSelected="conenectionSelected"></ConnectorSection>
            <h3 class="is-caption is-semibold u-mt--36 u-mb--16">{{ $t('DataPage.fromNewConnections') }}</h3>
          </template>
          <ConnectorSection @connectorSelected="fileSelected" :label="$t('DataPage.localFiles')" :connectors="localFiles" carrousel></ConnectorSection>
          <ConnectorsList @connectorSelected="connectorSelected"></ConnectorsList>
        </template>
        <LoadingState v-else primary/>
      </div>
      <div v-else-if="selectedTab === TABS.yourDatasets || selectedTab === TABS.sharedWithYou">
        <DatasetsList
          :sharedTab='selectedTab === TABS.sharedWithYou'
          @datasetSelected="updateDatasetSelection"
        ></DatasetsList>
      </div>
    </template>
    <template #footer>
      <div v-if="selectedTab === TABS.yourDatasets || selectedTab === TABS.sharedWithYou" class="modal-footer u-flex u-flex__justify--end">
        <button :disabled="selectedDatasetsIds.length == 0" class="button is-primary">{{footerButtonText}}</button>
      </div>
    </template>
  </Dialog>
</template>

<script>

import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';
import ConnectorsList from 'new-dashboard/components/Connector/ConnectorsList';
import ConnectorSection from 'new-dashboard/components/Connector/ConnectorSection';
import LoadingState from 'new-dashboard/components/States/LoadingState';
import DatasetsList from 'new-dashboard/components/Connector/DatasetsList';
import { getImportOption } from 'new-dashboard/utils/connector/import-option';
import uploadData from 'new-dashboard/mixins/connector/uploadData';
import { mapState } from 'vuex';

const LOCAL_FILES = [
  {
    id: 'file-csv',
    label: 'CSV'
  },
  {
    id: 'file-geojson',
    label: 'GeoJSON'
  },
  {
    id: 'file-shapefile',
    label: 'Shapefile'
  },
  {
    id: 'file-gpkg',
    label: 'GeoPackage'
  },
  {
    id: 'file-kml',
    label: 'KML'
  },
  {
    id: 'file-excel',
    label: 'Excel'
  },
  {
    id: 'file-carto',
    label: 'CARTO'
  },
  {
    id: 'file-osm',
    label: 'OSM'
  },
  {
    id: 'file-gpx',
    label: 'GPX'
  },
  {
    id: 'file-ods',
    label: 'ODS'
  }
];

const TABS = {
  newDataset: 'new-dataset',
  yourDatasets: 'your-datasets',
  sharedWithYou: 'shared-with-you'
};

export default {
  name: 'NewDataset',
  mixins: [uploadData],
  components: {
    Dialog,
    ConnectorSection,
    ConnectorsList,
    LoadingState,
    DatasetsList
  },
  props: {
    mode: String
  },
  computed: {
    ...mapState({
      loading: state => state.connectors.loadingConnections,
      rawConnections: state => state.connectors.connections,
      datasetsMetadata: state => state.datasets.metadata
    }),
    connections () {
      return this.rawConnections ? this.rawConnections.map(raw => {
        const option = getImportOption(raw.connector);
        return { id: option.name, conenection_id: raw.id, label: raw.name, beta: option.options && option.options.beta };
      }) : [];
    },
    getRouteNamePrefix () {
      return this.$route.name.replace('new-dataset', '');
    },
    showSubheader () {
      return this.mode === 'map' || this.mode === 'layer';
    },
    footerButtonText () {
      return this.mode === 'map' ? this.$t(`DataPage.createMap`) : this.$t(`DataPage.createLayer`);
    }
  },
  data: () => {
    return {
      localFiles: LOCAL_FILES,
      selectedTab: TABS.newDataset,
      selectedDatasetsIds: []
    };
  },
  mounted: function () {
    this.$store.dispatch('connectors/fetchConnectionsList');
    this.$store.dispatch('datasets/setURLOptions', {filter: 'mine'});
  },
  created: function () {
    this.TABS = TABS;
    this.selectedTab = this.mode === 'dataset' ? TABS.newDataset : TABS.yourDatasets;
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
    conenectionSelected (id) {
      this.$router.push({ name: `${this.getRouteNamePrefix}new-dataset-connection-dataset`, params: { id: id } });
    },
    selectTab (tabName) {
      this.selectedTab = tabName;
    },
    updateDatasetSelection (datasets) {
      this.selectedDatasetsIds = Object.keys(datasets).filter(key => datasets[key]);
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

    &.is-deactivated {
      opacity: 0.48;
      pointer-events: none;
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
