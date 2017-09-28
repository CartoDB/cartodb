var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({
  tagName: 'section',

  initialize: function () {
    this.template = cdb.templates.getTemplate('public_map/views/public_map_container');
    this._initModels();
    this._initViews();
  },

  _initModels: function () {
    this.mapId = this.options.mapId;
  },

  _initViews: function () {
    this.$el.html(this.template({
      mapId: this.mapId
    }));
  }
});
