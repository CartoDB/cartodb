var $ = require('jquery');
var template = require('./dropdown.tpl');
var DropdownAdminView = require('dashboard/components/dropdown/dropdown-admin-view');

/**
 * The content of the dropdown menu opened by the user avatar in the top-right of the header, e.g.:
 *   Explore, Learn, ♞
 *             ______/\____
 *            |            |
 *            |    this    |
 *            |____________|
 */

module.exports = DropdownAdminView.extend({
  className: 'CDB-Text Dropdown',

  render: function () {
    var user = this.model;
    var userUrl = user.viewUrl();

    this.$el.html(template({
      name: user.fullName() || user.get('username'),
      email: user.get('email'),
      isOrgOwner: user.isOrgOwner(),
      dashboardUrl: userUrl.dashboard(),
      publicProfileUrl: userUrl.publicProfile(),
      accountProfileUrl: userUrl.accountProfile(),
      logoutUrl: userUrl.logout()
    }));

    // TODO: taken from existing code, how should dropdowns really be added to the DOM?
    $('body').append(this.el);

    return this;
  }
});
