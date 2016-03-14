var template = require('./layer-analysis-source-view.tpl');
var LayerAnalysisRefView = require('./layer-analysis-ref-view');

/**
 * View for a analysis source (i.e. SQL query).
 *
 * this.model is expected to be a analysis-definition-node-model
 */
module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.layerAnalysisViewFactory) throw new Error('layerAnalysisViewFactory is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._layerAnalysisViewFactory = opts.layerAnalysisViewFactory;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    var letter = this.model.letter();

    if (letter === this._layerDefinitionModel.get('letter')) {
      this.$el.html(this._html());
    } else {
      this._renderRefView(letter);
    }

    return this;
  },

  _html: function () {
    return template({
      id: this.model.id,
      tableName: this._layerDefinitionModel.layerTableModel.get('table_name')
    });
  },

  _renderRefView: function (letter) {
    var view = new LayerAnalysisRefView({
      model: this._getLayerDefinitionByLetter(letter)
    });
    this.addView(view);
    this.$el.append(view.render().$el);
  },

  _getLayerDefinitionByLetter: function (letter) {
    return this._layerDefinitionModel.collection.find(function (m) {
      return m.get('letter') === letter;
    });
  }
});
