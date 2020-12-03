<template>
  <Dialog
    :headerTitle="$t('DataPage.addDataset')"
    :headerImage="require('../../assets/icons/datasets/subsc-add-icon.svg')"
    :showSubHeader="false"
  >
    <template #default>
      <h3 class="is-caption is-semibold u-mt--32">{{ $t('DataPage.fromYourConnections') }}</h3>
      <h3 class="is-caption is-semibold u-mt--36">{{ $t('DataPage.fromNewConnections') }}</h3>
      <ConnectorSection @connectorSelected="fileSelected" class="u-mt--16" :label="$t('DataPage.localFiles')" :connectors="localFiles" carrousel></ConnectorSection>
      <ConnectorsList @connectorSelected="connectorSelected"></ConnectorsList>
    </template>
  </Dialog>
</template>

<script>

import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';
import ConnectorsList from 'new-dashboard/components/Connector/ConnectorsList';
import ConnectorSection from 'new-dashboard/components/Connector/ConnectorSection';

const LOCAL_FILES = [
  {
    id: 'file-carto',
    label: 'CARTO'
  },
  {
    id: 'file-csv',
    label: 'CSV'
  },
  {
    id: 'file-excel',
    label: 'Excel'
  },
  {
    id: 'file-geojson',
    label: 'GeoJSON'
  },
  {
    id: 'file-gpkg',
    label: 'GeoPackage'
  },
  {
    id: 'file-gpx',
    label: 'GPX'
  },
  {
    id: 'file-kml',
    label: 'KML'
  },
  {
    id: 'file-ods',
    label: 'ODS'
  },
  {
    id: 'file-osm',
    label: 'OSM'
  },
  {
    id: 'file-shapefile',
    label: 'Shapefile'
  }
];

export default {
  name: 'NewDataset',
  components: {
    Dialog,
    ConnectorSection,
    ConnectorsList
  },
  computed: {},
  data: () => {
    return {
      localFiles: LOCAL_FILES
    };
  },
  methods: {
    fileSelected (id) {
      this.navigateToFile(id);
    },
    connectorSelected (id) {
      if (id === 'url') {
        this.navigateToFile(id);
        return;
      }
    },
    navigateToFile (id) {
      this.$router.push({name: 'add-local-file', params: { extension: id }});
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
</style>
