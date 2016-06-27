var Backbone = require('backbone-cdb-v3');
var TwitterCategoryModel = require('./twitter_category_model');
  
// Twitter categories collection

module.exports = Backbone.Collection.extend({
  model: TwitterCategoryModel
});