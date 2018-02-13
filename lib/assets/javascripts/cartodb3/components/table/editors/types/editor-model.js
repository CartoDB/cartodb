var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({

  // Error labels will not be showed, not needed to be translated
  validate: function (attrs, opts) {
    if (attrs.type === 'number' && isNaN(attrs.value)) {
      return 'Number not valid';
    }

    if (attrs.type === 'boolean' && (!_.isBoolean(attrs.value) && attrs.value !== null)) {
      return 'Boolean not valid';
    }
  }

});
