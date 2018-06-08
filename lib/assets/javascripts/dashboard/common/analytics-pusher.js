/**
 *  Send events to Google Analytics if it is available
 *  - https://developers.google.com/analytics/devguides/collection/analyticsjs/sending-hits
 *
 *  *Remove this "helper" when dashboard is deprecated
 */

var GAPusher = function (opts) {
  var ga = window.ga;
  opts = opts || {};

  if (ga) {
    ga(opts.eventName || 'send', {
      hitType: opts.hitType,
      eventCategory: opts.eventCategory,
      eventAction: opts.eventAction,
      eventLabel: opts.eventLabel
    });
  }
};

module.exports = GAPusher;
