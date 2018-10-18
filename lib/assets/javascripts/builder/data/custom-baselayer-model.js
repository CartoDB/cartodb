/* global Image */

var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({

  getAttributes: function () {
    return JSON.parse(JSON.stringify(this.attributes));
  },

  _generateClassName: function (urlTemplate) {
    if (urlTemplate) {
      return urlTemplate.replace(/\s+/g, '').replace(/[^a-zA-Z_0-9 ]/g, '').toLowerCase();
    } else return '';
  },

  parse: function (data) {
    var attrs = {};

    _.extend(attrs, data.options, {
      id: data.id,
      className: this._generateClassName(data.options.urlTemplate),
      type: 'Tiled',
      order: data.order,
      parent_id: data.parent_id
    });

    return attrs;
  },

  toJSON: function () {
    var layerOptions = _.clone(_.omit(this.attributes, ['order', 'id']));
    var json = {
      kind: 'tiled',
      options: layerOptions,
      order: this.get('order'),
      id: this.id
    };

    return json;
  },

  getValue: function () {
    return this.get('val');
  },

  /**
   * validateTemplateURL - Validates current urlTemplate of layer.
   *
   * @param {Object} callbacks with success and error functions defined to be called depending on validation outcome.
   */
  validateTemplateURL: function (callbacks) {
    var subdomains = ['a', 'b', 'c'];
    var image = new Image();
    image.onload = callbacks.success;
    image.onerror = callbacks.error;
    image.src = this.get('urlTemplate').replace(/\{s\}/g, function () {
      return subdomains[Math.floor(Math.random() * 3)];
    })
      .replace(/\{x\}/g, '0')
      .replace(/\{y\}/g, '0')
      .replace(/\{z\}/g, '0');
  }

});
