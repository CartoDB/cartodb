var Backbone = require('backbone');
var RenderModes = require('./render-modes');

var UISettings = Backbone.Model.extend({
  defaults: {
    showLegends: true,
    showLayerSelector: false,
    renderMode: RenderModes.AUTO
  }
});

module.exports = UISettings;
