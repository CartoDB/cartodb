var _ = require('underscore');

var DataviewModelFactory = function (types) {
  types = types || {};
  this.types = {};
  for (var type in types) {
    var createModel = types[type];
    this.addType(type, createModel);
  }
};

DataviewModelFactory.prototype.addType = function (type, createModel) {
  if (!_.isString(type)) throw new Error('type must be a string');
  if (!_.isFunction(createModel)) throw new Error('createModel must be a function');
  this.types[type] = createModel;
};

DataviewModelFactory.prototype.createModel = function (attrs, layer, layerIndex) {
  var createModel = this.types[attrs.type];
  if (createModel) {
    var opts = {
      layer: layer,
      layerIndex: layerIndex
    };
    return createModel(attrs, opts);
  } else {
    throw new Error('no dataview model found for arguments ' + JSON.stringify(arguments));
  }
};

module.exports = DataviewModelFactory;
