var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var OptionModel = require('./option_model');

/**
 * View model for the special privacy option representing a password protected map.
 * It handles the logic related to the password that needs to be set for the option.
 */
var PasswordOptionModel = OptionModel.extend({
  
  initialize: function() {
    OptionModel.prototype.initialize.apply(this, arguments);

    // Initially a default fake password is set, but if option is selected (like switching option) it's reset
    this.set('password', PasswordOptionModel.DEFAULT_FAKE_PASSWORD);
  },

  /**
   * @override OptionModel.attrsToSave
   */
  _attrsToSave: function() {
    var attrs = OptionModel.prototype._attrsToSave.call(this);
    
    if (attrs.password === PasswordOptionModel.DEFAULT_FAKE_PASSWORD) {
      delete attrs.password;
    }
    
    return attrs;
  }, 
  
  canSave: function() {
    return OptionModel.prototype.canSave.call(this) && !_.isEmpty(this.get('password'));
  }
  
}, {
  
  DEFAULT_FAKE_PASSWORD: '!@#!@#'
  
});

module.exports = PasswordOptionModel;
