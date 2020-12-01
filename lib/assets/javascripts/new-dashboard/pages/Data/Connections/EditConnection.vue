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
      <div class="u-flex u-flex__justify--center">
        <div>
          <h4 class="is-small is-semibold">Your {{title}} credentials</h4>
          <div class="u-flex u-flex__align--center u-flex__justify--between u-mt--24 input-wrapper">
            <label class="is-small u-mr--16">Name</label>
            <input type="text">
          </div>
          <div class="u-flex u-flex__align--center u-flex__justify--between u-mt--16 input-wrapper">
            <label class="is-small u-mr--16">Password</label>
            <input type="text">
          </div>
        </div>
        <div class="info u-ml--80 ">
          <h4 class="is-small is-semibold u-mb--8">{{ $t('DataPage.gettingConnected') }}</h4>
          <p class="u-mt--10 is-txtMidGrey is-small">
            {{ $t('DataPage.connectInfo') }}
          </p>
          <div class="ports u-pt--16 u-pb--16 u-pl--24 u-pr--24 u-mt--16 is-txtMidGrey is-small u-flex u-flex__direction--column u-flex__justify--between">
            <span>54.68.30.98</span>
            <span> 54.68.45.3</span>
            <span>54.164.204.122</span>
            <span>54.172.100.146</span>
          </div>
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script>

import exportedScssVars from 'new-dashboard/styles/variables.scss';
import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';
import { IMPORT_OPTIONS } from 'builder/components/modals/add-layer/content/imports/import-options';

export default {
  name: 'EditConnection',
  components: {
    Dialog
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
    }
  },
  methods: {}
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
.info {
  flex: 0 0 160px;
}
.ports {
  border: solid 1px #dddddd;
  border-radius: 4px;
  height: 109px;
}
.input-wrapper {
  label {
    flex: 1;
    text-align: right;
  }
  input {
    width: 385px;
  }
}
</style>
