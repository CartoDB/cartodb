<template>
  <div class="Dialog-content Dialog-content--expanded">
    <div ref="injectionHTMLElement"></div>
  </div>
</template>

<script>
import ChangeLockView from 'dashboard/views/dashboard/dialogs/change-lock/change-lock-view';
import ChangeLockViewModel from 'dashboard/views/dashboard/dialogs/change-lock/change-lock-view-model';
import VisualizationModel from 'dashboard/data/visualization-model';
import ModalModel from 'new-dashboard/plugins/backbone/modal-model';

export default {
  name: 'LockVisualization',
  props: {
    visualizations: Array,
    visualization: Object,
    contentType: {
      type: String,
      required: true
    }
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
        destroy: () => this.$emit('close')
      });

      const visualizationItems = this.$props.visualization
        ? [new VisualizationModel(this.$props.visualization, { configModel })]
        : this.$props.visualizations.map(visualization => new VisualizationModel(visualization, { configModel }));

      const viewModel = new ChangeLockViewModel({
        items: visualizationItems,
        contentType: this.$props.contentType
      });

      viewModel.bind('change:state', () => {
        if (viewModel.get('state') === 'ProcessItemsDone') {
          this.$emit('fetchList');
          this.$emit('deselectAll');
          this.$emit('close');
        }
      });

      const changeLockView = new ChangeLockView({
        modalModel,
        model: viewModel,
        el: this.$refs.injectionHTMLElement
      });

      changeLockView.render();

      return changeLockView;
    }
  }
};
</script>
