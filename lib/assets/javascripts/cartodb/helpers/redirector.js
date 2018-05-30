var _ = require('underscore');
var parseDomains = require('./parse-domains');
var PRIVATE_PAGES = ['dashboard', 'account', 'profile'];

function getUserPathname (pathname) {
  var usernameRegex = /^\/\u(?:ser)?\/([a-zA-Z0-9\-]+)/;
  var matchData = usernameRegex.exec(pathname);
  var userPathname = matchData && matchData[0];
  var username = matchData && matchData[1]
    ? matchData[1]
    : '';
  return {
    userPathname: userPathname,
    username: username
  }
}

function getPage (pathname) {
  return _.find(PRIVATE_PAGES, function (item) {
    return location.pathname.indexOf(item) > -1;
  });
}

module.exports = {
  redirectUsers: function (organization, username, baseUrl, location) {
    var domains = parseDomains(location.href);
    var urlSubdomain = domains.subdomain;
    var urlPathname = getUserPathname(location.pathname);
    var userPathname = urlPathname.userPathname;
    var urlUsername = urlPathname.username;
    var sessionOrg = organization && organization.name;
    var sessionUsername = username;
    var page = getPage(location.pathname);
    var actualUrl = location.origin + userPathname;

    if (!page) {
      return;
    }
    if (baseUrl === actualUrl) {
      return;
    }
    if (sessionOrg && urlSubdomain === sessionUsername) {
      var newUrl = base_url + '/u/' + sessionUsername + '/' + page;
      location.replace(newUrl);
    }
    location = '/login';
  }

// If the URL matches base_url -> OK
// If the subdomain or /u/username part of the URL matches the actual username -> Fix the URL (redirect to base_url/dashboard or similar)
// Elsewhere, redirect to login.




  // redirectOrgUsers: function (organization, username, location) {
  //   var page = _.find(PRIVATE_PAGES, function (item) {
  //     return location.pathname.indexOf(item) > -1;
  //   });
  //   var domains = parseDomains(location.href);
  //   if (organization && organization.name && domains.subdomain &&
  //     domains.subdomain === username) {
  //     var newOrigin = location.origin.replace(domains.subdomain, organization.name);
  //     var newPathname = '/u/' + username + '/' + page;
  //     location.replace(newOrigin + newPathname);
  //   }
  // },

  // redirectToLoginIfAnotherIsLogged: function (username, location) {
  //   var domains = parseDomains(location.href);
  //   if (domains.subdomain && username && domains.subdomain !== username) {
  //     location = '/login';
  //   }
  // }
};
