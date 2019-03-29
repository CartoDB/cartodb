var Backbone = require('backbone');
var moment = require('moment');

/**
 *  Default model for each field model
 *
 */

module.exports = Backbone.Model.extend({

  defaults: {
    attribute: '',
    value: '',
    type: 'string',
    readOnly: false
  },

  initialize: function () {
    // Validation control variable
    this.validationError = '';
    this.bind('valid', function () {
      this.validationError = '';
    }, this);
    this.bind('error', function (m, error) {
      this.validationError = error;
    });
  },

  _validate: function (attrs, options) {
    var valid = Backbone.Model.prototype._validate.apply(this, arguments);
    if (valid) {
      this.trigger('valid');
      return true;
    } else {
      return false;
    }
  },

  validate: function (attrs) {
    if (!attrs) return;

    var val = attrs.value;
    var type = attrs.type;

    if (attrs.type === 'number') {
      var pattern = /^(\+|-)?(?:[0-9]+|[0-9]*\.[0-9]+)$/;
      if (val && !pattern.test(val)) {
        return 'Invalid number';
      }
    }

    if (type === 'boolean') {
      if (val !== null && val !== true && val !== false) {
        return 'Invalid boolean';
      }
    }

    if (type === 'date') {
      if (val && !moment(val).isValid()) {
        return 'Invalid date';
      }
    }
  },

  getError: function () {
    return this.validationError;
  },

  isValid: function () {
    if (!this.validate) {
      return true;
    }
    return !this.validate(this.attributes) && this.validationError === '';
  }

});
