<template>
  <div>
    <ConnectorSection @connectorSelected="connectorSelected" :label="$t('DataPage.databases')" :connectors="dataBaseConnectors"></ConnectorSection>
    <ConnectorSection @connectorSelected="connectorSelected" :label="$t('DataPage.cloudFiles')" :connectors="cloudConnectors"></ConnectorSection>
  </div>
</template>

<script>

import ConnectorSection from 'new-dashboard/components/Connector/ConnectorSection';
import { IMPORT_OPTIONS, IMPORT_OPTIONS_ORDER } from 'builder/components/modals/add-layer/content/imports/import-options';

export default {
  name: 'ConnectorList',
  components: {
    ConnectorSection
  },
  data: () => {
    return {};
  },
  computed: {
    dataBaseConnectors () {
      return this.connectorsByType('database');
    },
    cloudConnectors () {
      const connectors = this.connectorsByType('cloud');
      connectors.push({id: 'url', label: 'URL'});
      return connectors;
    }
  },
  methods: {
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
          beta: c.options && c.options.beta
        };
      });
    },
    connectorSelected (id) {
      this.$emit('connectorSelected', id);
    }
  }
};
</script>

<style scoped lang="scss">

</style>
