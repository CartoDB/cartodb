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
        backgroundPollingView._onDroppedFile(files);
      });

      mamufasView.enable();

      return mamufasView;
    },

    getView () {
      return this.mamufasView;
    }
  }
};
</script>
