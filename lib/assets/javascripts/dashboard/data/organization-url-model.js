var UrlModel = require('dashboard/data/url-model');

/**
 * URL for a map (derived vis).
 */
var OrganizationUrlModel = UrlModel.extend({
  edit: function (user) {
    if (!user) {
      throw new Error('User is needed to create the url');
    }
    return this.urlToPath(user.get('username') + '/edit');
  },

  create: function () {
    return this.urlToPath('new');
  },

  groups: function () {
    return this.urlToPath('groups');
  }
});

module.exports = OrganizationUrlModel;
