/**
 * map tab shown in cartodb admin
 */

cdb.open.PublicMapTab = cdb.admin.MapTab.extend({

  className: 'map',

  initialize: function() {
    this.template = this.getTemplate('public_table/views/maptab_public');
    this.map_enabled = false;
  },

  /**
   * map can't be loaded from the beggining, it needs the DOM to be loaded
   * so we wait until is actually shown to create the mapview and show it
   */
  enableMap: function() {
    var self = this;
    if(!this.map_enabled && !this.vis) {
      var div = this.$('.cartodb-map');
      this.vis = new cdb.vis.Vis({ el: div });
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
    var _this = this;

    this.vis.mapView.bind('dragend zoomend', function(e) {
      _this.trigger('boundsChanged', _this.vis.map);
    });
  },

  clearMap: function() {},

  render: function() {
    this.$el.html(this.template());
    return this;
  }
});
