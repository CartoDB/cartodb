/**
 * map tab shown in cartodb admin
 */

cdb.open.PublicMapTab = cdb.admin.MapTab.extend({

  className: 'map',

  initialize: function() {
    window.mapdebug = this;
    this.template = this.getTemplate('table_public/views/maptab_public');
    this.map_enabled = false;
  },

  /**
   * map can't be loaded from the beggining, it needs the DOM to be loaded
   * so we wait until is actually shown to create the mapview and show it
   */
  enableMap: function() {
    var self = this;
    if(!this.map_enabled) {
      var div = this.$('#map');
      var vis = new cdb.vis.Vis({ el: div });
      // remove header
      this.options.vizjson.overlays.splice(0, 1);
      vis.load(this.options.vizjson);
    }
  },

  clearMap: function() {
  },

  render: function() {
    this.$el.html(this.template());
    return this;
  }


});

