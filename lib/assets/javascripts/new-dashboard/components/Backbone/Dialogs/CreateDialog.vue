<template>
  <div class="Dialog-content Dialog-content--expanded CreateDialog--new-dashboard" ref="injectionHTMLElement"></div>
</template>

<script>
import DialogView from 'dashboard/views/dashboard/dialogs/create-dialog/dialog-view';
import ModalModel from 'new-dashboard/plugins/backbone/modal-model';
import VisualizationModel from 'dashboard/data/visualization-model';

export default {
  name: 'CreateDialog',
  props: {
    backgroundPollingView: Object,
    dialogType: {
      type: String,
      default: 'maps'
    },
    selectedItems: Array
  },
  mounted () {
    this.dialog = this.renderDialog();
  },
  beforeDestroy () {
    this.dialog.clean();
  },
  methods: {
    renderDialog () {
      const configModel = this.$cartoModels.config;
      const userModel = this.$cartoModels.user;
      const backgroundPollingModel = this.$cartoModels.backgroundPolling;

      let selectedItems = [];
      if (this.$props.selectedItems && this.$props.selectedItems.length) {
        selectedItems = this.$props.selectedItems.map(
          item => new VisualizationModel(item, { configModel })
        );
      }

      const modalModel = ModalModel({
        destroy: () => this.$emit('close')
      });

      const routerModel = {
        isDatasets: () => this.$props.dialogType === 'dataset',
        isMaps: () => this.$props.dialogType === 'maps'
      };

      DialogView.setViewProperties({
        userModel,
        configModel,
        pollingModel: backgroundPollingModel,
        pollingView: this.$props.backgroundPollingView,
        routerModel: {
          model: routerModel
        }
      });

      DialogView.addProperties({
        // TODO: Update when Mamufas View is ready
        mamufasView: {
          enable: () => {},
          disable: () => {}
        }
      });

      const DialogViewInstance = DialogView.openDialog(
        { modalModel },
        {
          selectedItems,
          modalModel,
          viewElement: this.$refs.injectionHTMLElement,
          type: this.$props.dialogType
        }
      );

      DialogViewInstance.render();

      return DialogViewInstance;
    }
  }
};
</script>

<style lang="scss">
.Dialog {
  .CreateDialog--new-dashboard {
    .Dialog-footer,
    .ImportOptions {
      box-sizing: content-box;

      * {
        box-sizing: content-box;
      }
    }
  }
}
</style>
