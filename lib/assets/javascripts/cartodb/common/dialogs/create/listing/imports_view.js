var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var ImportOptions = require('./import_options');
var ImportFallback = require('./imports/import_default_fallback_view');
var _ = require('underscore-cdb-v3');

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

  _TABS_PER_ROW: 5,
  _DEFAULT_IMPORT: 'file',
  _IMPORT_OPTIONS: ImportOptions,

  _TEXTS: {
    key:      _t('<%- name %> key is not specified and panel can\'t be enabled'),
    account:  _t('<%- name %> data source is not available in your plan. Please upgrade'),
    limits:   _t('You\'ve reached the limits for your account. Please upgrade'),
    credits:  _t('You\'ve reached the available <%- name %> credits for your account this month')
  },

  events: {
    'click .js-goNext': '_moveNextTabs',
    'click .js-goPrev': '_movePrevTabs'
  },

  initialize: function() {
    this.user = this.options.user;
    this.model = new cdb.core.Model({ page: 1, maxPages: 0 });
    this.createModel = this.options.createModel;
    this.template = cdb.templates.getTemplate('common/views/create/listing/import_view');
  },

  render: function() {
    this._destroyBinds();
    this.clearSubViews();
    this.$el.empty();

    // Append template content
    this.$el.append(this.template());
    // Generate tabs!
    this._genTabs();
    // Generate tabs navigation
    this._genTabsNavigation();
    // Generate panes!
    this._genPanes();
    // Set binds
    this._initBinds();
    // Set option
    this._setOption();

    return this;
  },


  ////////////////////
  // TABS && PANES! //
  ////////////////////

  _genTabs: function() {
    var tabs = "";
    var tabTemplate = cdb.templates.getTemplate('common/views/create/listing/import_tab');

    _.each(this._IMPORT_OPTIONS, function(t) {
      if (!_.isEmpty(t)) {
        if (!t.configKey || cdb.config.get(t.configKey)) {
          tabs += tabTemplate(t);
        }
      }
    });

    this.$('.ImportOptions-tabsList').append(tabs);

    // Create tabs
    this.importTabs = new cdb.admin.Tabs({
      el:     this.$('.ImportOptions-tabsList'),
      slash:  true
    });
    this.addView(this.importTabs);
  },

  _genTabsNavigation: function() {
    var numTabs = this.$('.ImportOptions-tab').size();
    if (numTabs <= 1) {
      this.$('.ImportOptions-tabs').hide();
    }

    // Set max pages
    this.model.set('maxPages', Math.ceil(numTabs / this._TABS_PER_ROW));
    this._checkTabsNavigation();
    if (this.model.get('maxPages') <= 1) {
      this.$('.ImportOptions-navigation').hide();
    }
  },

  _moveNextTabs: function() {
    var page = this.model.get('page');
    var maxPages = this.model.get('maxPages');

    if (page < maxPages) {
      this.model.set('page', page + 1);
    }
  },

  _movePrevTabs: function() {
    var page = this.model.get('page');
    if (page > 1) {
      this.model.set('page', page - 1);
    }
  },

  _moveTabsNavigation: function() {
    var page = this.model.get('page');
    var rowWidth = 800;

    this.$('.ImportOptions-tabsList').css('margin-left', '-' + (rowWidth * (page-1)) + 'px');
    this._checkTabsNavigation();
  },

  _checkTabsNavigation: function() {
    var page = this.model.get('page');
    var maxPages = this.model.get('maxPages');

    // Check prev button
    this.$('.js-goPrev')[ page > 1 ? 'removeClass' : 'addClass' ]('is-disabled');

    // Check next button
    this.$('.js-goNext')[ page < maxPages ? 'removeClass' : 'addClass' ]('is-disabled');
  },

  _genPanes: function() {
    var self = this;

    // Create TabPane
    this.importPanes = new cdb.ui.common.TabPane({
      el: this.$(".ImportOptions-panes")
    });
    this.addView(this.importPanes);

    // Link tabs with panes
    this.importTabs.linkToPanel(this.importPanes);

    // Render panes!
    _.each(this._IMPORT_OPTIONS, function(imp,i) {
      var pane = '';

      // Check if import option function exists
      var fn = self['_check' + i + 'Import'];
      var isEnabled = (fn && fn(imp, self));

      if (( isEnabled || isEnabled === undefined ) && !_.isEmpty(imp)) {
        pane = new imp.className(
          _.extend(
            ( imp.options || {} ),
            {
              user: self.user,
              title: imp.title
            }
          )
        );
      } else if (imp.fallback) {
        pane = new ImportFallback({
          template: imp.fallback
        });
      }

      if (pane) {
        pane.render();
        pane.bind('change', self._setUploadModel, self);
        self.importPanes.addTab(imp.name, pane);
        self.addView(pane);
      }
    });
  },

  _checkGDriveImport: function(imp, v) {
    if (!cdb.config.get('oauth_gdrive')) {
      v._setFailedTab('gdrive', 'key');
      return false;
    }
    return true;
  },

  _checkDropboxImport: function(imp, v) {
    if (!cdb.config.get('oauth_dropbox')) {
      v._setFailedTab('dropbox', 'key');
      return false;
    }
    return true;
  },

  _checkBoxImport: function(imp, v) {
    if (!cdb.config.get('oauth_box')) {
      v._setFailedTab('box', 'key');
      return false;
    }
    return true;
  },

  _checkTwitterImport: function(imp, v) {
    // Check if user have twitter datasource enabled!
    if (!cdb.config.get('datasource_search_twitter')) {
      v._setFailedTab('twitter', 'key');
      return false;
    }
    // Check if user can create or import a new file or user has
    // enough rights to enable twitter!
    if (!v.user.get('twitter').enabled) {
      return false;
    }
    // Check if user can create or import a new file or user has
    // enough rights to enable twitter!
    if (( v.user.get('twitter').quota - v.user.get('twitter').monthly_use ) <= 0 && v.user.get('twitter').hard_limit) {
      v._setFailedTab('twitter', 'credits');
      return false;
    }
    return true;
  },

  _checkInstagramImport: function(imp, v) {
    if (!v.user.featureEnabled('instagram_import')) {
      return false;
    }
    if (!cdb.config.get('oauth_instagram')) {
      v._setFailedTab('instagram', 'key');
      return false;
    }
    return true;
  },

  _checkArcgisImport: function(imp, v) {
    // Check if user have sync capabilities enabled
    if (v.user.get('actions') && !v.user.get('actions').arcgis_datasource) {
      return false;
    }
    return true;
  },

  _checkSalesforceImport: function(imp, v) {
    // Check if salesforce feature is enabled
    if (!v.user.featureEnabled('salesforce_import')) {
      return false;
    }
    return true;
  },

  _checkMailchimpImport: function(imp, v) {
    // Config available?
    if (!cdb.config.get('oauth_mailchimp')) {
      v._setFailedTab('mailchimp', 'key');
      return false;
    }
    // Feature enabled?
    if (!v.user.featureEnabled('mailchimp_import')) {
      return false;
    }
    return true;
  },

  _setFailedTab: function(tab, type) {
    var $tab = this.importTabs.getTab(tab);
    $tab.addClass('disabled');
    this._createTooltip(tab, type);
  },

  _createTooltip: function(tab, type) {
    var self = this;
    var $tab = this.importTabs.getTab(tab);

    // Tipsy?
    var tooltip = new cdb.common.TipsyTooltip({
      el: $tab,
      title: function() {
        return _.template(self._TEXTS[type])({ name: tab })
      }
    })
    this.addView(tooltip);
  },

  _setUploadModel: function(d) {
    this.createModel.upload.setFresh(d);
  },

  _initBinds: function() {
    this.model.bind('change:page', this._moveTabsNavigation, this);
    if (this.importPanes) {
      this.importPanes.bind('tabEnabled',  this._onTabChange, this);
    }
  },

  _destroyBinds: function() {
    if (this.importPanes) {
      this.importPanes.unbind('tabEnabled', null, this);
    }
  },

  _setOption: function() {
    // First option > data file
    this.importPanes.active(this._DEFAULT_IMPORT);
    this._updateImportOption();
  },

  _updateImportOption: function() {
    this.createModel.setActiveImportPane(this.importPanes.activeTab);
  },


  ////////////
  // Events //
  ////////////

  _onTabChange: function(tabName) {
    var v = this.importPanes.getPane(tabName);
    // Set upload model from activated pane to create model
    var upload = v.getModelData && v.getModelData();
    if (upload) {
      this._setUploadModel(upload);
    } else {
      this._setUploadModel({});
    }
    this._updateImportOption();
  },

  clean: function() {
    this._destroyBinds();
    cdb.core.View.prototype.clean.call(this);
  }

});
