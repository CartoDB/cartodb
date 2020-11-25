<template>
  <Dialog @close="close">
    <DialogHeader
      :title="'Add new dataset'"
      :image="require('../../assets/icons/catalog/modal/subsc-add-icon.svg')"
    ></DialogHeader>
    <div class="Dialog-body Dialog-body--expanded Dialog-body--create Dialog-body--noPaddingTop Dialog-body--withoutBorder Dialog-body--no-spacing"></div>
  </Dialog>
</template>

<script>

import Dialog from 'new-dashboard/components/Backbone/Dialog.vue';
import DialogHeader from 'new-dashboard/components/Dialogs/DialogHeader.vue';

export default {
  name: 'NewDataset',
  components: {
    Dialog,
    DialogHeader
  },
  computed: {},
  methods: {
    close () {
      this.$router.push({name: 'datasets'});
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
</style>
