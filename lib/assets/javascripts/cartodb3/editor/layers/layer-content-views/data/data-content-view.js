var CoreView = require('backbone/core-view');

module.exports = CoreView.extend({
  className: 'Editor-dataContent',

  initialize: function (opts) {
    // if (!opts.layerDefinitionsCollection) throw new Error('layersDefinitionCollection is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.modals) throw new Error('modals is required');

    this._configModel = opts.configModel;
    // this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._modals = opts.modals;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.html('Data content view.');
    return this;
  }
});
