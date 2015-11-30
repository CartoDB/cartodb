var _ = require('underscore');
var WidgetView = require('cdb/geo/ui/widgets/widget-view');

var WidgetViewFactory = function(defs) {
  this.defs = [];
  _.each(defs, function(def) {
    this.addType(def);
  }, this);
};

WidgetViewFactory.prototype.DEFAULT_CLASS_NAMES = 'Widget Widget--light';

WidgetViewFactory.prototype.addType = function(def) {
  if (!def.match) {
    if (def.type) {
      def.match = function(widget) {
        return widget.get('type') === this.type;
      };
    } else {
      new Error('def.type or def.match must be provided for createContentView to work');
    }
  }
  if (!_.isFunction(def.createContentView)) new Error('def.createContentView must be a function');
  this.defs.push(def);
};

WidgetViewFactory.prototype.createWidgetView = function(widget, layer) {
  var def = _.find(this.defs, function(def) {
    return def.match(widget, layer);
  });

  if (def) {
    var attrs = {
      className: this.DEFAULT_CLASS_NAMES,
      model: widget,
      contentView: def.createContentView(widget, layer)
    };

    return new WidgetView(
      _.isFunction(def.customizeWidgetAttrs)
        ? def.customizeWidgetAttrs(attrs)
        : attrs
    );
  } else {
    throw new Error('no widget view found for given widget: ' + JSON.stringify(widget.attributes));
  }
};

module.exports = WidgetViewFactory;
