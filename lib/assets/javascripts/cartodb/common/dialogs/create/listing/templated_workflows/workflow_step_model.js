var cdb = require('cartodb.js');
var Backbone = require('backbone');

/**
 *  Workflows step form model
 *
 *  - Default model for templated workflows forms.
 *  - It will set its data from a 'formData' with setData function.
 *  
 */

module.exports = cdb.core.Model.extend({

  initialize: function(attrs, formData) {
    this.validationError = '';
    if (formData) {
      this._setData(formData);
    }
    this._initBinds();
  },

  _setData: function(formData) {
    var self = this;

    if (!formData) {
      return;
    }

    // Set model attributes (and values if they exist)
    if (formData) {
      _.each(formData, function(f) {
        _.each(f.form, function(opts, key, obj) {
          self.attributes[key] = (opts && opts.value) || '';
        });  
      });
    }

    // Validation?
    if (formData.validate) {
      _.extend(this, { validate: formData.validate });
    }
  },

  _validate: function(attrs, options) {
    var valid = cdb.core.Model.prototype._validate.apply(this, arguments);
    if (valid) {
      this.trigger('valid')
      return true;
    } else {
      return false;
    }
  },

  _initBinds: function() {
    this.bind('valid', function() {
      this.validationError = '';
    }, this);
    this.bind('error', function(m, error) {
      this.validationError = error;
    }, this);
  },

  getError: function() {
    return this.validationError;
  }

})