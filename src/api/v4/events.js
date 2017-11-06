/**
 * Enum for operation values.
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
   * @event carto.events.SUCCESS
   * @api
   */
  SUCCESS: 'success',
  /**
   * Reload started event, fired every time the reload process has some error.
   *
   * @event carto.events.ERROR
   * @api
   */
  ERROR: 'error'
};

module.exports = events;
