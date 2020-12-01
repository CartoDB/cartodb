<template>
  <Dialog ref="dialog"
    :headerTitle="$t('DataPage.addDataset')"
    :headerImage="require('../../../assets/icons/datasets/subsc-add-icon.svg')"
    :showSubHeader="true"
  >
    <template #default>
      Datasets Connection
    </template>
  </Dialog>
</template>

<script>

import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';

export default {
  name: 'DatasetsConnection',
  components: {
    Dialog
  },
  computed: {},
  methods: {}
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
</style>
