var View = require('cdb/core/view');

module.exports = View.extend({

  className: 'CDB-LayerWidgets-canvas',

  initialize: function() {
    this.model.bind('change:visible', this.toggle, this);
  },

  render: function() {
    this.model.widgets.each(this._renderWidgetView, this);

    return this;
  },

  _renderWidgetView: function(widget) {
    var widgetView = this.options.widgetViewFactory.createWidgetView(widget, this.model);
    this.$el.append(widgetView.render().el);

    this.addView(widgetView);
  },

  toggle: function(layer) {
    this.$el.toggle(layer.get('visible'));
  }
});
