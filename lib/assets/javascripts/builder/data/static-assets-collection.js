var StaticAssetModel = require('./static-asset-model');
var AssetsCollection = require('./assets-collection');

module.exports = AssetsCollection.extend({
  model: StaticAssetModel,

  url: function () {
    return '';
  },

  initialize: function (models, opts) {

  },

  parse: function (resp, xhr) {
    return [];
  }
});
