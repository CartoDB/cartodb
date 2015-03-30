var cdb = require('cartodb.js');
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
    'click .js-liked':          '_onLikedClick',
    'click .js-library':        '_onLibraryClick',
    'click .js-connect':        '_onConnectClick',
    'click .js-datasets':       '_onDatasetsClick',
    'click .js-create_empty':   '_onCreateEmptyClick'
  },

  initialize: function() {
    this.routerModel = this.options.routerModel;
    this.createModel = this.options.createModel;
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('new_common/views/create/listing/navigation');

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

    this.$('.Filters-inner').html(
      this.template(
        _.extend({
            createType:            this.createModel.get('type'),
            canCreateDataset:      this.user.canCreateDatasets(),
            listingState:          this.model.get('state'),
            isInsideOrg:           this.user.isInsideOrg(),
            selectedItemsCount:    selectedItemsCount,
            maxLayersByMap:        this.user.get('max_layers'),
            totalShared:           changedContentType ? 0 : this.collection.total_shared,
            totalLiked:            changedContentType ? 0 : this.collection.total_likes,
            totalItems:            changedContentType ? 0 : this.collection.total_user_entries,
            pageItems:             this.collection.size(),
            routerModel:           this.routerModel,
            pluralizedContentType: pluralizeString('dataset', changedContentType ? 0 : this.collection.total_user_entries),
            pluralizedContentTypeSelected: pluralizeString('dataset', selectedItemsCount)
          },
          this.routerModel.attributes
        )
      )
    );

    this._animate();

    return this;
  },

  _initBinds: function() {
    this.model.bind('change:state', this.render, this);
    this.routerModel.bind('change', this.render, this);
    this.collection.bind('reset', this.render, this);
    cdb.god.bind('closeDialogs', this._animate, this);
    this.add_related_model(cdb.god);
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
      liked: false,
      library: false,
      page: 1
    });
    this.model.set('state', 'list');
  },

  _onSharedClick: function() {
    this.routerModel.set({
      shared: 'only',
      liked: false,
      library: false,
      page: 1
    });
    this.model.set('state', 'list');
  },

  _onLikedClick: function() {
    this.routerModel.set({
      shared: 'no',
      liked: true,
      library: false,
      page: 1
    });
    this.model.set('state', 'list');
  },

  _onLibraryClick: function() {
    this.routerModel.set({
      shared: 'no',
      liked: false,
      library: true,
      page: 1
    });
    this.model.set('state', 'list');
  },

  _onConnectClick: function() {
    if (this.user.canCreateDatasets()) {
      this.model.set('state', 'import');
    }
  },

  _onCreateEmptyClick: function() {
    if (this.user.canCreateDatasets()) {
      this.model.set('state', 'scratch');
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
      liked: false,
      library: this.createModel.get('type') === "map" ? false : true
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

    this.model.set('state', 'list');
  }

});
