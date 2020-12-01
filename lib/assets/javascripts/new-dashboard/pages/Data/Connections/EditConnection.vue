<template>
  <Dialog ref="dialog"
    :headerTitle="$t('DataPage.addConnection')"
    :headerImage="require('../../../assets/icons/datasets/add-connection.svg')"
  >
    <template #default>
      New connection page
    </template>
  </Dialog>
</template>

<script>

import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';

export default {
  name: 'EditConnection',
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
