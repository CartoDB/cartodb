var template = require('./source-layer-analysis-view.tpl');
var BaseLayerAnalysisView = require('./base-layer-analysis-view');

/**
 * View for a analysis source (i.e. SQL query).
 *
 * this.model is expected to be a analysis-definition-node-model and belong to the given layer-definition-model
 */
module.exports = BaseLayerAnalysisView.extend({
  options: {
    isDraggable: true
  },

  _onClick: function (e) {
    this.killEvent(e);
  },

  className: 'Editor-ListAnalysis-item Editor-ListAnalysis-layer is-base js-analysis',

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
  },

  render: function () {
    this.$el.html(template({
      id: this.model.id,
      tableName: this._layerDefinitionModel.layerTableModel.get('table_name')
    }));

    if (this.options.isDraggable) {
      this._addDraggableHelper();
    }

    return this;
  }

});
