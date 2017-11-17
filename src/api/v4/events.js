/**
 * @namespace carto.events
 * @api
 */

/**
  * Reload started event, fired every time the reload process is completed succesfully.
  *
  * @constant {string} SUCCESS
  * @memberof carto.events
  * @api
  */
var SUCCESS = 'success';

/**
 * Reload started event, fired every time the reload process has some error.
 *
 * @constant {string} ERROR
 * @memberof carto.events
 * @api
 */
var ERROR = 'error';

module.exports = {
  SUCCESS: SUCCESS,
  ERROR: ERROR
};
