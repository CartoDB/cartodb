const Backbone = require('backbone');

const MapLayer = Backbone.Model.extend({
  defaults: {
    visible: true,
    type: 'Tiled'
  }
});

module.exports = MapLayer;
