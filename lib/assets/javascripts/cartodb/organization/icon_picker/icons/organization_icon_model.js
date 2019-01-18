var Backbone = require('backbone-cdb-v3');
var _ = require('underscore-cdb-v3');

module.exports = Backbone.Model.extend({

  defaults: {
    selected: false,
    visible: false,
    deleted: false
  },

  fileAttribute: 'resource',

  save: function (attrs, options) {
    options || (options = {});
    attrs || (attrs = _.clone(this.attributes));

    // Filter the data to send to the server
    attrs = _.omit(attrs, ['selected', 'visible', 'deleted']);
    options.data = JSON.stringify(attrs);

    // Proxy the call to the original save function
    return Backbone.Model.prototype.save.call(this, attrs, options);
  }
});
