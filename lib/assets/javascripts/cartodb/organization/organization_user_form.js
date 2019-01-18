var cdb = require('cartodb.js-v3');

/* Organization user form */
module.exports = cdb.core.View.extend({
  events: {
    'submit': '_validateFormSubmit'
  },

  _validateFormSubmit: function (event) {
    if (this.$('.js-userQuotaError').length > 0) {
      return false;
    }
  }
});
