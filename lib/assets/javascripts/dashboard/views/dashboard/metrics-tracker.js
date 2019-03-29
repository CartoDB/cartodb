const Backbone = require('backbone');

/**
 *  Metrics class for Carto
 *
 *  - Track user events in Carto.
 *  - When an event is launched, you can use our Tracker to
 *  save the action (metrics.trackEvent('{{ metric_name }}', { email: {{ email }}, data: {{ data }} });).
 *
 *  new MetricsTracker();
 */

const MetricsTracker = Backbone.Model.extend({
  trackEvent (name, eventProperties) {
    // We get Hubspot Token from window to avoid injecting
    // configModel everywhere where we need to track events
    const hubspotToken = window.CartoConfig.data.config.hubspot_token;
    if (!hubspotToken) return;

    window._hsq = window._hsq || [];
    window._hsq.push(['identify', { email: eventProperties.email }]);

    const eventId = window.hubspot_ids[name];
    window._hsq.push(['trackEvent', { id: eventId }]);
  }
});

module.exports = MetricsTracker;
