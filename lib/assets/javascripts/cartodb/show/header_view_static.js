var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('show/views/header');

    this._initModels();
  },

  render: function () {
    this.$el.html(this.template({
      toggleDatasetPath: '#/table',
      toggleMapPath: '#/map',
      backPath: '/',
      optionsPath: '#/options',
      changeTitlePath: '#/change-title',
      visualizationName: this.vizdata.name,
      editMetadataPath: '#/edit-metadata',
      visualizePath: '#/visualize'
    }));

    return this;
  },

  _initModels: function () {
    this.vizdata = this.options.vizdata;
  }
});
