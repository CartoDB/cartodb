var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var ImportsSelectorView = require('./imports-selector/imports-selector-view');
var SelectedImportView = require('./selected-import/selected-import-view');
var SelectedImportModel = require('./selected-import/selected-import-model');
var UploadModel = require('builder/data/upload-model');

var REQUIRED_OPTS = [
  'createModel',
  'userModel',
  'configModel',
  'privacyModel',
  'guessingModel'
];

/**
 * Imports Wrapper View
 *
 * This view contains the ImportsSelectorView (aka grid, connectors list)
 * and the Selected Import. So this view can switch and show/hide
 * between the two.
 *
 * The Selected Import is not created here. It's created in the
 * ImportsSelectorView and passed in a triggered event.
 */

module.exports = CoreView.extend({
  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this._initViews();

    return this;
  },

  _initViews: function () {
    this._importsSelector = new ImportsSelectorView({
      userModel: this._userModel,
      configModel: this._configModel,
      createModel: this._createModel,
      privacyModel: this._privacyModel,
      guessingModel: this._guessingModel
    });
    this._importsSelector.bind('selectImport', this._selectImport, this);
    this.$el.append(this._importsSelector.render().el);
    this.addView(this._importsSelector);
  },

  _selectImport: function (opts) {
    this.trigger('toggleNavigation', this);
    this._importsSelector.hide();
    this._renderSelectedImportView(opts);
  },

  _showImportsSelector: function () {
    this._resetUploadModel();
    this.trigger('toggleNavigation', this);
    this._importsSelector.show();
    this._selectedImport.remove();
  },

  _renderSelectedImportView: function (importContent) {
    if (importContent) {
      importContent.bind('change', this._setUploadModel, this);

      var selectedImportModel = new SelectedImportModel({
        title: importContent.options.title,
        name: importContent.options.name,
        status: importContent.options.status,
        beta: importContent.options.beta
      });

      this._selectedImport = new SelectedImportView({
        model: selectedImportModel,
        importView: importContent,
        userModel: this._userModel
      });
      this._selectedImport.bind('showImportsSelector', this._showImportsSelector, this);
      this.$el.append(this._selectedImport.render().el);
      this.addView(this._selectedImport);
    }
  },

  _setUploadModel: function (d) {
    var uploadModel = this._createModel.getUploadModel();
    uploadModel.setFresh(d);
  },

  _resetUploadModel: function () {
    this._setUploadModel(new UploadModel(null, {
      configModel: this._configModel,
      userModel: this._userModel
    }).attributes);
  }
});
