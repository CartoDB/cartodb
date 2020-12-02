<template>
  <Dialog ref="dialog"
    :headerTitle="$t('DataPage.addConnection')"
    :headerImage="require('../../../assets/icons/datasets/add-connection.svg')"
    :showSubHeader="false"
  >
    <template #default>
      <ConnectorsList></ConnectorsList>
    </template>
  </Dialog>
</template>

<script>

import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';
import ConnectorsList from 'new-dashboard/components/Connector/ConnectorsList';

export default {
  name: 'NewConnection',
  components: {
    Dialog,
    ConnectorsList
  },
  computed: {},
  methods: {}
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
</style>
