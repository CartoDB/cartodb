var _ = require('underscore');

var WidgetViewFactory = function (typeDefs) {
  this.typeDefs = [];
  _.each(typeDefs, function(def) {
    this.addType(def);
  }, this);
};

WidgetViewFactory.prototype.addType = function (def) {
  if (!_.isFunction(def.match)) new Error('def.match must be a function');
  if (!_.isFunction(def.create)) new Error('def.create must be a function');
  this.typeDefs.push(def);
};

WidgetViewFactory.prototype.createView = function (widget, layer) {
  var type = _.find(this.typeDefs, function(type) {
    return type.match(widget, layer);
  });
  if (type) {
    return type.create(widget, layer);
  } else {
    throw new Error('no view found for arguments ' + arguments);
  }
};

module.exports = WidgetViewFactory;
