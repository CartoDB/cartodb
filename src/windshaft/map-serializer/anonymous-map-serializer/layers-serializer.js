var _ = require('underscore');
var LayerTypes = require('../../../geo/map/layer-types.js');

var DEFAULT_CARTOCSS_VERSION = '2.1.0';

// This types are the understood by the Maps API.
var HTTP_LAYER_TYPE = 'http';
var PLAIN_LAYER_TYPE = 'plain';
var MAPNIK_LAYER_TYPE = 'mapnik';
var TORQUE_LAYER_TYPE = 'torque';

/**
 * Generate a json payload from a layer collection of a map
 */
function serialize (layersCollection) {
  return layersCollection.chain()
    .map(_calculateLayerJSON)
    .compact()
    .value();
}

function _calculateLayerJSON (layerModel) {
  if (LayerTypes.isTiledLayer(layerModel)) {
    return optionsForHTTPLayer(layerModel);
  } else if (LayerTypes.isPlainLayer(layerModel)) {
    return optionsForPlainLayer(layerModel);
  } else if (LayerTypes.isWMSLayer(layerModel)) {
    return optionsForWMSLayer(layerModel);
  } else if (LayerTypes.isCartoDBLayer(layerModel)) {
    return optionsForMapnikLayer(layerModel);
  } else if (LayerTypes.isTorqueLayer(layerModel)) {
    return optionsForTorqueLayer(layerModel);
  }
}

function optionsForHTTPLayer (layerModel) {
  return {
    id: layerModel.get('id'),
    type: HTTP_LAYER_TYPE,
    options: {
      urlTemplate: layerModel.get('urlTemplate'),
      subdomains: layerModel.get('subdomains'),
      tms: layerModel.get('tms')
    }
  };
}

function optionsForWMSLayer (layerModel) {
  return {
    id: layerModel.get('id'),
    type: HTTP_LAYER_TYPE,
    options: {
      urlTemplate: layerModel.get('urlTemplate'),
      tms: true
    }
  };
}

function optionsForPlainLayer (layerModel) {
  return {
    id: layerModel.get('id'),
    type: PLAIN_LAYER_TYPE,
    options: {
      color: layerModel.get('color'),
      imageUrl: layerModel.get('image')
    }
  };
}

function optionsForMapnikLayer (layerModel) {
  var options = sharedOptionsForMapnikAndTorqueLayers(layerModel);
  options.interactivity = layerModel.getInteractiveColumnNames();

  if (layerModel.infowindow && layerModel.infowindow.hasFields()) {
    options.attributes = {
      id: 'cartodb_id',
      columns: layerModel.infowindow.getFieldNames()
    };
  }

  if (isFinite(layerModel.get('minzoom'))) {
    options.minzoom = layerModel.get('minzoom');
  }

  if (isFinite(layerModel.get('maxzoom'))) {
    options.maxzoom = layerModel.get('maxzoom');
  }

  if (!_.isEmpty(layerModel.aggregation)) {
    _.extend(options, {
      aggregation: layerModel.aggregation
    });
  }

  return {
    id: layerModel.get('id'),
    type: MAPNIK_LAYER_TYPE,
    options: options
  };
}

function optionsForTorqueLayer (layerModel) {
  var options = sharedOptionsForMapnikAndTorqueLayers(layerModel);
  return {
    id: layerModel.get('id'),
    type: TORQUE_LAYER_TYPE,
    options: options
  };
}

function sharedOptionsForMapnikAndTorqueLayers (layerModel) {
  var options = {
    cartocss: layerModel.get('cartocss'),
    cartocss_version: layerModel.get('cartocss_version') || DEFAULT_CARTOCSS_VERSION
  };

  options.source = { id: layerModel.getSourceId() };

  if (layerModel.get('sql_wrap')) {
    options.sql_wrap = layerModel.get('sql_wrap');
  }

  return options;
}
module.exports = { serialize: serialize };
