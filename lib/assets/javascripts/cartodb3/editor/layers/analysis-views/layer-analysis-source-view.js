var template = require('./layer-analysis-source-view.tpl');
var LayerAnalysisRefView = require('./layer-analysis-ref-view');

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

    var letter = this._letter();

    if (letter === this._layerDefinitionModel.get('letter')) {
      this.$el.html(template(this.model.pick('id', 'table_name')));
    } else {
      var otherLayerDefinitionModel = this._layerAnalysisViewFactory.getLayerDefinitionByLetter(letter);

      var layerAnalysisRefView = new LayerAnalysisRefView({
        model: this.model,
        layerDefinitionModel: otherLayerDefinitionModel
      });
      this.$el.append(layerAnalysisRefView.render().$el);
    }

    return this;
  },

  _letter: function () {
    return this.model.id.match(/([a-z]+)/)[0];
  }
});
