var cdb = require('cartodb-deep-insights.js');
var template = require('./source-layer-analysis-view.tpl');
var LayerAnalysisDraggableHelperView = require('../layer-analysis-draggable-helper-view');

/**
 * View for a analysis source (i.e. SQL query).
 *
 * this.model is expected to be a analysis-definition-node-model and belong to the given layer-definition-model
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

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

    this.draggableHelperView = new LayerAnalysisDraggableHelperView({
      el: this.el
    });

    this.addView(this.draggableHelperView);
    this.draggableHelperView.bind('dropped', this._onDropped, this);

    return this;
  },

  _onDropped: function () {
    console.log('TODO: creates a new layer from ' + this.model.toJSON()); // TODO: replace with actual layer generation
  }

});
