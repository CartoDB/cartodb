<template>
  <Dialog ref="dialog"
    :headerTitle="$t('DataPage.deleteConnection')"
    :headerImage="require('../../../assets/icons/datasets/delete-connection.svg')"
    :showSubHeader="false"
  >
    <template #default>
      <div class="u-flex u-flex__direction--column u-flex__align--center u-mt--32">
        <div class="is-subtitle is-semibold">
          {{ $t('ConnectorsPage.removeModal.title', { connector }) }}
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
import { IMPORT_OPTIONS } from 'builder/components/modals/add-layer/content/imports/import-options';
import { mapState } from 'vuex';

export default {
  name: 'DeleteConnection',
  components: {
    Dialog
  },
  computed: {
    ...mapState({
      rawConnections: state => state.connectors.connections
    }),
    connection () {
      return this.rawConnections && this.rawConnections.find(conn => conn.id === this.$route.params.id);
    },
    connector () {
      let connectorTitle = '';
      if (this.connection) {
        const _connector = Object.values(IMPORT_OPTIONS)
          .find(({ name, options }) => this.connection.connector === name || this.connection.connector === (options && options.service));
        connectorTitle = _connector ? _connector.title : '';
      }
      return connectorTitle;
    }
  },
  methods: {
    cancel () {
      this.$refs.dialog.closePopup();
    },
    confirmDelete () {
      this.$store.dispatch('connectors/deleteConnection', this.$route.params.id);
      this.$refs.dialog.closePopup();
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
</style>
