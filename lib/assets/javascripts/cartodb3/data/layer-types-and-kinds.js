// Migrated from old models (models/map.js, cdb.admin.Layers)
var KIND_TO_TYPE_MAP = {
  'background': 'Plain',
  'carto': 'CartoDB',
  'gmapsbase': 'GMapsBase',
  'tiled': 'Tiled',
  'torque': 'torque',
  'wms': 'WMS',
  'Layer::Tiled': 'Tiled',
  'Layer::Carto': 'CartoDB',
  'Layer::Background': 'Plain'
};

module.exports = {

  getType: function (kind) {
    var type = KIND_TO_TYPE_MAP[kind];

    if (!type) {
      throw new Error('no type found for given kind ' + kind);
    }

    return type;
  },

  getKind: function (type) {
    var kind;

    for (kind in KIND_TO_TYPE_MAP) {
      if (KIND_TO_TYPE_MAP[kind] === type) {
        break;
      }
    }

    if (!kind) {
      throw new Error('no kind found for given type ' + type);
    }

    return kind;
  }

};
