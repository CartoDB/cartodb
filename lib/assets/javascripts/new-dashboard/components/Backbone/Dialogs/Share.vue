<template>
  <div class="Dialog-content Dialog-content--expanded" ref="injectionHTMLElement"></div>
</template>

<script>
import ShareView from 'dashboard/views/dashboard/dialogs/share/share-view';
import VisualizationModel from 'dashboard/data/visualization-model';
import Dialog from 'new-dashboard/components/Backbone/Dialog';
import ModalModel from 'new-dashboard/plugins/backbone/modal-model';

export default {
  name: 'Share',
  props: {
    visualization: Object
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

      const modalsServiceModel = {
        create: createModalView => this.openDialog(createModalView)
      };

      const modalModel = ModalModel({
        destroy: () => this.$emit('close')
      });

      const visModel = new VisualizationModel(this.$props.visualization, { configModel });

      const permissionModel = visModel.getPermissionModel();
      permissionModel.on('change', model => {
        this.$emit('updateVisualization', visModel);
      });

      const viewModel = new ShareView({
        configModel,
        userModel,
        visModel,
        modals: modalsServiceModel,
        modalModel,
        onClose: () => {},
        el: this.$refs.injectionHTMLElement
      });

      viewModel.render();

      return viewModel;
    },

    openDialog (createModalView) {
      const modalModel = {
        destroy: () => {}
      };

      const modalView = createModalView(modalModel);
      modalView.render();

      this.$modal.show({
        template: `
        <Dialog v-on:close="$emit('close')">
          <div ref="dialogInjectionNode"></div>
        </Dialog>`,
        components: { Dialog },
        mounted: function () {
          this.$refs.dialogInjectionNode.appendChild(modalView.el);

          // Hack to be able to close Share Modal
          modalModel.destroy = () => {
            this.$emit('close');
          };
        }
      }, {}, { width: '100%', height: '100%' });

      return modalModel;
    }
  }
};
</script>
