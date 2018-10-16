<template>
  <section class="Dialog-contentWrapper Dialog-contentWrapper--withHeaderWrapper js-content">
    <div class="Dialog-content Dialog-content--expanded" ref="injectionHTMLElement"></div>
  </section>
</template>

<script>
import ChangePrivacyView from 'dashboard/views/dashboard/dialogs/change-privacy/change-privacy-view';
import Factories from '../factories';

export default {
  name: 'ChangePrivacy',
  props: {
    visualization: Object
  },
  mounted() {
    this.renderDialog();
  },
  methods: {
    renderDialog() {
      const configModel = Factories.ConfigModel(this.$store.state.config);
      const userModel = Factories.UserModel(this.$store.state.user);

      const modalModel = Factories.ModalModel({
        destroy: function () { this.$emit('close') }.bind(this)
      });

      const visualizationModel = Factories.VisualizationModel(this.$props.visualization, { configModel });
      visualizationModel.on('change', (model, options) => {
        this.$store.commit('visualizationChanged', model);
      });

      const changePrivacyView = new ChangePrivacyView({
        visModel: visualizationModel,
        userModel,
        configModel,
        modals: modalModel,
        modalModel,
        el: this.$refs.injectionHTMLElement
      });

      changePrivacyView.render();
    }
  }
}
</script>
