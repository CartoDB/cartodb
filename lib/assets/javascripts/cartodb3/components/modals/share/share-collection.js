var Backbone = require('backbone');
var ShareModel = require('./share-model');

module.exports = Backbone.Collection.extend({
  model: ShareModel
});
