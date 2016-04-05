var cdb = require('cartodb-deep-insights.js');
var ViewFactory = require('../../../../view-factory');
var importViewTemplate = require('./imports.tpl');
var importTabViewTemplate = require('./import-tab.tpl');
var TipsyTooltipView = require('../../../../tipsy-tooltip-view');
var TabPaneView = require('../../../../tab-pane/tab-pane-view');
var TabPaneCollection = require('../../../../tab-pane/tab-pane-collection');
var _ = require('underscore');
var IMPORT_OPTIONS = require('./import-options');
var TABS_PER_ROW = 5;
var DEFAULT_IMPORT = 'file';
var ROW_WIDTH = 800;

/**
 *  Imports view
 *
 *  Displays all the import options available
 *  through new create dialog.
 *
 *  IMPORTANT!!
 *
 *  If you need to add a new import pane:
 *
 *  - Create the proper class within imports folder and its tests.
 *  - Add necessary info in import_options file.
 *  - Create a check function here if needed, if not will appear
 *    always enabled (for everybody!).
 *
 */

module.exports = cdb.core.View.extend({
  className: 'ImportOptions',

  events: {
    'click .js-goNext': '_moveToNextTabs',
    'click .js-goPrev': '_moveToPrevTabs'
  },

  initialize: function (opts) {
    if (!opts.createModel) throw new Error('createModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this._createModel = opts.createModel;
    this.model = new cdb.core.Model({
      page: 1,
      maxPages: 0
    });
  },

  render: function () {
    this._destroyBinds();
    this.clearSubViews();
    this.$el.empty();

    this._generateContent();
    this._generateNavigationTabs();
    this._initBinds();
    this._setOption();

    return this;
  },

  // //////////////////
  // TABS && PANES!  //
  // //////////////////

  _generateContent: function () {
    var paneItems = [];

    _.each(IMPORT_OPTIONS, function (importConfig, i) {
      var obj = {};
      if (!_.isEmpty(importConfig)) {
        obj = {
          name: importConfig.name,
          selected: importConfig.name === 'file'
        };

        obj.createButtonView = function () {
          return ViewFactory.createByHTML(
            importTabViewTemplate({
              title: cdb.core.sanitize.html(importConfig.title || importConfig.name),
              name: importConfig.name
            })
          );
        };

        var pane;

        // Check if import option function exists
        var fn = this['_check' + i + 'Import'];
        var isEnabled;

        if (fn) {
          isEnabled = fn.bind(this)();
        }

        if ((isEnabled || isEnabled === undefined) && !_.isEmpty(importConfig)) {
          var ImportView = importConfig.view;
          pane = new ImportView(
            _.extend(
              importConfig.options || {},
              {
                userModel: this._userModel,
                configModel: this._configModel,
                title: importConfig.title
              }
            )
          );
        } else if (importConfig.fallback) {
          pane = ViewFactory.createByTemplate(importConfig.fallback);
        }

        if (pane) {
          pane.render();
          pane.bind('change', this._setUploadModel, this);
          obj.createContentView = function () {
            return pane;
          };
        }

        paneItems.push(obj);
      }
    }, this);

    this._tabPaneCollection = new TabPaneCollection(paneItems);
    this._tabPaneView = new TabPaneView({
      template: importViewTemplate,
      collection: this._tabPaneCollection
    });
    this.$el.append(this._tabPaneView.render().el);
  },

  _generateNavigationTabs: function () {
    // Set max pages
    this.model.set('maxPages', Math.ceil(this.$('.ImportOptions-tab').size() / TABS_PER_ROW));
    this._checkNavigationTabs();
  },

  _moveToNextTabs: function () {
    var page = this.model.get('page');
    var maxPages = this.model.get('maxPages');

    if (page < maxPages) {
      this.model.set('page', page + 1);
    }
  },

  _moveToPrevTabs: function () {
    var page = this.model.get('page');
    if (page > 1) {
      this.model.set('page', page - 1);
    }
  },

  _moveNavigationTabs: function () {
    var page = this.model.get('page');
    var rowWidth = ROW_WIDTH;

    this.$('.js-tabsList').css('margin-left', '-' + (rowWidth * (page - 1)) + 'px');
    this._checkNavigationTabs();
  },

  _checkNavigationTabs: function () {
    var page = this.model.get('page');
    var maxPages = this.model.get('maxPages');

    // Check prev button
    this.$('.js-goPrev').toggleClass('is-disabled', page < 2);

    // Check next button
    this.$('.js-goNext').toggleClass('is-disabled', page >= maxPages);
  },

  _checkGDriveImport: function () {
    if (!cdb.config.get('oauth_gdrive')) {
      this._setFailedTab('gdrive', 'key');
      return false;
    }
    return true;
  },

  _checkDropboxImport: function () {
    if (!cdb.config.get('oauth_dropbox')) {
      this._setFailedTab('dropbox', 'key');
      return false;
    }
    return true;
  },

  _checkBoxImport: function () {
    if (!cdb.config.get('oauth_box')) {
      this._setFailedTab('box', 'key');
      return false;
    }
    return true;
  },

  _checkTwitterImport: function () {
    // Check if user have twitter datasource enabled!
    if (!cdb.config.get('datasource_search_twitter')) {
      this._setFailedTab('twitter', 'key');
      return false;
    }
    // Check if user can create or import a new file or user has
    // enough rights to enable twitter!
    if (!this._userModel.get('twitter').enabled) {
      return false;
    }
    // Check if user can create or import a new file or user has
    // enough rights to enable twitter!
    if (this._userModel.canCreateTwitterDataset()) {
      this._setFailedTab('twitter', 'credits');
      return false;
    }
    return true;
  },

  _checkInstagramImport: function () {
    if (!this._userModel.featureEnabled('instagram_import')) {
      return false;
    }
    if (!cdb.config.get('oauth_instagram')) {
      this._setFailedTab('instagram', 'key');
      return false;
    }
    return true;
  },

  _checkArcgisImport: function () {
    // Check if user have sync capabilities enabled
    return this._userModel.isActionEnabled('arcgis_datasource');
  },

  _checkSalesforceImport: function () {
    // Check if salesforce feature is enabled
    if (!this._userModel.featureEnabled('salesforce_import')) {
      return false;
    }
    return true;
  },

  _checkMailchimpImport: function () {
    // Config available?
    if (!cdb.config.get('oauth_mailchimp')) {
      this._setFailedTab('mailchimp', 'key');
      return false;
    }
    // Feature enabled?
    if (!this._userModel.featureEnabled('mailchimp_import')) {
      return false;
    }
    return true;
  },

  _setFailedTab: function (tabName, type) {
    var $tab = this.$('.js-' + tabName + 'Tab');
    $tab.addClass('disabled');

    // Tipsy?
    var tooltip = new TipsyTooltipView({
      el: $tab,
      title: function () {
        return _t('components.modals.add-layer.imports.tab-options-error.' + type, { name: tabName });
      }
    });
    this.addView(tooltip);
  },

  _setUploadModel: function (d) {
    var uploadModel = this._createModel.getUploadModel();
    uploadModel.setFresh(d);
  },

  _initBinds: function () {
    this.model.bind('change:page', this._moveNavigationTabs, this);
    if (this._tabPaneCollection) {
      this._tabPaneCollection.bind('change:selected', this._onTabChange, this);
    }
  },

  _destroyBinds: function () {
    if (this._tabPaneCollection) {
      this._tabPaneCollection.bind('change:selected', null, this);
    }
  },

  _setOption: function () {
    // First option > data file
    var tabPaneModel = _.first(this._tabPaneCollection.where({ name: DEFAULT_IMPORT }));
    if (tabPaneModel) {
      tabPaneModel.set('selected', true);
      this._updateImportOption();
    }
  },

  _updateImportOption: function () {
    this._createModel.setActiveImportPane(this._tabPaneView.getSelectedTabPaneName());
  },

  // //////////
  // Events //
  // //////////

  _onTabChange: function (tabModel) {
    // var view = this._tabPaneView.getSelectedTabPane();
    // Set upload model from activated pane to create model
    // var upload = view.getModelData && view.getModelData();
    // this._setUploadModel(upload || {});
    this._updateImportOption();
  },

  clean: function () {
    this._destroyBinds();
    cdb.core.View.prototype.clean.call(this);
  }

});
