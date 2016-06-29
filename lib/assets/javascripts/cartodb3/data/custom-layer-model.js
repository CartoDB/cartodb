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
    var self = this;
    var c = {};

    _.extend(c, data.options, {
      id: data.id,
      className: self._generateClassName(data.options.urlTemplate),
      type: 'Tiled',
      order: data.order,
      parent_id: data.parent_id,
      name: 'Custom basemap ' + data.order
    });

    return c;
  },

  toJSON: function () {
    var c = _.clone(this.attributes);

    var d = {
      kind: 'tiled',
      options: c,
      order: c.order
    };

    if (c.id !== undefined) {
      d.id = c.id;
    }

    return d;
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
