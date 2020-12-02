<template>
  <Dialog ref="dialog"
    :headerTitle="$t('DataPage.addConnection')"
    :headerImage="require('../../../assets/icons/datasets/add-connection.svg')"
  >
    <template slot="sub-header">
      <h3 class="is-caption is-regular is-txtMidGrey u-flex u-flex__align--center">
        <img height="21" class="u-mr--8" :src="logo">
        {{ $t('DataPage.connectWith') }} {{title}}
      </h3>
    </template>
    <template #default>
      <DatabaseConnectionForm
        v-if="type === 'database'"
        :connector="importOption"
      ></DatabaseConnectionForm>
    </template>
  </Dialog>
</template>

<script>

import exportedScssVars from 'new-dashboard/styles/variables.scss';
import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';
import DatabaseConnectionForm from 'new-dashboard/components/Connector/DatabaseConnectionForm';
import { IMPORT_OPTIONS } from 'builder/components/modals/add-layer/content/imports/import-options';

export default {
  name: 'EditConnection',
  components: {
    Dialog,
    DatabaseConnectionForm
  },
  computed: {
    importOption () {
      const option = Object.keys(IMPORT_OPTIONS).find(opt => IMPORT_OPTIONS[opt].name === this.$route.params.connector);
      return option && IMPORT_OPTIONS[option];
    },
    logo () {
      return this.importOption && `${exportedScssVars.assetsDir.replace(/\"/g, '')}/images/layout/connectors/${this.importOption.name}.svg`;
    },
    title () {
      return this.importOption && this.importOption.title;
    },
    type () {
      return this.importOption && this.importOption.type;
    }
  },
  methods: {}
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
</style>
