cdb.geo.ui.WidgetsView = cdb.core.View.extend({

  className: 'Widget-canvas',

  initialize: function(options) {
    this.layers = options.layers;
  },

  render: function() {
    this.layers.each(this._renderLayerWidgetsView, this);
    return this;
  },

  _renderLayerWidgetsView: function(layer) {
    var layerWidgetsView = new cdb.geo.ui.LayerWidgetsView({ model: layer });
    this.$el.append(layerWidgetsView.render().el);

    this.addView(layerWidgetsView);
  }
});