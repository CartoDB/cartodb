<template>
  <div class="Dialog-content Dialog-content--expanded">
    <div ref="injectionHTMLElement"></div>
  </div>
</template>

<script>
import DeleteItemsView from 'dashboard/views/dashboard/dialogs/delete-items/delete-items-view';
import DeleteItemsViewModel from 'dashboard/views/dashboard/dialogs/delete-items/delete-items-view-model';
import VisualizationModel from 'dashboard/data/visualization-model';
import ModalModel from 'new-dashboard/plugins/backbone/modal-model';

export default {
  name: 'DeleteDialog',
  props: {
    visualizations: Array,
    visualization: Object,
    contentType: String
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
      const modalModel = ModalModel({
        destroy: function () { this.$emit('close'); }.bind(this)
      });

      const visualizationItems = this.$props.visualization
        ? [new VisualizationModel(this.$props.visualization, { configModel })]
        : this.$props.visualizations.map(visualization => new VisualizationModel(visualization, { configModel }));

      const viewModel = new DeleteItemsViewModel(visualizationItems, {
        contentType: this.$props.contentType
      });

      viewModel.bind('DeleteItemsDone', () => {
        this.$store.dispatch('user/updateData'); // needed in order to keep the 'quota' synchronized
        this.$emit('fetchList');
        this.$emit('deselectAll');
      });

      const deleteItemsView = new DeleteItemsView({
        modalModel,
        viewModel,
        configModel,
        userModel: this.$cartoModels.user,
        el: this.$refs.injectionHTMLElement
      });

      deleteItemsView.render();

      return deleteItemsView;
    }
  }
};
</script>
