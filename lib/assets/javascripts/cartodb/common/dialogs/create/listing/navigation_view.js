var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var Utils = require('cdb.Utils');
var pluralizeString = require('../../../view_helpers/pluralize_string');

/**
 *  Listing datasets navigation.
 *
 *  - 'Filter by' datasets.
 *  - 'Search' any pattern within dataset collection.
 *
 */
module.exports = cdb.core.View.extend({

  events: {
    'submit .js-search-form':   '_submitSearch',
    'keydown .js-search-form':  '_onSearchKeyDown',
    'click .js-search-form':    'killEvent',
    'click .js-search-link':    '_onSearchClick',
    'click .js-clean-search':   '_onCleanSearchClick',
    'click .js-shared':         '_onSharedClick',
    'click .js-library':        '_onLibraryClick',
    'click .js-connect':        '_onConnectClick',
    'click .js-datasets':       '_onDatasetsClick',
    'click .js-create_empty':   '_onCreateEmptyClick'
  },

  _TEXTS: {
    createFromScratchLabel: {
      map: 'Create empty map',
      dataset: 'Create empty dataset',
      addLayer: 'Add an empty layer'
    }
  },

  initialize: function() {
    this.routerModel = this.options.routerModel;
    this.createModel = this.options.createModel;
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('common/views/create/listing/navigation');
    this.model = new cdb.core.Model();

    this._preRender();
    this._initBinds();
  },

  // It is necessary to add two static elements because
  // they can't be removed/replaced using render method
  // each time a change (in a model or a collection) happens.
  // This is due to the behaviour of the CSS animations.
  _preRender: function() {
    var $uInner = $('<div>').addClass('u-inner');
    var $filtersInner = $('<div>').addClass('Filters-inner');
    this.$el.append($uInner.append($filtersInner));
  },

  render: function(m, c) {
    if (this.tooltipView) {
      this.tooltipView.clean();
    }

    this.clearSubViews();

    var selectedItemsCount = this._selectedItems().length;
    // If a change is made from content type we have to know
    // preventing show wrong data about total items
    var changedContentType = c && c.changes && c.changes.content_type;
    var createModelType = this.createModel.get('type');

    this.$('.Filters-inner').html(
      this.template(
        _.extend({
            createModel:           this.createModel,
            canCreateDataset:      this.user.canCreateDatasets(),
            listing:               this.createModel.get('listing'),
            isInsideOrg:           this.user.isInsideOrg(),
            selectedItemsCount:    selectedItemsCount,
            maxLayersByMap:        this.user.getMaxLayers(),
            totalShared:           changedContentType ? 0 : this.collection.total_shared,
            pageItems:             this.collection.size(),
            routerModel:           this.routerModel,
            createFromScratchLabel: this._TEXTS.createFromScratchLabel[createModelType],
            datasetsTabDisabled: this._datasetsTabDisabled(),
            hasDataLibrary: cdb.config.get('data_library_enabled')
          },
          this.routerModel.attributes
        )
      )
    );

    if(this._datasetsTabDisabled()) {
      this.tooltipView = new cdb.common.TipsyTooltip({
        el: this.$('.js-datasets'),
        title: function () {
          return _t('There are no datasets connected to your account');
        }
      });
      this.addView(this.tooltipView);
    }

    this._animate();
    if (this.routerModel.isSearching()) {
      this._focusSearchInput();
    }

    return this;
  },

  _initBinds: function() {
    this.model.on('change:isSearchEnabled', this._onChangeIsSearchEnabled, this);
    this.createModel.bind('change:listing', this.render, this);
    this.routerModel.bind('change', this.render, this);
    this.collection.bind('reset', this.render, this);
    cdb.god.bind('closeDialogs', this._animate, this);
    this.add_related_model(cdb.god);
    this.add_related_model(this.createModel);
    this.add_related_model(this.collection);
    this.add_related_model(this.routerModel);
  },

  _onChangeIsSearchEnabled: function(model, isSearchEnabled) {
    this._enableSearchUI(isSearchEnabled);

    if (this.routerModel.isSearching()) {
      this._cleanSearch();
    } else if (isSearchEnabled) {
      this._$searchInput().val('');
      this._focusSearchInput();
    }
  },

  _$searchInput: function() {
    return this.$('.js-search-input')
  },

  _focusSearchInput: function() {
    this._$searchInput()
      .select()
      .focus();
  },

  _onSearchKeyDown: function(e) {
    // ESC
    if (e.keyCode === 27) {
      this.killEvent(e);
      this._cleanSearch();
    }
  },

  _selectedItems: function() {
    return this.collection.where({ selected: true });
  },

  _animate: function() {
    this._enableSearchUI(!!this.routerModel.isSearching());

    // Check if user doesn't have any table and it is in library section
    // to remove useless shadow
    var inLibrarySection = this.routerModel.get('library');
    var inDatasetsSection = this.createModel.get('listing') === "datasets";
    var hasDatasets = this.collection.total_user_entries > 0;
    this.$el.toggleClass('no-shadow', inLibrarySection && !hasDatasets && inDatasetsSection);
  },

  _enableSearchUI: function(enable) {
    this.$('.js-search-field').toggle(enable);
    this.$('.js-links-list').toggleClass('is-hidden', enable);
    this.$('.js-order-list').toggleClass('is-hidden', enable);
  },

  _onDatasetsClick: function() {
    if (this._datasetsTabDisabled()) return;

    this.routerModel.set({
      shared: 'no',
      library: false,
      page: 1
    });
    this.createModel.set('listing', 'datasets');
  },

  _onSharedClick: function() {
    this.routerModel.set({
      shared: 'only',
      library: false,
      page: 1
    });
    this.createModel.set('listing', 'datasets');
  },

  _onLibraryClick: function() {
    this.routerModel.set({
      shared: 'no',
      library: true,
      page: 1
    });
    this.createModel.set('listing', 'datasets');

    // Event tracking "Clicked Common data"
    cdb.god.trigger('metrics', 'common_data', {
      email: window.user_data.email
    });
  },

  _onConnectClick: function() {
    if (this.user.canCreateDatasets()) {
      this.createModel.set('listing', 'import');
    }
  },

  _onCreateEmptyClick: function() {
    if (this.user.canCreateDatasets()) {
      this.createModel.createFromScratch();
    }
  },

  _datasetsTabDisabled: function () {
    return this.createModel.get('datasetsTabDisabled');
  },

  // Selection actions

  _onSearchClick: function(e) {
    if (e) this.killEvent(e);
    this.model.set('isSearchEnabled', !this.model.get('isSearchEnabled'));
  },

  // Filter actions

  _onCleanSearchClick: function(e) {
    if (e) e.preventDefault();
    this._cleanSearch();
  },

  _cleanSearch: function() {
    this.routerModel.set({
      q: '',
      tag: '',
      shared: 'no',
      library: this.createModel.showLibrary()
    });
    this.model.set('isSearchEnabled', false);
  },

  _submitSearch: function(e) {
    if (e) this.killEvent(e);
    var val = Utils.stripHTML(this.$('.js-search-input').val().trim(),'');
    var tag = val.search(':') === 0 ? val.replace(':', '') : '';
    var q = val.search(':') !== 0 ? val : '';

    this.routerModel.set({
      page: 1,
      tag: tag,
      q: q,
      shared: 'yes'
    });

    this.createModel.set('listing', 'datasets');
  }

});
