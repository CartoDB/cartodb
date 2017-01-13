/* global cdb */

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
