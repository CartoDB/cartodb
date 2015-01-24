var cdb = require('cartodb.js');
var _ = require('underscore');
var OptionModel = require('./option_model');

/**
 * Special privacy option
 * It handles the logic related to the password that needs to be set for the option.
 */
module.exports = OptionModel.extend({
  
  /**
   * @override OptionModel.attrsToSave
   */
  _attrsToSave: function() {
    return _.pick(this.attributes, 'privacy', 'password');
  },
  
  canSave: function() {
    return OptionModel.prototype.canSave.call(this) && !_.isEmpty(this.get('password'));
  }
});
