var TYPES = {
  PLAIN: 'Plain',
  CARTODB: 'CartoDB',
  TILED: 'Tiled',
  TORQUE: 'torque',
  GMAPSBASE: 'GMapsBase',
  WMS: 'WMS'
}

// Migrated from old models (models/map.js, cdb.admin.Layers)
var KIND_TO_TYPE_MAP = {
  'background': TYPES.PLAIN,
  'carto': TYPES.CARTODB,
  'gmapsbase': TYPES.GMAPSBASE,
  'tiled': TYPES.TILED,
  'torque': TYPES.TORQUE,
  'wms': TYPES.WMS,
  'Layer::Tiled': TYPES.TILED,
  'Layer::Carto': TYPES.CARTODB,
  'Layer::Background': TYPES.PLAIN
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
    if (!type) {
      throw new Error('no kind found for given type ' + type);
    }

    var kind;
    for (kind in KIND_TO_TYPE_MAP) {
      if (KIND_TO_TYPE_MAP[kind] === type) {
        break;
      }
    }

    return kind;
  },

  isCartoDBType: function (type) {
    return type === TYPES.CARTODB;
  },

  isTorqueType: function (type) {
    return type === TYPES.TORQUE;
  },

  isTiledType: function (type) {
    return type === TYPES.TILED;
  }
};
