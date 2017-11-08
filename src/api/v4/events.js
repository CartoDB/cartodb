/**
 * Enum for event names.
 *
 * @enum {string} carto.events
 * @readonly
 * @memberof carto
 * @api
 */
var events = {
  /**
   * Reload started event, fired every time the reload process is completed succesfully.
   *
   * @api
   */
  SUCCESS: 'success',

  /**
   * Reload started event, fired every time the reload process has some error.
   *
   * @api
   */
  ERROR: 'error'
};

module.exports = events;
