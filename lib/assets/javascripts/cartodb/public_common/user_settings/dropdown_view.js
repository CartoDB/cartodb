var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var $ = require('jquery-cdb-v3');

/**
 * The content of the dropdown menu opened by the user avatar in the top-right of the header, e.g.:
 *   Explore, Learn, ♞
 *             ______/\____
 *            |            |
 *            |    this    |
 *            |____________|
 */
module.exports = cdb.admin.DropdownMenu.extend({
  className: 'CDB-Text Dropdown',

  initialize: function () {
    this.elder('initialize');
    this.template_base = cdb.templates.getTemplate('public_common/user_settings/dropdown_template');

    // Necessary to hide dialog on click outside popup, for example.
    cdb.god.bind('closeDialogs', this.hide, this);
  },

  render: function () {
    var user = this.model;
    var userUrl = user.viewUrl();

    this.$el.html(this.template_base({
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
  },

  clean: function () {
    // Until https://github.com/CartoDB/cartodb.js/issues/238 is resolved:
    $(this.options.target).unbind('click', this._handleClick);
    this.constructor.__super__.clean.apply(this);
  }

});
