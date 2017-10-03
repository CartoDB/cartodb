var cdb = require('cartodb.js-v3');
var Utils = require('cdb.Utils');
var markdown = require('markdown');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('public_map/views/public_map_info');
    this._initModels();
  },

  render: function () {
    var description = this.vizdata.description
      ? Utils.stripHTML(markdown.toHTML(this.vizdata.description))
      : '';

    this.$el.html(this.template({
      user: this.user,
      name: this.vizdata.name,
      description: description,
      formattedTags: [],
      mapViews: 0,
      updatedAt: '1'
    }));

    return this;
  },

  _initModels: function () {
    this.user = this.options.user;
    this.vizdata = this.options.vizdata;
  }
});
