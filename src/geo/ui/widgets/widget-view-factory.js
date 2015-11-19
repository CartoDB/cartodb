var _ = require('underscore');

var WidgetViewFactory = function(defs) {
  this.defs = [];
  _.each(defs, function(def) {
    this.addType(def);
  }, this);
};

WidgetViewFactory.prototype.addType = function(def) {
  if (!def.match) {
    if (def.type) {
      def.match = function(widget) {
        return widget.get('type') === this.type;
      };
    } else {
      new Error('def.type or def.match must be provided for createView to work');
    }
  }
  if (!_.isFunction(def.createView)) new Error('def.createView must be a function');
  this.defs.push(def);
};

WidgetViewFactory.prototype.createView = function(widget, layer) {
  var def = _.find(this.defs, function(def) {
    return def.match(widget, layer);
  });
  if (def) {
    return def.createView(widget, layer);
  } else {
    throw new Error('no view found for arguments ' + arguments);
  }
};

module.exports = WidgetViewFactory;
