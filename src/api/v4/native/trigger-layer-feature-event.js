module.exports = function (eventName, internalEvent, layers) {
  var layer = layers.findById(internalEvent.layer.id);
  if (layer) {
    var event = {
      data: undefined,
      latLng: undefined
    };
    if (internalEvent.feature) {
      event.data = internalEvent.feature;
    }
    if (internalEvent.latlng) {
      event.latLng = {
        lat: internalEvent.latlng[0],
        lng: internalEvent.latlng[1]
      };
    }
    if (internalEvent.position) {
      event.position = {
        x: internalEvent.position.x,
        y: internalEvent.position.y
      };
    }

    /**
     *
     * Events triggered by {@link carto.layer.Layer} when users interact with a feature.
     *
     * @event carto.layer.Layer.FeatureEvent
     * @property {LatLng} latLng - Object with coordinates where interaction took place
     * @property {object} data - Object with feature data (one attribute for each specified column)
     *
     * @api
     */
    layer.trigger(eventName, event);
  }
};
