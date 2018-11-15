<template>
  <div class="Dialog-content Dialog-content--expanded" ref="injectionHTMLElement"></div>
</template>

<script>
import DuplicateMap from 'dashboard/views/dashboard/dialogs/duplicate-vis/duplicate-vis-view';
import VisualizationModel from 'dashboard/data/visualization-model';

export default {
  name: 'DuplicateMap',
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
      const visDefinitionModel = new VisualizationModel(this.$props.visualization, { configModel });
      const table = visDefinitionModel.tableMetadata();

      const duplicateMapView = new DuplicateMap({
        model: visDefinitionModel,
        table,
        configModel,
        userModel: this.$cartoModels.user,
        el: this.$refs.injectionHTMLElement,
        clean_on_hide: true
      });

      duplicateMapView.render();

      return duplicateMapView;
    }
  }
};
</script>
