var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({

  model: function (attrs, opts) {
    return new Backbone.Model(attrs, {
      label: attrs
    });
  }
});
