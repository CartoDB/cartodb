
  /**
   *  HubSpot class for CartoDB
   *
   *  - Track user events in CartoDB.
   *  - When an event is launched, you can use our God to
   *  save the action (cdb.god.trigger('hubspot', '{{ hubspot_event_id }}', { email: {{ email }}, data: {{ data }} });).
   *
   *  new cdb.admin.HubSpot();
   */

  cdb.admin.HubSpot = cdb.core.Model.extend({

    initialize: function(opts) {
      this.bindEvents();
    },

    bindEvents: function() {
      cdb.god.bind("hubspot", this._setTrack, this);
    },

    _setTrack: function(event_id, obj) {
      // Hubspot tracking
      window._hsq = window._hsq || [];
      window._hsq.push(['identify', {
        email: obj.email
      }]);
      window._hsq.push(['trackEvent', {
        id: event_id,
        value: obj.data
      }]);
    }

  });
