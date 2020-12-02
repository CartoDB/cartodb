<template>
  <div>
    <ConnectorSection label="Local files" :connectors="localFiles" carrousel></ConnectorSection>
    <ConnectorSection label="Databases" :connectors="databases"></ConnectorSection>
    <ConnectorSection label="Cloud files" :connectors="cloudFiles"></ConnectorSection>
  </div>
</template>

<script>

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

const CLOUD_FILES = [{
  id: 'gdrive',
  label: 'Google Drive'
}, {
  id: 'box',
  label: 'Box'
}, {
  id: 'dropbox',
  label: 'Dropbox'
}, {
  id: 'url',
  label: 'URL'
}];

const DATABASES = [{
  id: 'bigquery',
  label: 'BigQuery'
}, {
  id: 'snowflake',
  label: 'Snowflake'
}, {
  id: 'redshift',
  label: 'Redshift'
}, {
  id: 'mysql',
  label: 'MySQL'
}, {
  id: 'postgresql',
  label: 'PostgreSQL'
}, {
  id: 'sqlserver',
  label: 'SQL Server'
},
{
  id: 'hive',
  label: 'Hive'
}];

export default {
  name: 'ConnectorList',
  components: {
    ConnectorSection
  },
  data: () => {
    return {
      databases: DATABASES,
      cloudFiles: CLOUD_FILES,
      localFiles: LOCAL_FILES
    };
  },
  computed: {},
  methods: {}
};
</script>

<style scoped lang="scss">

</style>
