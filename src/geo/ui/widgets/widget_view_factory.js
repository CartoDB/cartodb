var ListWidgetView = require('cdb/geo/ui/widgets/list/view');
var HistogramWidgetView = require('cdb/geo/ui/widgets/histogram/view');
var CategoryWidgetView = require('cdb/geo/ui/widgets/category/view');
var TimeWidgetView = require('cdb/geo/ui/widgets/time/view');

module.exports = {
  CLASSES: {
    "list": ListWidgetView,
    "histogram": HistogramWidgetView,
    "aggregation": CategoryWidgetView,
    "time": TimeWidgetView
  },

  createView: function(widget) {
    var widgetType = widget.get('type');
    var widgetViewClass = this.CLASSES[widgetType];

    // TODO: widgetViewClass might be null
    var widgetView = new widgetViewClass({
      model: widget,
      filter: widget.filter
    });

    return widgetView;
  }
};
