var CoreView = require('backbone/core-view');
var template = require('./widget-header.tpl');

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!this.model) throw new Error('model is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
  },

  render: function () {
    this.$el.html(
      template({
        title: this.model.get('title'),
        source: this.model.get('source'),
        sourceColor: this._layerDefinitionModel.get('color'),
        layerName: this._layerDefinitionModel.getName()
      })
    );
    return this;
  }
});
