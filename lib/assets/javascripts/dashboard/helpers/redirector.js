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
  needsToChangeBaseURL: function (baseURL, location) {
    var locationObject = location || window.location;
    var currentURLOrigin = locationObject.origin;
    var urlData = getUserPathname(locationObject.pathname);

    if (urlData.username) {
      return baseURL !== currentURLOrigin + urlData.userPathname;
    }

    return baseURL !== currentURLOrigin;
  }
};
