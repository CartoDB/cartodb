var Backbone = require('backbone');
var NotifierModel = require('./notifier-model');

module.exports = Backbone.Collection.extend({
  model: NotifierModel,
  search: function (id) {
    return this.findWhere({id: id});
  }
});
