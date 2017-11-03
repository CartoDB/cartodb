/**
 *  @api
 *  @namespace carto.Events
 *  
 *  @description
 *  Namespace to access the `carto.js` events.
 */

module.exports = {
  /**
   * Reload started event, fired every time the reload process is completed succesfully.
   * @api
   * @event carto.Events.SUCCESS
   */
  SUCCESS: 'success',

  /**
   * Reload started event, fired every time the reload process has some error.
   * @api
   * @event carto.Events.ERROR
   */
  ERROR: 'error'
};
