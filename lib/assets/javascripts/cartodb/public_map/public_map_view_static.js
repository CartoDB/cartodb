var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('public_map/views/public_map');
    this._initModels();
  },

  render: function () {
    this.$el.html(this.template({
      mapId: this.mapId
    }));

    return this;
  },

  _initModels: function () {
    this.vizdata = this.options.vizdata;
    this.mapId = this.options.mapId;
  }
});
