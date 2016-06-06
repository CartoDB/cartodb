var Backbone = require('backbone');
var NotifierItemModel = require('./notifier-item-model');

module.exports = Backbone.Collection.extend({
  model: NotifierItemModel
});
