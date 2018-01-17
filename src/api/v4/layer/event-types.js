// TODO: Delete this!
/**
 * Events fired by a layer
 *
 * @enum {string}
 * @readonly
 * @memberof carto.layer
 */
var events = {
  /**
   * A feature has been clicked, fired every time the user clicks on a feature.
   */
  FEATURE_CLICKED: 'featureClicked',
  /**
   * The mouse is over a feature, fired every time the user moves over a feature.
   */
  FEATURE_OVER: 'featureOver',
  /**
   * The mouse exits a feature, fired every time the user moves out of a feature.
   */
  FEATURE_OUT: 'featureOut',
  /**
   * There has been an error related to tiles, fired every time the features are not rendered due to an error.
   */
  TILE_ERROR: 'featureError'
};

module.exports = events;
