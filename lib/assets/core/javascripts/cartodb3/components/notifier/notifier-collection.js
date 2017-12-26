var Backbone = require('backbone');
var NotifierModel = require('./notifier-model');

module.exports = Backbone.Collection.extend({
  model: function (attrs, opts) {
    return new NotifierModel(attrs, opts);
  },

  findById: function (id) {
    return this.findWhere({id: id});
  }
});
