var Backbone = require('backbone');
var TwitterCategoryModel = require('./twitter_category_model');
  
// Twitter categories collection

module.exports = Backbone.Collection.extend({
  model: TwitterCategoryModel
});