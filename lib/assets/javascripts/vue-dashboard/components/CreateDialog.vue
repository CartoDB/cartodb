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
    this.templateHTML = this.renderDialog();
  },
  methods: {
    renderDialog() {
      const modalModel = {
        render: () => console.log('render!!!'),
        destroy: () => console.log(arguments)
      };

      DialogView.setViewProperties({
        userModel: Factories.userModel(),
        configModel: Factories.configModel(),
        pollingModel: {
          stopPollings: () => {}
        },
        pollingView: {},
        routerModel: {},
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
      return DialogViewInstance.el.outerHTML;
    }
  }
}
</script>

<style lang="scss">
@import '../../../../../assets/stylesheets/common/dialog.scss';
</style>

