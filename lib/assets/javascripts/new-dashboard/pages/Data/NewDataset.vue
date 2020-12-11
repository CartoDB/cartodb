<template>
  <Dialog
    :headerTitle="$t('DataPage.addDataset')"
    :headerImage="require('../../assets/icons/datasets/subsc-add-icon.svg')"
    :showSubHeader="false"
  >
    <template #default>
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
    </template>
  </Dialog>
</template>

<script>

import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';
import ConnectorsList from 'new-dashboard/components/Connector/ConnectorsList';
import ConnectorSection from 'new-dashboard/components/Connector/ConnectorSection';
import LoadingState from 'new-dashboard/components/States/LoadingState';
import { getImportOption } from 'new-dashboard/utils/connector/import-option';
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

export default {
  name: 'NewDataset',
  components: {
    Dialog,
    ConnectorSection,
    ConnectorsList,
    LoadingState
  },
  computed: {
    ...mapState({
      loading: state => state.connectors.loadingConnections,
      rawConnections: state => state.connectors.connections
    }),
    connections () {
      return this.rawConnections ? this.rawConnections.map(raw => {
        const option = getImportOption(raw.connector);
        return { id: option.name, conenection_id: raw.id, label: raw.name, beta: option.options && option.options.beta };
      }) : [];
    },
    getRouteNamePrefix () {
      return this.$route.name.replace('new-dataset', '');
    }
  },
  data: () => {
    return {
      localFiles: LOCAL_FILES
    };
  },
  mounted: function () {
    this.$store.dispatch('connectors/fetchConnectionsList');
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
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
</style>
