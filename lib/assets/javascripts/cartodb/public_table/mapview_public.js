/**
 * map tab shown in cartodb admin
 */

cdb.open.PublicMapTab = cdb.admin.MapTab.extend({

  className: 'map',

  events: {
    'click .js-bounds': '_changeBounds'
  },

  initialize: function() {
    this.template = this.getTemplate('public_table/views/maptab_public');
    this.map_enabled = false;

    this._initBinds();
  },

  _initBinds: function() {
    this.model.bind('change:bounds', this._setBoundsCheckbox, this);
    this.model.bind('change:map', this._setBounds, this);
  },

  _changeBounds: function() {
    this.model.set('bounds', !this.model.get('bounds'));
  },

  _setBounds: function() {
    if (this.vis) {
      var map = this.model.get('map');
      this.vis.mapView.map.setView(map.center, map.zoom);
    }
  },

  _setBoundsCheckbox: function() {
    this.trigger('boundsChanged', { bounds: this.model.get('bounds') });
    this.$('.js-bounds .Checkbox-input').toggleClass('is-checked', !!this.model.get('bounds'));
  },

  /**
   * map can't be loaded from the beggining, it needs the DOM to be loaded
   * so we wait until is actually shown to create the mapview and show it
   */
  enableMap: function() {
    if (!this.map_enabled && !this.vis) {
      this.vis = new cdb.vis.Vis({
        el: this.$('.cartodb-map')
      });
      this.vis.load(this.options.vizjson, {
        auth_token: this.options.auth_token,
        https: this.options.https,
        search: false,
        scrollwheel: false,
        shareable: false,
        fullscreen: true,
        no_cdn: cdb.config.get('debug')
      });
    }

    this._bindBounds();
  },

  /**
   * this function binds pan and zoom events
   * in order to change the results in the table view
   * with the new bbox
   */
  _bindBounds: function() {
    this.vis.mapView.bind('dragend zoomend', function() {
      this.trigger('mapBoundsChanged', {
        map: this.vis.map
      });
    }, this);
  },

  clearMap: function() {},

  render: function() {
    this.$el.html(this.template());
    return this;
  }
});
