var LayerTypes = require('../../../geo/map/layer-types.js');

/**
 * Return a payload with the serialization of all the analyses in the 
 * layersCollection and the dataviewsCollection.
 */
function serialize (layersCollection, dataviewsCollection) {
  var layerAnalyses = _getAnalysesFromLayers(layersCollection);
  var dataviewsAnalyses = _getAnalysesFromDataviews(dataviewsCollection);
  // TODO: Remove dups
  return layerAnalyses.concat(dataviewsAnalyses).map(function (analysis) {
    return analysis.toJSON();
  });
}

/**
 * Return the analyses contained in a layers collection.
 */
function _getAnalysesFromLayers (layersCollection) {
  return _getCartoDBAndTorqueLayers(layersCollection).map(function (layer) {
    return layer.getSource();
  });
}

/**
 * Return the analyses contained in a dataviews collection
 */
function _getAnalysesFromDataviews (dataviewsCollection) {
  // TODO: To be implemented
  return [];
}

/**
 * Filter a layersCollection returning only cartodb and torque layers
 */
function _getCartoDBAndTorqueLayers (layersCollection) {
  return layersCollection.filter(function (layer) {
    return LayerTypes.isCartoDBLayer(layer) || LayerTypes.isTorqueLayer(layer);
  });
}

module.exports = {
  serialize: serialize
};
