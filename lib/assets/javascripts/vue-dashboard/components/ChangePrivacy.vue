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
    this.templateHTML = this.renderDialog();
  },
  methods: {
    renderDialog() {
      const modalModel = {
        destroy: function () { this.$emit('close') }.bind(this)
      };

      const configModel = Factories.configModel(this.$store.state.config);
      const userModel = Factories.userModel(this.$store.state.user);

      const visualizationModel = Factories.visualizationModel(this.$props.visualization, { configModel });
      visualizationModel.on('change', (model, options) => {
        this.$store.commit('visualizationChanged', model);
      });

      const changePrivacyView = new ChangePrivacyView({
        visModel: visualizationModel,
        userModel,
        configModel,
        // modals: this._modals,
        modals: {},
        modalModel,
        el: this.$refs.injectionHTMLElement
      });

      changePrivacyView.render();
      return changePrivacyView.outerHTML;
    }
  }
}
</script>
