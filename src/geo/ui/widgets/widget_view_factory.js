var _ = require('underscore');

var WidgetViewFactory = function(typeDefs) {
  this.typeDefs = [];
  _.each(typeDefs, function(def) {
    this.addType(def);
  }, this);
};

WidgetViewFactory.prototype.addType = function(def) {
  if (!def.match) new Error('def.match must be a string or a function');
  if (!_.isFunction(def.createView)) new Error('def.createView must be a function');
  this.typeDefs.push(def);
};

WidgetViewFactory.prototype.createView = function(widget, layer) {
  var type = _.find(this.typeDefs, function(type) {
    if (_.isFunction(type.match)) {
      return type.match(widget, layer);
    } else {
      return widget.get('type') === type.match;
    }
  });
  if (type) {
    return type.createView(widget, layer);
  } else {
    throw new Error('no view found for arguments ' + arguments);
  }
};

module.exports = WidgetViewFactory;
