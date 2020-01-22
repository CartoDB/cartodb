<template>
  <div class="Dialog-content Dialog-content--expanded" ref="injectionHTMLElement"></div>
</template>

<script>
import ChangePrivacyView from 'dashboard/views/dashboard/dialogs/change-privacy/change-privacy-view';
import VisualizationModel from 'dashboard/data/visualization-model';
import Dialog from 'new-dashboard/components/Backbone/Dialog';
import ModalModel from 'new-dashboard/plugins/backbone/modal-model';

export default {
  name: 'ChangePrivacy',
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
      const modalModel = ModalModel({
        create: createModalView => this.openDialog(createModalView),
        destroy: () => this.$emit('close')
      });

      const visModel = new VisualizationModel(this.$props.visualization, {
        configModel: this.$cartoModels.config
      });

      visModel.on('change', model => {
        this.$store.dispatch('user/updateData');
        this.$emit('updateVisualization', model);
        this.$emit('deselectAll');
      });

      const changePrivacyView = new ChangePrivacyView({
        visModel,
        userModel: this.$cartoModels.user,
        configModel: this.$cartoModels.config,
        modals: modalModel,
        modalModel,
        el: this.$refs.injectionHTMLElement
      });

      changePrivacyView._onShareClose = () => {};
      changePrivacyView.render();

      return changePrivacyView;
    },

    openDialog (createModalView) {
      const modalModel = {
        destroy: () => {}
      };

      const modalView = createModalView(modalModel);
      modalView.render();

      this.$modal.show({
        template: `
        <Dialog @close="$emit('close')">
          <div ref="dialogInjectionNode"></div>
        </Dialog>`,
        components: { Dialog },
        mounted: function () {
          // Replace injection node with Dialog
          const reference = this.$refs.dialogInjectionNode;
          const parentNode = reference.parentNode;
          parentNode.replaceChild(modalView.el, reference);

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
