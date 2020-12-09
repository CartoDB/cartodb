<template>
  <Dialog ref="dialog"
    :headerTitle="$t('DataPage.deleteConnection')"
    :headerImage="require('../../../assets/icons/datasets/delete-connection.svg')"
    :showSubHeader="false"
  >
    <template #default>
      <div class="u-flex u-flex__direction--column u-flex__align--center u-mt--32">
        <div class="is-subtitle is-semibold">
          {{ $t('ConnectorsPage.removeModal.title') }}
        </div>
        <div class="is-caption u-mt--16">
          {{ $t('ConnectorsPage.removeModal.subtitle') }}
        </div>
        <div class="u-flex u-flex__justify--center u-mt--48">
          <button @click="cancel" class="button button--ghost u-mr--20">
              {{ $t('ConnectorsPage.removeModal.cancelButton') }}
          </button>
          <button @click="confirmDelete" class="button button--alert">
              {{ $t('ConnectorsPage.removeModal.removeButton') }}
          </button>
        </div>
      </div>
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
  methods: {
    cancel () {
      this.$refs.dialog.closePoup();
    },
    confirmDelete () {
      this.$store.dispatch('connectors/deleteConnection', this.$route.params.id);
      this.$refs.dialog.closePoup();
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
</style>
