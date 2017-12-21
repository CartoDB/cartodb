var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('show/views/header');

    this._initModels();
  },

  render: function () {
    this.$el.html(this.template({
      backPath: '/',
      changeTitlePath: '#/change-title',
      editMetadataPath: '#/edit-metadata',
      optionsPath: '#/options',
      toggleDatasetPath: '#/table',
      toggleMapPath: '#/map',
      visualizationName: this.vizdata.name,
      visualizePath: '#/visualize'
    }));

    return this;
  },

  _initModels: function () {
    this.vizdata = this.options.vizdata;
  }
});
