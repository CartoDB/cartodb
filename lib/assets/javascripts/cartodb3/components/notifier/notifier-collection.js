var Backbone = require('backbone');
var NotifierModel = require('./notifier-model');

module.exports = Backbone.Collection.extend({
  model: function (attrs, opts) {
    var self = opts.collection;
    return new NotifierModel(attrs, {
      visDefinitionModel: opts.visDefinitionModel,
      collection: self
    });
  },

  findById: function (id) {
    return this.findWhere({id: id});
  }
});
