var _ = require('underscore');
var Base = require('./base');
var CartoValidationError = require('../error-handling/carto-validation-error');
var CartoError = require('../error-handling/carto-error');

// Event constants
var CONTENT_CHANGED = 'contentChanged';

/**
 * A CartoCSS/TurboCarto style that can be applied to a {@link carto.layer.Layer}.
 * @param {string} content - A CartoCSS string
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
function CartoCSS (content) {
  _checkContent(content);
  this._content = content;
}

CartoCSS.prototype = Object.create(Base.prototype);

/**
 * Get the current CartoCSS/TurboCarto style as a string.
 *
 * @return {string} - The TurboCarto style for this CartoCSS object
 * @api
 */
CartoCSS.prototype.getContent = function () {
  return this._content;
};

/**
 * Set the CartoCSS/Turbocarto as a string.
 *
 * @param {string} newContent - A string containing the new cartocss/turbocarto style
 * @return {Promise<string>} A promise that will be resolved once the cartocss/turbocarto is updated
 * @example
 * // Get the cartoCSS from an exiting layer
 * let cartoCSS = layer.getStyle();
 * // Update the cartoCSS content, remember this method is asynchronous!
 * cartoCSS.setContent(`
 *  #layer {
 *    marker-fill: blue;
 *  }`)
 *  .then(() => {
 *    console.log('cartoCSS was updated'); 
 *  })
 *  .catch(() => {
 *    console.error('Error updating the cartoCSS for the layer');
 *  });
 * @api
 */
CartoCSS.prototype.setContent = function (newContent) {
  _checkContent(newContent);
  this._content = newContent;
  // Notify layers that the style has been changed so they can update their internalModels.
  this.trigger('$changed', this);
  if (!this._engine) {
    return _onContentChanged.call(this, newContent);
  }

  return this._engine.reload()
    .then(function () {
      return _onContentChanged.call(this, newContent);
    }.bind(this))
    .catch(function (windshaftError) {
      return Promise.reject(new CartoError(windshaftError));
    });
};

// Once the reload cycle is completed trigger a contentChanged event.
function _onContentChanged (newContent) {
  this.trigger(CONTENT_CHANGED, this._content);
  return Promise.resolve(this._content);
}

function _checkContent (content) {
  if (!content) {
    throw new CartoValidationError('style', 'requiredCSS');
  }

  if (!_.isString(content)) {
    throw new CartoValidationError('style', 'requiredCSSString');
  }
}

module.exports = CartoCSS;
