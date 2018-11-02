<template>
  <div class="Dialog-content Dialog-content--expanded" ref="injectionHTMLElement"></div>
</template>

<script>
import MapMetadataDialog from 'builder/components/modals/map-metadata/map-metadata-view.js';
import Factories from 'new-dashboard/plugins/backbone/factories';
import VisualizationModel from 'dashboard/data/visualization-model';

export default {
  name: 'MapMetadata',
  props: {
    visualization: Object
  },
  mounted () {
    this.createDialog = this.renderDialog();
  },
  beforeDestroy () {
    this.createDialog.clean();
  },
  methods: {
    renderDialog () {
      const modalModel = Factories.ModalModel({
        destroy: function () { this.$emit('close'); }.bind(this)
      });

      const visDefinitionModel = new VisualizationModel(this.$props.visualization, {
        configModel: this.$cartoModels.config
      });

      const mapMetadataView = new MapMetadataDialog({
        modalModel,
        visDefinitionModel,
        el: this.$refs.injectionHTMLElement
      });

      mapMetadataView.render();

      // Listen to close in Footer button
      const closeButton = mapMetadataView.$el.find('.js-close');
      closeButton.on('click', () => this.$emit('close'));

      // TODO: Update visualization store with new data coming from modal

      return mapMetadataView;
    }
  }
};
</script>
