var cdb = require('internal-carto.js');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var $ = require('jquery');
var _ = require('underscore');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var template = require('./navigation.tpl');

var REQUIRED_OPTS = [
  'configModel',
  'createModel',
  'userModel',
  'routerModel',
  'tablesCollection'
];

/**
 *  Listing datasets navigation.
 *
 *  - 'Filter by' datasets.
 *  - 'Search' any pattern within dataset collection.
 *
 */
module.exports = CoreView.extend({
  events: {
    'submit .js-search-form': '_submitSearch',
    'keydown .js-search-form': '_onSearchKeyDown',
    'click .js-search-form': 'killEvent',
    'click .js-search-link': '_onSearchClick',
    'click .js-clean-search': '_onCleanSearchClick',
    'click .js-shared': '_onSharedClick',
    'click .js-library': '_onLibraryClick',
    'click .js-connect': '_onConnectClick',
    'click .js-datasets': '_onDatasetsClick',
    'click .js-create-empty': '_onCreateEmptyClick'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this.model = new Backbone.Model();

    this._preRender();
    this._initBinds();
  },

  // It is necessary to add two static elements because
  // they can't be removed/replaced using render method
  // each time a change (in a model or a collection) happens.
  // This is due to the behaviour of the CSS animations.
  _preRender: function () {
    var $uInner = $('<div>').addClass('u-inner');
    var $filtersInner = $('<div>').addClass('Filters-inner');
    this.$el.append($uInner.append($filtersInner));
  },

  render: function (m, c) {
    this.clearSubViews();

    this.$('.Filters-inner').html(
      template(
        _.extend(
          {
            showDatasets: this._createModel.showDatasets(),
            createModelType: this._createModel.get('type'),
            canCreateDataset: this._userModel.canCreateDatasets(),
            listingType: this._createModel.get('listing'),
            isInsideOrg: this._userModel.isInsideOrg(),
            totalShared: this._tablesCollection.getTotalStat('total_shared'),
            selectedItemsCount: this._selectedItems().length,
            hasDataLibrary: this._configModel.dataLibraryEnabled()
          },
          this._routerModel.attributes
        )
      )
    );

    this._animate();
    if (this._routerModel.isSearching()) {
      this._focusSearchInput();
    }
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:isSearchEnabled', this._onChangeIsSearchEnabled, this);
    this.listenTo(this._createModel, 'change:listing', this.render, this);
    this.listenTo(this._routerModel, 'change', this.render, this);
    this.listenTo(this._tablesCollection, 'sync', this.render, this);
  },

  _onChangeIsSearchEnabled: function (model, isSearchEnabled) {
    this._enableSearchUI(isSearchEnabled);

    if (this._routerModel.isSearching()) {
      this._cleanSearch();
    } else if (isSearchEnabled) {
      this._$searchInput().val('');
      this._focusSearchInput();
    }
  },

  _$searchInput: function () {
    return this.$('.js-search-input');
  },

  _focusSearchInput: function () {
    this._$searchInput()
      .select()
      .focus();
  },

  _onSearchKeyDown: function (e) {
    if (e.keyCode === 27) { // ESC
      this.killEvent(e);
      this._cleanSearch();
    }
  },

  _selectedItems: function () {
    return this._tablesCollection.where({ selected: true });
  },

  _animate: function () {
    this._enableSearchUI(!!this._routerModel.isSearching());

    // Check if user doesn't have any table and it is in library section
    // to remove useless shadow
    var inLibrarySection = this._routerModel.get('library');
    var inDatasetsSection = this._createModel.get('listing') === 'datasets';
    var hasDatasets = this._tablesCollection.getTotalStat('total_user_entries') > 0;
    this.$el.toggleClass('no-shadow', inLibrarySection && !hasDatasets && inDatasetsSection);
  },

  _enableSearchUI: function (enable) {
    this.$('.js-search-field').toggle(enable);
    this.$('.js-links-list').toggleClass('is-hidden', enable);
    this.$('.js-order-list').toggleClass('is-hidden', enable);
  },

  _onDatasetsClick: function () {
    this._routerModel.set({
      shared: 'no',
      library: false,
      page: 1
    });
    this._routerModel.trigger('change', this._routerModel);
    this._createModel.set('listing', 'datasets');
  },

  _onSharedClick: function () {
    this._routerModel.set({
      shared: 'only',
      library: false,
      page: 1
    });
    this._routerModel.trigger('change', this._routerModel);
    this._createModel.set('listing', 'datasets');
  },

  _onLibraryClick: function () {
    this._routerModel.set({
      shared: 'no',
      library: true,
      page: 1
    });
    this._routerModel.trigger('change', this._routerModel);
    this._createModel.set('listing', 'datasets');
  },

  _onConnectClick: function () {
    if (this._userModel.canCreateDatasets()) {
      this._createModel.set('listing', 'import');
    }
  },

  _onCreateEmptyClick: function () {
    if (this._userModel.canCreateDatasets()) {
      this._createModel.createFromScratch();
    }
  },

  // Selection actions
  _onSearchClick: function (e) {
    this.killEvent(e);
    this.model.set('isSearchEnabled', !this.model.get('isSearchEnabled'));
  },

  // Filter actions
  _onCleanSearchClick: function (e) {
    if (e) {
      e.preventDefault();
    }
    this._cleanSearch();
  },

  _cleanSearch: function () {
    this._routerModel.set({
      q: '',
      tag: '',
      shared: 'no',
      library: this._createModel.showLibrary()
    });
    this.model.set('isSearchEnabled', false);
  },

  _submitSearch: function (e) {
    this.killEvent(e);
    var val = cdb.core.sanitize.html(this.$('.js-search-input').val().trim());
    var tag = val.search(':') === 0 ? val.replace(':', '') : '';
    var q = val.search(':') !== 0 ? val : '';

    this._routerModel.set({
      page: 1,
      tag: tag,
      q: q,
      shared: 'yes'
    });

    this._createModel.set('listing', 'datasets');
  }

});
