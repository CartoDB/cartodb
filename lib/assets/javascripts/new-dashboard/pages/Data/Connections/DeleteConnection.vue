<template>
  <Dialog ref="dialog"
    :headerTitle="$t('DataPage.deleteConnection')"
    :headerImage="require('../../../assets/icons/datasets/delete-connection.svg')"
    :showSubHeader="false"
  >
    <template #default>
      Delete connection page
    </template>
  </Dialog>
</template>

<script>

import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';

export default {
  name: 'DeleteConnection',
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
