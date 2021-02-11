<template>
  <Dialog ref="dialog"
    :headerTitle="$t('DataPage.addConnection')"
    :headerImage="require('../../../assets/icons/datasets/add-connection.svg')"
    :showSubHeader="false"
  >
    <template #default>
      <ConnectorsList v-if="!loading" @connectorSelected="connectorSelected" :showAllConnectors="false"></ConnectorsList>
      <LoadingState v-else primary/>
    </template>
  </Dialog>
</template>

<script>

import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';
import ConnectorsList from 'new-dashboard/components/Connector/ConnectorsList';
import LoadingState from 'new-dashboard/components/States/LoadingState';
import { mapState } from 'vuex';

export default {
  name: 'NewConnection',
  components: {
    Dialog,
    ConnectorsList,
    LoadingState
  },
  computed: {
    ...mapState({
      loading: state => state.connectors.loadingConnections
    })
  },
  mounted: function () {
    this.$store.dispatch('connectors/fetchConnectionsList');
  },
  methods: {
    connectorSelected (id) {
      this.$router.push({ name: 'new-connection-connector-selected', params: { connector: id } });
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
</style>
