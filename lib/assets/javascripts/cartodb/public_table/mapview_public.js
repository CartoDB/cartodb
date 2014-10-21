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
        no_cdn: cdb.config.get('debug')
      });
    }
  },

  clearMap: function() {},

  render: function() {
    this.$el.html(this.template());
    return this;
  }
});
