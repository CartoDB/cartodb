var FormView = require('../import-data/import-data-form-view');
var HeaderView = require('../import-data/import-data-header-view');
var SelectedDatasetView = require('./import-arcgis-selected-dataset-view');
var ImportDataView = require('../import-data/import-data-view');
var headerTemplate = require('./import-arcgis-header.tpl');
var formTemplate = require('./import-arcgis-form.tpl');

/**
 *  Import ArcGIS panel
 *
 *  - It only accepts an url, and it could be a map or a layer.
 *
 */

module.exports = ImportDataView.extend({
  options: {
    fileExtensions: [],
    type: 'service',
    service: 'arcgis',
    acceptSync: true,
    fileEnabled: false,
    fileAttrs: {
      ext: false,
      title: '',
      description: ''
    }
  },

  _initViews: function () {
    var headerView = new HeaderView({
      el: this.$('.ImportPanel-header'),
      model: this.model,
      userModel: this._userModel,
      collection: this.collection,
      fileEnabled: this.options.fileEnabled,
      acceptSync: this.options.acceptSync,
      template: headerTemplate
    });
    headerView.render();
    this.addView(headerView);

    var selected = new SelectedDatasetView({
      el: this.$('.DatasetSelected'),
      userModel: this._userModel,
      model: this.model,
      acceptSync: this.options.acceptSync,
      fileAttrs: this.options.fileAttrs,
      configModel: this._configModel
    });
    selected.render();
    this.addView(selected);

    var formView = new FormView({
      el: this.$('.ImportPanel-form'),
      userModel: this._userModel,
      model: this.model,
      template: formTemplate,
      fileEnabled: this.options.fileEnabled
    });

    formView.render();
    this.addView(formView);
  }
});
