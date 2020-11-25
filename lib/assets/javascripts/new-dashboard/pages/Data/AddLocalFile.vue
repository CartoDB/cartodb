<template>
  <Dialog
    :headerTitle="$t('DataPage.addDataset')"
    :headerImage="require('../../assets/icons/catalog/modal/subsc-add-icon.svg')"
  >
  <template slot="sub-header">
    <h3 class="is-caption is-regular is-txtMidGrey u-flex u-flex__align--center">
      <img class="u-mr--8" src="../../assets/icons/datasets/local-file.svg">
      {{ $t('DataPage.addLocalFile') }}
    </h3>
  </template>
    Add local file page
  </Dialog>
</template>

<script>

import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';

export default {
  name: 'AddLocalFile',
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
