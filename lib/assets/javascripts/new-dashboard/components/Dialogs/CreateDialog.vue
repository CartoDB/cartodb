<template>
  <section class="Dialog is-white">
    <div class="Dialog-contentWrapper Dialog-contentWrapper--withHeaderWrapper js-content">
      <div class="Dialog-content Dialog-content--expanded" ref="injectionHTMLElement"></div>
    </div>
  </section>
</template>

<script>
import DialogView from 'dashboard/views/dashboard/dialogs/create-dialog/dialog-view';
import Factories from 'new-dashboard/plugins/backbone/factories';

export default {
  name: 'CreateDialog',
  props: {
    dialogType: String,
    backgroundPollingView: Object
  },
  mounted () {
    this.createDialog = this.renderDialog();
  },
  beforeDestroy () {
    this.createDialog.clean();
  },
  methods: {
    renderDialog () {
      const configModel = this.$cartoModels.config;
      const userModel = this.$cartoModels.user;
      const backgroundPollingModel = this.$cartoModels.backgroundPolling;

      const modalModel = Factories.ModalModel({
        destroy: function () { this.$emit('close'); }.bind(this)
      });

      const routerModel = {
        isDatasets: () => this.$props.dialogType === 'datasets',
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
        mamufasView: {
          enable: () => {},
          disable: () => {}
        }
      });

      const DialogViewInstance = DialogView.openDialog(
        { modalModel },
        {
          selectedItems: [],
          modalModel,
          viewElement: this.$refs.injectionHTMLElement
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
  * {
    box-sizing: content-box;
  }
}
</style>
