/**
 * Enum for operation values.
 *
 * @enum {string} carto.EVENTS
 * @readonly
 * @memberof carto
 * @api
 */
var EVENTS = {
  /**
   * Reload started event, fired every time the reload process is completed succesfully.
   *
   * @event carto.EVENTS.SUCCESS
   * @api
   */
  SUCCESS: 'success',
  /**
   * Reload started event, fired every time the reload process has some error.
   *
   * @event carto.EVENTS.ERROR
   * @api
   */
  ERROR: 'error'
};

module.exports = EVENTS;
