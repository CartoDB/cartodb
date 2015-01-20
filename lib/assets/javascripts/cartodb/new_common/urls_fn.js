var OrganizationUserUrl = require('./urls/organization_user_model');
var UserUrl = require('./urls/user_model');

module.exports = function(accountHost) {
  return {

    /**
     * Creates a new user URL.
     * @param user {Object} instance of cdb.admin.User
     * @param account_host {String} The current account host, e.g. 'cartodb.com'
     * @returns {Object} instance of urls/abstract_url_model
     */
    userUrl: function(user) {
      var args = {
        user: user,
        account_host: accountHost,
        mapUrlForVisOwnerFn: this.mapUrl
      };

      if (user.isInsideOrg()) {
        return new OrganizationUserUrl(args);
      } else {
        return new UserUrl(args);
      }
    },

    /**
     * Convenient method to get a map URL directly from a vis model.
     * @param vis {Object} instance of cdb.admin.Visualization
     * @returns {Object} instance of urls/abstract_url_model
     */
    mapUrl: function(vis) {
      return this.userUrl(vis.permission.owner).mapUrl(vis);
    }
  };
};
