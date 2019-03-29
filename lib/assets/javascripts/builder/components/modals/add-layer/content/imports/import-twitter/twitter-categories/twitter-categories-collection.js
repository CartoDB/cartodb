var Backbone = require('backbone');
var TwitterCategoryModel = require('./twitter-category-model');

// Twitter categories collection

module.exports = Backbone.Collection.extend({
  model: TwitterCategoryModel
});
