
  /**
   *  Metrics class for CartoDB
   *
   *  - Track user events in CartoDB.
   *  - When an event is launched, you can use our God to
   *  save the action (cdb.god.trigger('metrics', '{{ metric_name }}', { email: {{ email }}, data: {{ data }} });).
   *
   *  new cdb.admin.Metrics();
   */

  cdb.admin.Metrics = cdb.core.Model.extend({

    initialize: function(opts) {
      this.bindEvents();
    },

    bindEvents: function() {
      cdb.god.bind("metrics", this._setTrack, this);
    },

    _setTrack: function(name, obj) {

      // HubSpot tracking
      if (window.hubspot_token) {
        window._hsq = window._hsq || [];
        window._hsq.push(['identify', {
          email: obj.email
        }]);

        var event_id;

        switch(name) {
          case 'published_visualization':
            event_id = window.hubspot_ids.published_visualization
            break;
          case 'visited_dashboard':
            event_id = window.hubspot_ids.visited_dashboard
            break;
          case 'connect_dataset':
            event_id = window.hubspot_ids.connect_dataset
            break;
          case 'create_map':
            event_id = window.hubspot_ids.create_map
            break;
          case 'export_table':
            event_id = window.hubspot_ids.export_table
            break;
          case 'export_map':
            event_id = window.hubspot_ids.export_map;
            break;
          case 'select_wms':
            event_id = window.hubspot_ids.select_wms
            break;
          case 'color_basemap':
            event_id = window.hubspot_ids.color_basemap
            break;
          case 'pattern_basemap':
            event_id = window.hubspot_ids.pattern_basemap
            break;
          case 'geocoding':
            event_id = window.hubspot_ids.geocoding
            break;
          case 'visual_merge':
            event_id = window.hubspot_ids.visual_merge
            break;
          case 'common_data':
            event_id = window.hubspot_ids.common_data
            break;
          case 'cartocss_manually':
            event_id = window.hubspot_ids.cartocss_manually
            break;
          case 'wizard':
            event_id = window.hubspot_ids.wizard
            break;
          case 'filter':
            event_id = window.hubspot_ids.filter
            break;
          case 'query':
            event_id = window.hubspot_ids.query
            break;
          case 'logged_in':
            event_id = window.hubspot_ids.logged_in
            break;
          case 'visited_dashboard_first_time':
            event_id = window.hubspot_ids.visited_dashboard_first_time
            break;
          case 'applied_pecan':
            event_id = window.hubspot_ids.applied_pecan
            break;
          case 'open_pecan_list':
            event_id = window.hubspot_ids.open_pecan_list
            break;

        }

        window._hsq.push(['trackEvent', {
          id: event_id
        }]);
      }

    }

  });
