var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');

/**
 * View to render the user support link in the header.
 * Expected to be created from existing DOM element.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this.user = this.model;
    this.template_base = cdb.templates.getTemplate('common/views/dashboard_header/user_support_template');
  },

  render: function() {
    this.$el.html(
      this.template_base({
        userType: this._getUserType()
      })
    )

    return this;
  },

  _getUserType: function() {
    var accountType = this.user.get('account_type').toLowerCase();

    // Get user type
    if (this.user.isInsideOrg()) {
      return 'org';
    } else if (accountType === "internal" || accountType === "partner" || accountType === "ambassador") {
      return 'internal'
    } else if (accountType !== "free") {
      return 'client';
    } else {
      return 'regular'
    }
  }

});
