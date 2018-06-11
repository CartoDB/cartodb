var _ = require('underscore');

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

module.exports = {
  currentURLHasCorrectUser: function (baseURL, location) {
    var locationObject = location || window.location;
    var urlPathname = getUserPathname(locationObject.pathname);
    var currentURL = locationObject.origin;

    if (urlPathname.username) {
      return baseURL === `${currentURL}${urlPathname.userPathname}`;
    }

    return baseURL === currentURL;
  }
};
