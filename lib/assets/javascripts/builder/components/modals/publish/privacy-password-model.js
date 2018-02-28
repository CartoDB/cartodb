var _ = require('underscore');
var PrivacyModel = require('./privacy-model');

var FAKE_PASSWORD = '!@#!@#';

/**
 * View model for the special privacy option representing a password protected map.
 * It handles the logic related to the password that needs to be set for the option.
 */
module.exports = PrivacyModel.extend({

  initialize: function () {
    PrivacyModel.prototype.initialize.apply(this, arguments);
    this.set('password', FAKE_PASSWORD);
  },

  /**
   * @override OptionModel.attrsToSave
   */
  _attrsToSave: function () {
    var attrs = PrivacyModel.prototype._attrsToSave.call(this);

    if (attrs.password === FAKE_PASSWORD) {
      delete attrs.password;
    }

    return attrs;
  },

  canSave: function () {
    return !this.get('disabled') && !_.isEmpty(this.get('password'));
  },

  isPassword: function () {
    return true;
  }
});
