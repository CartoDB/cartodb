var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  initialize: function() {
    this.validationError = '';
    this._initBinds();
    this._validate(null, { validate: true });
  },

  _validate: function(attrs, options) {
    var valid = cdb.core.Model.prototype._validate.apply(this, arguments);
    // This follows Backbone way about how to validate a model
    if (valid) {
      this.trigger('valid')
      return true;
    } else {
      return false;
    }
  },

  validate: function(attrs) {
    return;
  },

  _initBinds: function() {    
    this.bind('valid', function() {
      this.validationError = '';
    }, this);
    this.bind('error', function(m, error) {
      this.validationError = error;
      // Show error in console
      cdb.log.info(this.validationError);
    }, this);
  },

  isValid: function() {
    return this._validate(null, { validate: true })
  },

  getError: function() {
    return this.validationError;
  }

})