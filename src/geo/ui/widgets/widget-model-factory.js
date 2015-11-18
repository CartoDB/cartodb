var _ = require('underscore');
var log = require('cdb.log');

var WidgetModelFactory = function (types) {
  types = types || {};
  this.types = {};
  for (var type in types) {
    var createModel = types[type];
    this.addType(type, createModel);
  }
};

WidgetModelFactory.prototype.addType = function (type, createModel) {
  if (!_.isString(type)) new Error('type must be a string or a function');
  if (!_.isFunction(createModel)) new Error('createModel must be a function');
  this.types[type] = createModel;
};

WidgetModelFactory.prototype.createModel = function (attrs, layerIndex) {
  if (!attrs.id) throw new Error('attrs.id is required');
  if (!attrs.layerId) log.warn('layerId is not set for widget ' + attrs.id);

  var createModel = this.types[attrs.type];
  if (createModel) {
    return createModel(attrs, layerIndex);
  } else {
    throw new Error('no model found for arguments ' + arguments);
  }
};

module.exports = WidgetModelFactory;
