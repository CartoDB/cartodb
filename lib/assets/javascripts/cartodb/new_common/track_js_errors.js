/**
 * Track JS errors through the client-lib provided by http://trackjs.com/
 * The library is assumed to be loaded and set on the global namespace as window.trackJs for this to work.
 *
 * @param trackJs {Object} the trackJs.com
 * @param username {String}
 */
module.exports = function(trackJs, username) {
  trackJs.configure({
    userId: username,
    trackAjaxFail: false
  });
};
