var template = require('./default-layer-analysis-view.tpl');
var BaseLayerAnalysisView = require('./base-layer-analysis-view');
var AnalysisName = require('../analysis-name-map');

/**
 * View for an analysis node with a single input
 *
 * this.model is expected to be a analysis-definition-node-nodel
 */
module.exports = BaseLayerAnalysisView.extend({
  options: {
    isDraggable: true
  },

  tagName: 'li',

  className: 'Editor-ListAnalysis-item Editor-ListAnalysis-layer CDB-Text is-semibold CDB-Size-small js-analysis',

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this.model.on('change', this.render, this);
  },

  render: function () {
    this.$el.html(template({
      id: this.model.id,
      title: AnalysisName(this.model.get('type'))
    }));

    if (this.options.isDraggable) {
      this._addDraggableHelper();
    }

    return this;
  }

});
