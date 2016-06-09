// Types
var PLAIN = 'Plain';
var CARTODB = 'CartoDB';
var TILED = 'Tiled';
var TORQUE = 'torque';
var GMAPSBASE = 'GMapsBase';
var WMS = 'WMS';

// Migrated from old models (models/map.js, cdb.admin.Layers)
var KIND_TO_TYPE_MAP = {
  'background': PLAIN,
  'carto': CARTODB,
  'gmapsbase': GMAPSBASE,
  'tiled': TILED,
  'torque': TORQUE,
  'wms': WMS,
  'Layer::Tiled': TILED,
  'Layer::Carto': CARTODB,
  'Layer::Background': PLAIN
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

  isKindDataLayer: function (kind) {
    var type = KIND_TO_TYPE_MAP[kind];
    return this.isCartoDBType(type) || this.isTorqueType(type);
  },

  isCartoDBType: function (type) {
    return type === CARTODB;
  },

  isTorqueType: function (type) {
    return type === TORQUE;
  },

  isTiledType: function (type) {
    return type === TILED;
  }
};
