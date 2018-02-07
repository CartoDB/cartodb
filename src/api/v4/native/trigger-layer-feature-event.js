module.exports = function (eventName, internalEvent, layer) {
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
     * Event object for feature events triggered by {@link carto.layer.Layer}.
     *
     * @typedef {object} carto.layer.FeatureEvent
     * @property {LatLng} latLng - Object with coordinates where interaction took place
     * @property {object} data - Object with feature data (one attribute for each specified column)
     * @api
     */

    /**
     * Fired when user clicks on a feature.
     *
     * @event featureClicked
     * @type {carto.layer.FeatureEvent}
     * @api
     */

    /**
     * Fired when user moves the mouse over a feature.
     *
     * @event featureOver
     * @type {carto.layer.FeatureEvent}
     * @api
     */

    /**
     * Fired when user moves the mouse out of a feature.
     *
     * @event featureOut
     * @type {carto.layer.FeatureEvent}
     * @api
     */
    layer.trigger(eventName, event);
  }
};
