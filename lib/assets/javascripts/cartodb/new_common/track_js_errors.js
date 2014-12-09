/**
 * Track JS errors through the client-lib provided by http://trackjs.com/
 * The library is assumed to be loaded and set on the global namespace as window.trackJs for this to work.
 *
 * @param user {cdb.admin.User}
 */
module.exports = function(user) {
  if (window.trackJs) {
    window.trackJs.configure({
      userId: user.get('username'),
      trackAjaxFail: false
    });
  }
};
