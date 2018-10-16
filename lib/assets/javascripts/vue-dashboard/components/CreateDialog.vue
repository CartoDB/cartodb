<template>
  <section class="Dialog-contentWrapper Dialog-contentWrapper--withHeaderWrapper js-content">
    <div class="Dialog-content Dialog-content--expanded" ref="injectionHTMLElement"></div>
  </section>
</template>

<script>
import DialogView from 'dashboard/views/dashboard/dialogs/create-dialog/dialog-view';
import Factories from '../factories';

export default {
  name: 'CreateDialog',
  mounted() {
    this.dialog = this.renderDialog();
  },
  destroyed() {
    this.dialog.destroy();
  },
  props: {
    dialogType: String,
    backgroundPollingView: Object
  },
  methods: {
    renderDialog() {
      // VIEW DESTROY IS MISSING!!!!!
      const configModel = this.$store.state.models.configModel;
      const userModel = this.$store.state.models.userModel;
      const backgroundPollingModel = this.$store.state.models.backgroundPollingModel;

      const modalModel = Factories.ModalModel({
        destroy: function () { this.$emit('close') }.bind(this)
      });

      const routerModel = {
        isDatasets: () => this.$props.dialogType === 'datasets',
        isMaps: () => this.$props.dialogType === 'maps'
      };
      console.log('isMaps', routerModel.isMaps())

      DialogView.setViewProperties({
        userModel,
        configModel,
        pollingModel: backgroundPollingModel,
        pollingView: this.$props.backgroundPollingView,
        routerModel: {
          model: routerModel
        },
      });

      DialogView.addProperties({
        mamufasView: {
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
    }
  }
}
</script>

<style lang="scss">
@import '../../../../../assets/stylesheets/common/dialog.scss';
</style>

