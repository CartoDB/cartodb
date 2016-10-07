var Backbone = require('backbone');

var UISettings = Backbone.Model.extend({
  defaults: {
    showLegends: true,
    showLayerSelector: false
  }
});

module.exports = UISettings;
