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
  needsToChangeBaseURL: function (userData, location) {
    var locationObject = location || window.location;
    var urlUserInfo = getUserPathname(locationObject.pathname);
    var currentURL = locationObject.origin;

    if (urlUserInfo.username) {
      return userData.base_url !== `${currentURL}${urlUserInfo.userPathname}`;
    }

    return userData.base_url !== currentURL;
  }
};
