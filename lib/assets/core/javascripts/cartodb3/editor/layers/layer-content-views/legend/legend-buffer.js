var map = {};

module.exports = {
  add: function (model) {
    var key = model.layerDefinitionModel.id + ':' + model.get('type');
    map[key] = model;
  },

  find: function (layerDefModel, type) {
    var key = layerDefModel.id + ':' + type;
    return map[key];
  },

  remove: function (model) {
    var key = model.layerDefinitionModel.id + ':' + model.get('type');
    delete map[key];
  }
};
