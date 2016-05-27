var cdb = require('cartodb.js');
var BasemapHeader = require('./basemap-header-view.js');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');

    this.layerDefinitionModel = opts.layerDefinitionModel;
    this.stackLayoutModel = opts.stackLayoutModel;
  },

  render: function () {
    var header = new BasemapHeader({
      layerDefinitionModel: this.layerDefinitionModel
    });

    this.addView(header);
    this.$el.append(header.render().$el);

    return this;
  },

  _onClickBack: function () {
    this.stackLayoutModel.prevStep('layers');
  }

});
