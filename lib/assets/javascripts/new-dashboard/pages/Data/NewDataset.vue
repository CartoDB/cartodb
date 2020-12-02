<template>
  <Dialog
    :headerTitle="$t('DataPage.addDataset')"
    :headerImage="require('../../assets/icons/datasets/subsc-add-icon.svg')"
    :showSubHeader="false"
  >
    <template #default>
      <h3 class="is-caption is-semibold u-mt--32">{{ $t('DataPage.fromYourConnections') }}</h3>
      <h3 class="is-caption is-semibold u-mt--36">{{ $t('DataPage.fromNewConnections') }}</h3>
      <ConnectorsList class="u-mt--16"></ConnectorsList>
    </template>
  </Dialog>
</template>

<script>

import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';
import ConnectorsList from 'new-dashboard/components/Connector/ConnectorsList';

export default {
  name: 'NewDataset',
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
