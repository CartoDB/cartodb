<template>
  <section class="BackgroundPolling" ref="injectionHTMLElement">
  </section>
</template>

<script>
import BackgroundPollingView from 'dashboard/views/dashboard/background-polling/background-polling-view';

export default {
  name: 'BackgroundPollingView',
  props: {
    routeType: {
      type: String,
      default: 'maps'
    }
  },
  mounted () {
    this.backgroundPollingView = this.renderView();
  },
  beforeDestroy () {
    this.cleanView();
  },
  methods: {
    getBackgroundPollingView () {
      return this.backgroundPollingView;
    },
    renderView () {
      const backgroundPollingModel = this.$cartoModels.backgroundPolling;
      const configModel = this.$cartoModels.config;
      const userModel = this.$cartoModels.user;

      const backgroundPollingView = new BackgroundPollingView({
        model: backgroundPollingModel,
        createVis: this.$props.routeType === 'maps',
        userModel,
        configModel,
        el: this.$refs.injectionHTMLElement
      });

      backgroundPollingView.render();
      backgroundPollingView.model.on('change', model => {
        if (model.get('state') === 'complete') {
          if (this.$props.routeType === 'home') {
            this.$store.dispatch('recentContent/fetch');
            this.$store.dispatch('maps/fetch');
            this.$store.dispatch('datasets/fetch');
          }

          if (this.$props.routeType === 'maps') {
            this.$store.dispatch('maps/fetch');
          }

          if (this.$props.routeType === 'datasets') {
            this.$store.dispatch('datasets/fetch');
          }
        }
      });

      return backgroundPollingView;
    },
    cleanView () {
      this.backgroundPollingView.clean();
    }
  }
};
</script>
