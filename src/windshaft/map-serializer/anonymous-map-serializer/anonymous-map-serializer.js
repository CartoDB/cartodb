
var AnalisysSerializer = require('./analysis-serializer');
var DataviewSerializer = require('./dataviews-serializer');
var LayerSerializer = require('./layers-serializer');

/**
 * Transform a map visualization into a json payload compatible with the windshaft API.
 */
function serialize (layersCollection, dataviewsCollection, analysisCollection) {
  return {
    buffersize: { mvt: 0 },
    layers: LayerSerializer.serialize(layersCollection),
    dataviews: DataviewSerializer.serialize(dataviewsCollection),
    analyses: AnalisysSerializer.serialize(layersCollection, dataviewsCollection, analysisCollection)
  };
}

module.exports = {
  serialize: serialize
};
