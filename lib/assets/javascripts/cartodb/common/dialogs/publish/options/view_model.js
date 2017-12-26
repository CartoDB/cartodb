var cdb = require('cartodb.js-v3');

/**
 * View model for an option that may be disabled due to Vis' privacy being set to private.
 */
module.exports = cdb.core.Model.extend({

  isDisabled: function() {
    return this.get('isPrivacyPrivate');
  }
});
