const CoreView = require('backbone/core-view');

/* Organization user form */
module.exports = CoreView.extend({
  events: {
    'submit': '_validateFormSubmit'
  },

  _validateFormSubmit: function (event) {
    if (this.$('.js-userQuotaError').length > 0) {
      return false;
    }
  }
});
