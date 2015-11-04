var Backbone = require('backbone');
var LegendModel = require('./legend-model');

module.exports = Backbone.Collection.extend({
  model: LegendModel
});
