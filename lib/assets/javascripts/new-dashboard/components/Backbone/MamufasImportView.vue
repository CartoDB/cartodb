<template>
  <div ref="injectionHTMLElement"></div>
</template>

<script>
import MamufasImportView from 'dashboard/components/mamufas-import/mamufas-import-view';

export default {
  name: 'MamufasImportView',
  inject: ['backboneViews'],
  mounted () {
    this.mamufasView = this.initView();
  },
  beforeDestroy () {
    this.mamufasView.clean();
  },
  methods: {
    initView () {
      const mamufasView = new MamufasImportView({
        el: document.body,
        userModel: this.$cartoModels.user
      });

      mamufasView.on('dialogOpened', () => {
        this.$cartoModels.backgroundPolling.stopPollings();
      });

      mamufasView.on('dialogClosed', () => {
        this.$cartoModels.backgroundPolling.startPollings();
      });

      mamufasView.on('fileDropped', files => {
        const backgroundPollingView = this.backboneViews.backgroundPollingView.getBackgroundPollingView();
        const filesToUpload = files.length ? Array.from(files) : [files];

        filesToUpload.forEach(file => {
          this.addVisPropertyToFile(file);
          backgroundPollingView._onDroppedFile(file);
        });
      });

      mamufasView.enable();

      return mamufasView;
    },

    getView () {
      return this.mamufasView;
    },

    addVisPropertyToFile (file) {
      if (this.isCARTOFile(file.name)) {
        file._createVis = true;
      }
    },

    isCARTOFile (filename) {
      return filename.indexOf('.carto') > -1 ||
        filename.indexOf('.zip') > -1;
    }
  }
};
</script>
