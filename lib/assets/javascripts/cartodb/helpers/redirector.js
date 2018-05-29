var _ = require('underscore');
var parseDomains = require('./parse-domains');
var PRIVATE_PAGES = ['dashboard', 'account', 'profile'];

module.exports = {
  redirectOrgUsers: function (organization, username, location) {
    var page = _.find(PRIVATE_PAGES, function (item) {
      return location.pathname.indexOf(item) > -1;
    });
    debugger;
    var domains = parseDomains(location.href);
    if (organization && organization.name && domains.subdomain &&
      domains.subdomain === username) {
      var newOrigin = location.origin.replace(domains.subdomain, organization.name);
      var newPathname = '/u/' + username + '/' + page;
      location.replace(newOrigin + newPathname);
    }
  },

  redirectToLoginIfAnotherIsLogged: function (username, location) {
    var domains = parseDomains(location.href);
    if (domains.subdomain && username && domains.subdomain !== username) {
      location = '/login';
    }
  }
};
