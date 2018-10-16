<template>
  <section class="BackgroundPolling" ref="injectionHTMLElement">
  </section>
</template>

<script>
import BackgroundPollingView from 'dashboard/views/dashboard/background-polling/background-polling-view';
import Factories from '../factories';

export default {
  name: 'BackgroundPollingView',
  props: {
    // Props de la view
    routeType: {
      type: String,
      default: 'maps'
    }
  },
  mounted() {
    this.backgroundPollingView = this.renderView();
  },
  methods: {
    getBackgroundPollingView() {
      return this.backgroundPollingView;
    },
    renderView() {
      const backgroundPollingModel = this.$store.state.models.backgroundPollingModel;
      const configModel = this.$store.state.models.configModel;
      const userModel = this.$store.state.models.userModel;

      // Tener cuidado porque la ruta puede cambiar e isMaps no se actualizará
      const backgroundPollingView = new BackgroundPollingView({
        model: backgroundPollingModel,
        // Only create a visualization from an import if user is in maps section
        createVis: this.$props.routeType === 'maps',
        userModel,
        configModel,
        el: this.$refs.injectionHTMLElement
      });

      backgroundPollingView.render();

      return backgroundPollingView;
    }
  }
}
</script>
