var _ = require('underscore');
var Base = require('./base');
var CartoError = require('../error');

// Event constants
var CONTENT_CHANGED = 'contentChanged';

/**
 * A CartoCSS/TurboCarto style that can be applied to a {@link carto.layer.Layer}.
 * @param {string} cartocss CartoCSS
 * @example
 * var style = new carto.style.CartoCSS(`
 *   #layer {
 *     marker-fill: #FABADA;
 *     marker-width: 10;
 *   }
 * `);
 * @constructor
 * @extends carto.style.Base
 * @memberof carto.style
 * @api
 */
function CartoCSS (cartoCSS) {
  _checkCartoCSS(cartoCSS);
  this._cartoCSS = cartoCSS;
}

CartoCSS.prototype = Object.create(Base.prototype);

/**
 * Get the current CartoCSS/TurboCarto style as a string.
 * 
 * @return {string} - The TurboCarto style for this CartoCSS object
 * @api
 */
CartoCSS.prototype.toCartoCSS = function () {
  return this._cartoCSS;
};

/**
 * Get the current CartoCSS/TurboCarto style as a string.
 * 
 * @return {string} - The TurboCarto style for this CartoCSS object
 * @api
 */
CartoCSS.prototype.getStyle = function () {
  return this._cartoCSS;
};

/**
 * Set the CartoCSS/Turbocarto as a string.
 * 
 * @param {string} newContent - A string containing the new cartocss/turbocarto style
 * @return {Promise<string>} A promise that will be resolved once the cartocss/turbocarto is updated
 * @fires 
 * @api
 */
CartoCSS.prototype.setContent = function (newContent) {
  var self = this;
  _checkCartoCSS(newContent);
  this._cartoCSS = newContent;
  // Notify layers that the style has been changed so they can update their internalModels.
  this.trigger('$changed', this);
  if (!this._engine) {
    return _onContentChanged.call(this, newContent);
  }

  return this._engine.reload().then(function () {
    return _onContentChanged.call(self, newContent);
  }).catch(function (windshaftError) {
    return Promise.reject(new CartoError(windshaftError));
  });
};

// Once the reload cycle is completed trigger a contentChanged event.
function _onContentChanged (newContent) {
  this.trigger(CONTENT_CHANGED, this._cartoCSS);
  return Promise.resolve(this._cartoCSS);
}

function _checkCartoCSS (cartoCSS) {
  if (!cartoCSS) {
    throw new TypeError('cartoCSS is required.');
  }

  if (!_.isString(cartoCSS)) {
    throw new Error('cartoCSS must be a string.');
  }
}

module.exports = CartoCSS;
