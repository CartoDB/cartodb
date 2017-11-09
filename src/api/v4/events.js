/**
 * @namespace carto.events
 * @api
 */

/**
  * @constant {string} SUCCESS
  * @description
  * Reload started event, fired every time the reload process is completed succesfully.
  * @memberof carto.events
  * @api
  */
var SUCCESS = 'success';

/**
 * @constant {string} ERROR
 * @description 
 * Reload started event, fired every time the reload process has some error.
 * 
 * @memberof carto.events
 * @api
 */
var ERROR = 'error';

module.exports = {
  SUCCESS: SUCCESS,
  ERROR: ERROR
};
