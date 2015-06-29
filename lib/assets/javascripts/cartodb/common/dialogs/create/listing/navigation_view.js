var cdb = require('cartodb.js');
var _ = require('underscore');
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
            maxLayersByMap:        this.user.get('max_layers'),
            totalShared:           changedContentType ? 0 : this.collection.total_shared,
            totalItems:            changedContentType ? 0 : this.collection.total_user_entries,
            pageItems:             this.collection.size(),
            routerModel:           this.routerModel,
            pluralizedContentType: pluralizeString('dataset', changedContentType ? 0 : this.collection.total_user_entries),
            pluralizedContentTypeSelected: pluralizeString('dataset', selectedItemsCount),
            createFromScratchLabel: this._TEXTS.createFromScratchLabel[createModelType]
          },
          this.routerModel.attributes
        )
      )
    );

    this._animate();

    return this;
  },

  _initBinds: function() {
    this.createModel.bind('change:listing', this.render, this);
    this.routerModel.bind('change', this.render, this);
    this.collection.bind('reset', this.render, this);
    cdb.god.bind('closeDialogs', this._animate, this);
    this.add_related_model(cdb.god);
    this.add_related_model(this.createModel);
    this.add_related_model(this.collection);
    this.add_related_model(this.routerModel);
  },

  _selectedItems: function() {
    return this.collection.where({ selected: true });
  },

  _animate: function() {
    // Check if any search is applied
    var search = this.routerModel.isSearching();
    this.$('.Filters-inner')[ search ? 'addClass' : 'removeClass' ]('search--enabled');
  },

  // Navigation actions

  _onDatasetsClick: function() {
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

    // TODO: remove mixpanel
    cdb.god.trigger('mixpanel', 'Common data clicked');

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

  // Selection actions

  _onSearchClick: function(e) {
    if (e) this.killEvent(e);
    this.$('.Filters-inner').addClass('search--enabled');
    this.$('.js-search-input').focus();
  },

  // Filter actions

  _onCleanSearchClick: function(e) {
    if (e) e.preventDefault();
    this.routerModel.set({
      q: '',
      tag: '',
      shared: 'no',
      library: this.createModel.showLibrary()
    });
  },

  _submitSearch: function(e) {
    if (e) this.killEvent(e);
    var val = Utils.stripHTML(this.$('.js-search-input').val().trim(),'');
    var tag = val.search(':') === 0 ? val.replace(':', '') : '';
    var q = val.search(':') !== 0 ? val : '';

    this.routerModel.set({
      tag: tag,
      q: q,
      shared: 'yes'
    });

    this.createModel.set('listing', 'datasets');
  }

});
