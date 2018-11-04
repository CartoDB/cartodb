<template>
  <div class="Dialog-content Dialog-content--expanded" ref="injectionHTMLElement"></div>
</template>

<script>
import ChangePrivacyView from 'dashboard/views/dashboard/dialogs/change-privacy/change-privacy-view';
import VisualizationModel from 'dashboard/data/visualization-model';
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
        destroy: () => this.$emit('close')
      });

      const visModel = new VisualizationModel(this.$props.visualization, {
        configModel: this.$cartoModels.config
      });

      visModel.on('change', model => {
        this.$store.dispatch('maps/updateMap', { mapId: model.get('id'), mapAttributes: model.attributes });
      });

      const changePrivacyView = new ChangePrivacyView({
        visModel,
        userModel: this.$cartoModels.user,
        configModel: this.$cartoModels.config,
        modals: modalModel,
        modalModel,
        el: this.$refs.injectionHTMLElement
      });

      changePrivacyView.render();

      return changePrivacyView;
    }
  }
};
</script>
