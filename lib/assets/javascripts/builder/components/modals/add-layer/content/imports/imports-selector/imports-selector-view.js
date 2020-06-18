const _ = require('underscore');
const $ = require('jquery');
const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const IMPORT_OPTIONS = require('../import-options');
const ImportButtonView = require('./import-button-view');
const ImportOtherButtonView = require('./import-other-button-view');
const CategoryTitleTemplate = require('./import-category-title.tpl');
const ImportsSelectorModel = require('./imports-selector-model');

const REQUIRED_OPTS = [
  'createModel',
  'userModel',
  'configModel',
  'privacyModel',
  'guessingModel'
];

const IMPORTER_TYPES = {
  cloud: 'cloud',
  database: 'database',
  other: 'other',
  dataobservatory: 'dataobservatory'
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
 *  - Create a check function in the model if needed, if not will appear
 *    always enabled (for everybody!).
 *
 */

module.exports = CoreView.extend({
  className: 'ImportOptions',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initModels();
    this._orderedImports = this._orderImports(IMPORT_OPTIONS);

    const self = this;
    this.model.fetch({
      complete: function () {
        self.model.set('loaded', true);
      }
    });
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
    this.model.bind('change:loaded', this._generateContent, this);
  },

  _orderImports: function (importOptions) {
    let orderedOptions = {};
    Object.keys(importOptions).sort().forEach(function (key) {
      orderedOptions[key] = importOptions[key];
    });
    return orderedOptions;
  },

  _generateContent: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append(CategoryTitleTemplate({ title: '' }));
    this._generateImportButtons(IMPORTER_TYPES.dataobservatory);

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

  _generateRequestOtherButton: function () {
    const requestOtherButton = new ImportOtherButtonView(
      _.extend(
        {
          userModel: this._userModel
        }
      )
    );
    return requestOtherButton;
  },

  _generateImportButtons: function (importOptionsType) {
    const filteredOptions = this._filterImportsByType(importOptionsType);
    const importButtonsElements = $('<div/>').addClass('ImportOptions__row');

    _.each(filteredOptions, function (importConfig) {
      let connector = {};
      if (!_.isEmpty(importConfig) && importConfig.enabled(this._configModel, this._userModel)) {
        connector = {
          name: importConfig.name,
          selected: importConfig.name === 'file'
        };

        let importButton;
        importButton = new ImportButtonView(
          _.extend(
            importConfig.options || {},
            {
              importView: importConfig.view,
              name: importConfig.name,
              title: importConfig.title,
              enable: importConfig.enable,
              userModel: this._userModel,
              configModel: this._configModel,
              createModel: this._createModel,
              privacyModel: this._privacyModel,
              guessingModel: this._guessingModel,
              loaded: this.model.get('loaded')
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

    if (importOptionsType === IMPORTER_TYPES.other) {
      const importRequestOtherButton = this._generateRequestOtherButton();
      importButtonsElements.append(importRequestOtherButton.render().el);
    }

    this.$el.append(importButtonsElements);
  },

  _filterImportsByType: function (type) {
    const imports = this._orderedImports;
    return Object.keys(imports).reduce(function (sum, key) {
      if (imports[key].type === type) {
        sum[key] = imports[key];
      }
      return sum;
    }, {});
  },

  _addStatusCSSClases: function (importButton, importConfig) {
    const enabled = this.model._isImportEnabled(importConfig);
    if (!enabled) {
      importButton.$el.addClass('is-disabled');
    }

    if (!enabled && importConfig.type === IMPORTER_TYPES.database && !this._userModel.isEnterprise()) {
      importButton.$el.addClass('is-enterprise');
    }

    if (importConfig.options && importConfig.options.beta) {
      importButton.$el.addClass('is-beta');
    }

    if (importConfig.options && importConfig.options.soon) {
      importButton.$el.addClass('is-soon');
    }

    if (importConfig.options && importConfig.options.new) {
      importButton.$el.addClass('is-new');
    }

    if (importConfig.options && importConfig.options.highlighted) {
      importButton.$el.addClass('is-highlighted');
    }
  },

  _onImportSelected: function (selectedImport) {
    let importContent;
    const opts = selectedImport.options;
    const enabled = this.model._isImportEnabled(opts);

    if ((enabled || enabled === undefined)) {
      // Import wizard view
      if (opts.importView) {
        const ImportView = opts.importView;
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
      // Link to elsewhere in dashboard
      } else if (opts.link) {
        window.location = this._configModel.get('base_url') + opts.link;
        return;
      }
    }

    this.trigger('selectImport', importContent, this);
  },

  clean: function () {
    CoreView.prototype.clean.call(this);
  }
});
