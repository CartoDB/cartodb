var _ = require('underscore');

var WidgetModelFactory = function (types) {
  types = types || {};
  this.types = {};
  for (var type in types) {
    var createModel = types[type];
    this.addType(type, createModel);
  }
};

WidgetModelFactory.prototype.addType = function (type, createModel) {
  if (!_.isString(type)) throw new Error('type must be a string');
  if (!_.isFunction(createModel)) throw new Error('createModel must be a function');
  this.types[type] = createModel;
};

WidgetModelFactory.prototype.createModel = function (attrs, dataviewModel) {
  var createModel = this.types[attrs.type];
  if (createModel) {
    return createModel(attrs, dataviewModel);
  } else {
    throw new Error('no widget model found for arguments ' + JSON.stringify(arguments));
  }
};

module.exports = WidgetModelFactory;
