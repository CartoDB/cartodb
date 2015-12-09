var _ = cdb._;

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

WidgetModelFactory.prototype.createModel = function (layer, layerIndex, attrs) {
  if (!attrs.id) throw new Error('attrs.id is required');

  var createModel = this.types[attrs.type];
  if (createModel) {
    var opts = {
      layer: layer
    };
    return createModel(attrs, opts, layerIndex);
  } else {
    throw new Error('no model found for arguments ' + arguments);
  }
};

module.exports = WidgetModelFactory;
