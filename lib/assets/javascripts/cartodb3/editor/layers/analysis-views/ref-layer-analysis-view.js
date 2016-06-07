var template = require('./ref-layer-analysis-view.tpl');
var BaseLayerAnalysisView = require('./base-layer-analysis-view');

/**
 * Reference to another layer.
 * this.model is a layer-definition-model
 */
module.exports = BaseLayerAnalysisView.extend({

  className: 'Editor-ListAnalysis-item Editor-ListAnalysis-layer CDB-Text is-semibold CDB-Size-small',

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this.model.on('change', this.render, this);
  },

  render: function () {
    this.$el.html(template({
      letter: this.model.get('letter'),
      title: this.model.getName()
    }));

    return this;
  }

});
