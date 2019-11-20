var _ = require('underscore');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var ViewFactory = require('builder/components/view-factory');
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
 *
 *
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
    this._selectedImport.hide();
  },

  _renderSelectedImportView: function (opts) {
    var importContent;

    // Check if import option function exists
    var fn = this['_check' + opts.title.replace(' ', '') + 'Import'];
    var isEnabled = true;

    if (fn) {
      isEnabled = fn.bind(this)();
    }

    if ((isEnabled || isEnabled === undefined) /* && !_.isEmpty(opts.fallback) */) {
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
      importContent = ViewFactory.createByTemplate(opts.fallback);
    }
    // debugger;
    if (importContent) {
      this._selectedImport = new SelectedImportView({
        title: opts.title,
        name: opts.name,
        importView: importContent
        // uploadModel: this._createModel.getUploadModel()
      });
      this._selectedImport.bind('showImportsSelector', this._showImportsSelector, this);
      this.$el.append(this._selectedImport.render().el);
      this.addView(this._selectedImport);
    }

    // if (importContent) {
    //   // TODO importContent.bind('change', this._setUploadModel, this);
    //   this.$el.empty();
    //   this.trigger('hideNavigation', this);
    //   debugger;
    //   this.$el.append(importSelectedHeader.render().el);
    //   this.$el.append(importContent.render().el);
    //   this.addView(importContent);
    // }
  }
});
