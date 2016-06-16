var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({

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
      parent_id: data.parent_id
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
  }

});
