
cdb.windshaft.PublicMap = function(attributes) {
  this.mapProperties = attributes;
}

cdb.windshaft.PublicMap.prototype.getMapId = function() {
  return this.mapProperties.layergroupid;
}

/**
 * Returns the index of a layer of a given type, as the tiler kwows it.
 *
 * @param {integer} index - number of layer of the specified type
 * @param {string} layerType - type of the layers
 */
cdb.windshaft.PublicMap.prototype.getLayerIndexByType = function(index, layerType) {
  var layers = this.mapProperties.metadata && this.mapProperties.metadata.layers;

  if (!layers) {
    return index;
  }

  var tilerLayerIndex = {}
  var j = 0;
  for (var i = 0; i < layers.length; i++) {
    if (layers[i].type == layerType) {
      tilerLayerIndex[j] = i;
      j++;
    }
  }
  if (tilerLayerIndex[index] == undefined) {
    return -1;
  }
  return tilerLayerIndex[index];
}

/**
 * Returns the index of a layer of a given type, as the tiler kwows it.
 *
 * @param {string|array} types - Type or types of layers
 */
cdb.windshaft.PublicMap.prototype.getLayerIndexesByType = function(types) {
  var layers = this.mapProperties.metadata && this.mapProperties.metadata.layers;

  if (!layers) {
    return;
  }
  var layerIndexes = [];
  for (var i = 0; i < layers.length; i++) {
    var layer = layers[i];
    var isValidType = layer.type !== 'torque';
    if (types && types.length > 0) {
      isValidType = isValidType && types.indexOf(layer.type) != -1
    }
    if (isValidType) {
      layerIndexes.push(i);
    }
  }
  return layerIndexes;
}

cdb.windshaft.PublicMap.prototype.getTiles = function() {
  
}