var template = require('./layer-analysis-ref-view.tpl');

/**
 * Reference to another layer.
 */
module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.letter) throw new Error('letter is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._letter = opts.letter;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._layerDefinitionModel.on('change', this.render, this);

    this.model.on('change', this.render, this);

    this.add_related_model(this._layerDefinitionModel);
  },

  render: function () {
    this.$el.html(template({
      id: this._letter,
      title: this._layerDefinitionModel.getName()
    }));

    return this;
  }
});
