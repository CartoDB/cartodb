cdb.geo.ui.WidgetViewFactory = {
  CLASSES: {
    "list": 'List.View',
    "histogram": 'Histogram.View',
    "aggregation": 'Category.View'
  },

  createView: function(widget) {
    var widgetType = widget.get('type');
    var widgetViewClass = this.CLASSES[widgetType];
    var viewClassParts = widgetViewClass.split('.');

    // TODO: widgetViewClass might be null
    var widgetView = new cdb.geo.ui.Widget[viewClassParts[0]][viewClassParts[1]]({
      model: widget,
      filter: widget.filter
    });

    return widgetView;
  }
};
