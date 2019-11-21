var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var ImportsSelectorView = require('./imports-selector/imports-selector-view');
var SelectedImportView = require('./selected-import/selected-import-view');

var REQUIRED_OPTS = [
  'createModel',
  'userModel',
  'configModel',
  'privacyModel',
  'guessingModel'
];

/**
 *  Selected Import header
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

  _showImportsSelector: function (opts) {
    this.trigger('toggleNavigation', this);
    this._importsSelector.show();
    this._selectedImport.remove();
  },

  _renderSelectedImportView: function (importContent) {
    if (importContent) {
      // TODO importContent.bind('change', this._setUploadModel, this);
      this._selectedImport = new SelectedImportView({
        title: importContent.options.title,
        name: importContent.options.name,
        importView: importContent
        // uploadModel: this._createModel.getUploadModel()
      });
      this._selectedImport.bind('showImportsSelector', this._showImportsSelector, this);
      this.$el.append(this._selectedImport.render().el);
      this.addView(this._selectedImport);
    }
  }
});
