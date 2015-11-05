cdb.geo.ui.LayerWidgetsView = cdb.core.View.extend({

  className: 'LayerWidgets-canvas',

  initialize: function() {
    this.model.bind('change:visible', this.toggle, this);
  },

  render: function() {
    this.model.widgets.each(this._renderWidgetView, this);

    return this;
  },

  _renderWidgetView: function(widget) {
    var widgetView = cdb.geo.ui.WidgetViewFactory.createView(widget);
    this.$el.append(widgetView.render().el);

    this.addView(widgetView);
  },

  toggle: function(layer) {
    this.$el.toggle(layer.get('visible'));
  }
});

