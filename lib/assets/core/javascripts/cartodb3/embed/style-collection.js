var Backbone = require('backbone');
module.exports = Backbone.Collection.extend({
  model: function (d, opts) {
    var attrs = {};
    attrs.id = d.id;
    if (d.options.tile_style) {
      attrs.cartocss = d.options.tile_style;
    }
    return new Backbone.Model(attrs);
  },

  resetByLayersData: function (data) {
    this.reset(data, {
      silent: true
    });
  },

  findById: function (id) {
    return this.findWhere({id: id});
  }
});
