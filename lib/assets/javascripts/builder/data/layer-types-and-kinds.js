// Types
var PLAIN = 'Plain';
var CARTODB = 'CartoDB';
var TILED = 'Tiled';
var TORQUE = 'torque';
var GMAPSBASE = 'GMapsBase';
var WMS = 'WMS';

// Values of `kind` attribute that the backend/DB knows about
var KIND_TO_TYPE_MAP = {
  'background': PLAIN,
  'carto': CARTODB,
  'gmapsbase': GMAPSBASE,
  'tiled': TILED,
  'torque': TORQUE,
  'wms': WMS
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
    return this.isTypeDataLayer(type);
  },

  isTypeDataLayer: function (type) {
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
  },

  isPlainType: function (type) {
    return type === PLAIN;
  },

  isGMapsBase: function (type) {
    return type === GMAPSBASE;
  }
};
