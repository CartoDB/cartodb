var _ = require('underscore');

var WidgetModelFactory = function (typeDefs) {
  this.typeDefs = [];
  _.each(typeDefs, function(def) {
    this.addType(def);
  }, this);
};

WidgetModelFactory.prototype.addType = function (def) {
  if (!def.match) new Error('def.match must be a string or a function');
  if (!_.isFunction(def.createModel)) new Error('def.createModel must be a function');
  this.typeDefs.push(def);
};

WidgetModelFactory.prototype.createModel = function (id, attrs, layerId, layerIndex) {
  attrs.id = id;
  attrs.layerId = layerId;

  var type = _.find(this.typeDefs, function(type) {
    if (_.isFunction(type.match)) {
      return type.match(attrs);
    } else {
      return attrs.type === type.match;
    }
  });
  if (type) {
    return type.createModel(attrs, layerIndex);
  } else {
    throw new Error('no model found for arguments ' + arguments);
  }
};

module.exports = WidgetModelFactory;
