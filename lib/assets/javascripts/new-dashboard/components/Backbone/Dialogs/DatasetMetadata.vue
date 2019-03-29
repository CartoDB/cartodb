<template>
  <div class="Dialog-content Dialog-content--expanded" ref="injectionHTMLElement"></div>
</template>

<script>
import DatasetMetadataDialog from 'builder/components/modals/dataset-metadata/dataset-metadata-view';
import ModalModel from 'new-dashboard/plugins/backbone/modal-model';
import VisualizationModel from 'dashboard/data/visualization-model';

export default {
  name: 'DatasetMetadata',
  props: {
    dataset: Object
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
        this.$props.dataset,
        { configModel: this.$cartoModels.config }
      );

      visDefinitionModel.on('change', model => {
        this.$emit('updateVisualization', model);
      });

      const datasetMetadataView = new DatasetMetadataDialog({
        modalModel,
        visDefinitionModel,
        configModel: this.$cartoModels.config,
        isLocked: visDefinitionModel.getTableModel().isSync(),
        el: this.$refs.injectionHTMLElement
      });

      datasetMetadataView.render();

      return datasetMetadataView;
    }
  }
};
</script>
