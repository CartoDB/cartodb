<template>
  <div class="Dialog-content Dialog-content--expanded" ref="injectionHTMLElement"></div>
</template>

<script>
import MapMetadataDialog from 'builder/components/modals/map-metadata/map-metadata-view';
import ModalModel from 'new-dashboard/plugins/backbone/modal-model';
import VisualizationModel from 'dashboard/data/visualization-model';

export default {
  name: 'MapMetadata',
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

      const visDefinitionModel = new VisualizationModel(
        this.$props.visualization,
        { configModel: this.$cartoModels.config }
      );

      visDefinitionModel.on('change', model => {
        this.$emit('updateVisualization', model);
      });

      const mapMetadataView = new MapMetadataDialog({
        modalModel,
        visDefinitionModel,
        el: this.$refs.injectionHTMLElement
      });

      mapMetadataView.render();

      return mapMetadataView;
    }
  }
};
</script>
