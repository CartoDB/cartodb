/**
 * @namespace carto.events
 */

/**
  * Reload started event, fired every time the reload process is completed succesfully.
  *
  * @constant {string} SUCCESS
  * @memberof carto.events
  */
var SUCCESS = 'success';

/**
 * Reload started event, fired every time the reload process has some error.
 *
 * @constant {string} ERROR
 * @memberof carto.events
 */
var ERROR = 'error';

/**
 * Fired when something went wrong on the server side.
 * 
 * @event error
 * @type {CartoError}
 */
module.exports = {
  SUCCESS: SUCCESS,
  ERROR: ERROR
};
