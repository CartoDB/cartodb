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
    <div class="u-flex u-flex__direction--column u-flex__align--center">
      <span class="is-small">{{ $t('DataPage.formats') }}: CSV, GeoJSON, GPKG, SHP, KML, OSM, CARTO, GPX, FGDB <a target="_blank" href="https://carto.com/developers/import-api/guides/importing-geospatial-data/#supported-geospatial-data-formats">{{ $t('DataPage.learnmore') }}</a></span>
      <div class="drag-zone u-mt--32 u-flex u-flex__direction--column u-flex__align--center u-flex__justify--center">
        <img src="../../assets/icons/datasets/move-up.svg">
        <h4 class="is-small is-semibold u-mt--16" style="text-align: center;">Drag and drop your file<br>or</h4>
        <button @click="selectFile()" class="button is-primary u-mt--16">Browse</button>
        <input ref="file" type="file">
      </div>
    </div>
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
  methods: {
    selectFile () {
      this.$refs.file.click();
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
.drag-zone {
  width: 460px;
  height: 204px;
  border-radius: 4px;
  border: dashed 2px #dddddd;
  background-color: $white;
}
input[type=file] {
  display: none;
}
</style>
