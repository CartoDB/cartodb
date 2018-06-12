var parseDomains = require('./parse-domains');

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
  };
}

function isOrganizationUser (userData) {
  return !!userData.organization;
}

module.exports = {
  needsToChangeBaseURL: function (userData, location) {
    var locationObject = location || window.location;
    var urlPathname = getUserPathname(locationObject.pathname);
    var currentURL = locationObject.origin;
    var urlInfo = parseDomains(locationObject.href);

    if (isOrganizationUser(userData) && (userData.organization.name !== urlInfo.subdomain)) {
      return true;
    }

    if (urlPathname.username) {
      return userData.base_url !== `${currentURL}${urlPathname.userPathname}`;
    }

    return userData.base_url !== currentURL;
  }
};
