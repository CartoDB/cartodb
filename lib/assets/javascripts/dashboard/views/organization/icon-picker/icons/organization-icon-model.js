const Backbone = require('backbone');
const _ = require('underscore');

module.exports = Backbone.Model.extend({
  defaults: {
    selected: false,
    visible: false,
    deleted: false
  },

  fileAttribute: 'resource',

  save: function (attrs, options) {
    options = options || {};
    attrs = attrs || _.clone(this.attributes);

    attrs = _.omit(attrs, ['selected', 'visible', 'deleted']);
    options.data = JSON.stringify(attrs);

    return Backbone.Model.prototype.save.call(this, attrs, options);
  }
});
