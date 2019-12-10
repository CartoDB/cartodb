var _ = require('underscore');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var ViewFactory = require('builder/components/view-factory');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var IMPORT_OPTIONS = require('../import-options');
var ImportButtonView = require('./import-button-view');
var CategoryTitleTemplate = require('./import-category-title.tpl');
var ImportsSelectorModel = require('./imports-selector-model');

var REQUIRED_OPTS = [
  'createModel',
  'userModel',
  'configModel',
  'privacyModel',
  'guessingModel'
];

const IMPORTER_TYPES = {
  cloud: 'cloud',
  database: 'database',
  other: 'other'
};

/**
 *  Imports selector view
 *
 *  Displays all the import options available
 *  through new create dialog.
 *
 *  IMPORTANT!!
 *
 *  If you need to add a new import option:
 *
 *  - Create the proper class within imports folder and its tests.
 *  - Add necessary info in import_options file.
 *  - Create a check function here if needed, if not will appear
 *    always enabled (for everybody!).
 *
 */

module.exports = CoreView.extend({
  className: 'ImportOptions',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initModels();
    this._orderedImports = this._orderImports(IMPORT_OPTIONS);
    this.model.fetch();
  },

  render: function () {
    this._generateContent();
    return this;
  },

  _initModels: function () {
    this.model = new ImportsSelectorModel({}, {
      userModel: this._userModel,
      configModel: this._configModel
    });
    this.model.bind('sync', this._generateContent, this);
  },

  _orderImports: function (importOptions) {
    var orderedOptions = {};
    Object.keys(importOptions).sort().forEach(function (key) {
      orderedOptions[key] = importOptions[key];
    });
    return orderedOptions;
  },

  _generateContent: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(CategoryTitleTemplate({
      title: 'Cloud Storage'
    }));
    this._generateImportButtons(IMPORTER_TYPES.cloud);

    this.$el.append(CategoryTitleTemplate({
      title: 'Database'
    }));
    this._generateImportButtons(IMPORTER_TYPES.database);

    this.$el.append(CategoryTitleTemplate({
      title: 'Other'
    }));
    this._generateImportButtons(IMPORTER_TYPES.other);
  },

  _generateImportButtons: function (importOptionsType) {
    var filteredOptions = this._filterImportsByType(importOptionsType);
    var importButtonsElements = $('<div/>').addClass('ImportOptions__row');

    _.each(filteredOptions, function (importConfig) {
      var connector = {};
      if (!_.isEmpty(importConfig) && importConfig.enabled(this._configModel, this._userModel)) {
        connector = {
          name: importConfig.name,
          selected: importConfig.name === 'file'
        };

        var importButton;
        importButton = new ImportButtonView(
          _.extend(
            importConfig.options || {},
            {
              importView: importConfig.view,
              name: importConfig.name,
              title: importConfig.title,
              enable: importConfig.enable,
              fallback: importConfig.fallback,
              userModel: this._userModel,
              configModel: this._configModel,
              createModel: this._createModel,
              privacyModel: this._privacyModel,
              guessingModel: this._guessingModel
            }
          )
        );
        this._addStatusCSSClases(importButton, importConfig);
        importButton.bind('importSelected', this._onImportSelected, this);

        connector.createButtonView = function () {
          return importButton;
        };

        importButtonsElements.append(connector.createButtonView().render().el);
      }
    }, this);

    this.$el.append(importButtonsElements);
  },

  _filterImportsByType: function (type) {
    var imports = this._orderedImports;
    return Object.keys(imports).reduce(function (sum, key) {
      if (imports[key].type === type) {
        sum[key] = imports[key];
      }
      return sum;
    }, {});
  },

  _addStatusCSSClases: function (importButton, importConfig) {
    switch (this.model._checkImportStatus(importConfig)) {
      case 'disabled':
        importButton.$el.addClass('is-disabled');
        break;
      case 'beta':
        importButton.$el.addClass('is-beta');
        break;
    }
  },

  _onImportSelected: function (selectedImport) {
    var importContent;
    var opts = selectedImport.options;
    var status = this.model._checkImportStatus(opts);

    if ((status === 'enabled' || status === undefined)) {
      var ImportView = opts.importView;
      importContent = new ImportView(
        _.extend(
          opts,
          {
            userModel: this._userModel,
            configModel: this._configModel,
            createModel: this._createModel,
            privacyModel: this._privacyModel,
            guessingModel: this._guessingModel
          }
        )
      );
    } else if (opts.fallback) {
      var options = {
        name: opts.name,
        title: opts.title,
        status: status
      };
      importContent = ViewFactory.createByTemplate(opts.fallback, options);
      importContent.options = options;
    }

    this.trigger('selectImport', importContent, this);
  },

  clean: function () {
    CoreView.prototype.clean.call(this);
  }
});
