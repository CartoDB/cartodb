/**
 * Send dashboard start usage to Mixpanel.
 * (Extracted from old dashboard code, removed unnecessary dependencies);
 *
 * @param mixpanel {window.mixpanel}
 * @param user {cdb.admin.User}
 * @param isFirstTimeViewingDashboard {Boolean}
 * @param isJustLoggedIn {Boolean}
 */
module.exports = function(mixpanel, user, isFirstTimeViewingDashboard, isJustLoggedIn) {
  var d = {
    account_type: user.get('account_type')
  };

  if (user.isInsideOrg()) {
    d.enterprise_org = user.organization.get('name');
  }

  if (isFirstTimeViewingDashboard) {
    mixpanel.track('Dashboard viewed for the first time', d);
  }

  mixpanel.track('Dashboard viewed', d);

  if (isJustLoggedIn) {
    mixpanel.track('Logged in');
    mixpanel.people.increment('login_count', 1);
  }
};
