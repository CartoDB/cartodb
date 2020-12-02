<template>
  <div>
    <ConnectorSection :label="$t('DataPage.databases')" :connectors="databases"></ConnectorSection>
    <ConnectorSection :label="$t('DataPage.cloudFiles')" :connectors="cloudFiles"></ConnectorSection>
  </div>
</template>

<script>

import ConnectorSection from 'new-dashboard/components/Connector/ConnectorSection';

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
      cloudFiles: CLOUD_FILES
    };
  },
  computed: {},
  methods: {}
};
</script>

<style scoped lang="scss">

</style>
