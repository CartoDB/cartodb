var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var ViewFactory = require('builder/components/view-factory');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var IMPORT_OPTIONS = require('../import-options');
var ImportButtonView = require('./import-button-view');
var CategoryTitleTemplate = require('./import-catagory-title.tpl');

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

  events: {
    'click .js-goNext': '_moveToNextTabs',
    'click .js-goPrev': '_moveToPrevTabs'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initModels();
    this._orderedImports = this._orderImports(IMPORT_OPTIONS);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this._generateContent();
    return this;
  },

  _initModels: function () {
    this.model = new Backbone.Model({
      page: 1,
      maxPages: 0
    });
  },

  _orderImports: function (importOptions) {
    var orderedOptions = {};
    Object.keys(importOptions).sort().forEach(function (key) {
      orderedOptions[key] = importOptions[key];
    });
    return orderedOptions;
  },

  _generateContent: function () {
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
    switch (this._checkImportStatus(importConfig)) {
      case 'disabled':
        importButton.$el.addClass('is-disabled');
        break;
      case 'beta':
        importButton.$el.addClass('is-beta');
        break;
    }
  },

  _checkImportStatus: function (opts) {
    // Check if import option function exists
    var fn = this['_check' + opts.title.replace(' ', '') + 'Import'];
    var status = 'enabled';
    if (fn) {
      status = fn.bind(this)();
    }
    return status;
  },

  _checkGoogleDriveImport: function () {
    if (!this._configModel.get('oauth_gdrive')) {
      return 'disabled';
    }
    return 'enabled';
  },

  _checkDropboxImport: function () {
    if (!this._configModel.get('oauth_dropbox')) {
      return 'disabled';
    }
    return 'enabled';
  },

  _checkBoxImport: function () {
    if (!this._configModel.get('oauth_box')) {
      return 'disabled';
    }
    return 'enabled';
  },

  _checkTwitterImport: function () {
    if (!this._configModel.get('datasource_search_twitter') ||
        !this._userModel.get('twitter').enabled ||
        !this._userModel.canCreateTwitterDataset()) {
      return 'disabled';
    }
    return 'enabled';
  },

  _checkInstagramImport: function () {
    if (!this._userModel.featureEnabled('instagram_import')) {
      return 'disabled';
    }
    if (!this._configModel.get('oauth_instagram')) {
      return 'disabled';
    }
    return 'enabled';
  },

  _checkSalesforceImport: function () {
    // Connector is now disabled for everyone.
    // You might be able to use the following check to determine
    // if user/org has this connector enabled:
    // this._userModel.get('salesforce').enabled
    return 'disabled';
  },

  _checkMailchimpImport: function () {
    if (!this._configModel.get('oauth_mailchimp')) {
      // this._setImportButtonDisabled('mailchimp');
      return 'disabled';
    }

    if (!this._userModel.featureEnabled('mailchimp_import')) {
      return 'disabled';
    }
    return 'enabled';
  },

  _checkPostgreSQLImport: function () {
    return 'disabled';
  },

  _checkMySQLImport: function () {
    return 'disabled';
  },

  _checkSQLServerImport: function () {
    return 'disabled';
  },

  _checkHiveImport: function () {
    return 'disabled';
  },

  _checkBigQueryImport: function () {
    return 'beta';
  },

  _onImportSelected: function (selectedImport) {
    var importContent;
    var opts = selectedImport.options;
    var status = this._checkImportStatus(opts);

    if ((status === 'enabled' || status === undefined) /* && !_.isEmpty(opts.fallback) */) {
      var ImportView = opts.importView;
      importContent = new ImportView(
        _.extend(
          opts,
          {
            userModel: this._userModel,
            configModel: this._configModel,
            title: opts.title,
            createModel: this._createModel,
            privacyModel: this._privacyModel,
            guessingModel: this._guessingModel
          }
        )
      );
    } else if (opts.fallback) {
      var options = {
        name: opts.name,
        title: opts.title
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
