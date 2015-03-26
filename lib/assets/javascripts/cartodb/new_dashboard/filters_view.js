var cdb = require('cartodb.js');
var $ = require('jquery');
var _ = require('underscore');
var Utils = require('cdb.Utils');
var navigateThroughRouter = require('../new_common/view_helpers/navigate_through_router');
var pluralizeString = require('../new_common/view_helpers/pluralize_string');
var DeleteItemsDialog = require('../new_dashboard/dialogs/delete_items_view');
var ChangeLockDialog = require('../new_dashboard/dialogs/change_lock_view');
var ChangeLockViewModel = require('./dialogs/change_lock_view_model');
var DeleteItemsViewModel = require('./dialogs/delete_items_view_model');

/**
 *  Dashboard filters.
 *
 *  - 'Order by' (time,likes,etc) collection.
 *  - 'Filter by' collection.
 *  - 'Search' any pattern within collection.
 *
 */
module.exports = cdb.core.View.extend({

  _TOOLTIPS: ['js-likes', 'js-mapviews', 'js-updated_at', 'js-size'],

  events: {
    'submit .js-search-form':   '_submitSearch',
    'keydown .js-search-form':  '_onSearchKeyDown',
    'click .js-search-form':    'killEvent',
    'click .js-search-link':    '_onSearchClick',
    'click .js-clean-search':   '_onCleanSearchClick',
    'click .js-deselect_all':   '_unselectAll',
    'click .js-select_all':     '_selectAll',
    'click .js-order-link':     '_changeOrder',
    'click .js-delete':         '_openDeleteItemsDialog',
    'click .js-create_map':     '_createMap',
    'click .js-new_dataset':    '_connectDataset',
    'click .js-new_map':        '_newMap',
    'click .js-lock':           '_openChangeLockDialog',
    'click .js-privacy':        '_openPrivacyDialog',
    'click .js-link':           navigateThroughRouter
  },

  initialize: function() {
    this.router = this.options.router;
    this.user = this.options.user;
    this.localStorage = this.options.localStorage;
    this.template = cdb.templates.getTemplate('new_dashboard/views/filters');

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
            canCreateDatasets:     this.user.canCreateDatasets(),
            canDeleteItems:        this._canDeleteSelectedItems(),
            order:                 this.localStorage.get('dashboard.order'),
            isInsideOrg:           this.user.isInsideOrg(),
            selectedItemsCount:    selectedItemsCount,
            maxLayersByMap:        this.user.get('max_layers'),
            totalShared:           changedContentType ? 0 : this.collection.total_shared,
            totalLiked:            changedContentType ? 0 : this.collection.total_likes,
            totalItems:            changedContentType ? 0 : this.collection.total_user_entries,
            pageItems:             this.collection.size(),
            router:                this.router,
            currentDashboardUrl:   this.router.currentDashboardUrl(),
            pluralizedContentType: pluralizeString(this.router.model.get('content_type') === "datasets" ? 'dataset' : 'map', changedContentType ? 0 : this.collection.total_user_entries),
            pluralizedContentTypeSelected: pluralizeString(this.router.model.get('content_type') === "datasets" ? 'dataset' : 'map', selectedItemsCount)
          },
          this.router.model.attributes
        )
      )
    );

    this._initViews();
    this._checkScroll();
    this._animate();

    return this;
  },

  _initBinds: function() {
    this.router.model.bind('change', this.render, this);
    this.collection.bind('loading', function() {
      this.$el.removeClass('is-relative');
    }, this);
    this.collection.bind('add remove change reset', this.render, this);
    this.user.bind('change:remaining_byte_quota', this.render, this);
    cdb.god.bind('closeDialogs', this._animate, this);
    cdb.god.bind('closeDialogs', this._unselectAll, this);
    _.bindAll(this, '_onWindowScroll');

    this.add_related_model(this.collection);
    this.add_related_model(this.router.model);
    this.add_related_model(this.user);
    this.add_related_model(cdb.god);
  },

  _checkScroll: function() {
    var content_type = this.router.model.get('content_type');
    var shared = this.router.model.get('shared');
    var locked = this.router.model.get('locked');
    var liked = this.router.model.get('liked');
    var search = this.router.model.isSearching();
    var total_entries = this.collection.total_entries;

    // Bind scroll
    if (total_entries === 0 && content_type === "maps" && shared === "no" && !locked && !liked && !search) {
      // If there is no maps, onboarding should appear
      // and filters block should be after that section
      this.$el.addClass('is-relative');
      this._unbindScroll();
    } else {
      this.$el.removeClass('is-relative');
      this._bindScroll();
    }
  },

  _bindScroll: function() {
    this._unbindScroll();
    $(window).bind('scroll', this._onWindowScroll);
  },

  _unbindScroll: function() {
    $(window).unbind('scroll', this._onWindowScroll);
  },

  _initViews: function() {
    // Tipsys?
    var self = this;
    _.each(this._TOOLTIPS, function(el) {
      self.addView(
        new cdb.common.TipsyTooltip({
          el: self.$('.' + el),
          title: function() {
            var isFixed = self.$el.hasClass('is-fixed');
            return isFixed ? '' : 'Order by ' + $(this).attr('data-title');
          }
        })
      )
    });
  },

  _selectedItems: function() {
    return this.collection.where({ selected: true });
  },

  _animate: function() {
    // Show filters or selected items actions
    var selectedItemsCount = this._selectedItems().length;
    this.$('.Filters-inner')[ selectedItemsCount > 0 ? 'addClass' : 'removeClass' ]('items--selected');

    // Check if any search is applied
    this.$('.Filters-inner')[ this.router.model.isSearching() ? 'addClass' : 'removeClass' ]('search--enabled');
  },

  _selectAll: function(e) {
    this._select(e, true);
  },

  _unselectAll: function(e) {
    this._select(e, false);
  },

  _select: function(e, val) {
    this.killEvent(e);
    var user = this.user;
    this.collection.each(function(vis) {
      vis.set('selected', val);
    });
  },

  _openDeleteItemsDialog: function(e) {
    this.killEvent(e);

    var viewModel = new DeleteItemsViewModel(this._selectedItems(), {
      contentType: this.router.model.get('content_type')
    });

    viewModel.bind('DeleteItemsDone', function() {
      this.user.fetch(); // needed in order to keep the "quota" synchronized
    }, this);

    var view = new DeleteItemsDialog({
      viewModel: viewModel,
      user: this.user,
      clean_on_hide: true,
      enter_to_confirm: true
    });
    this.addView(view);

    view.appendToBody();
  },

  _openChangeLockDialog: function(e) {
    this.killEvent(e);

    var viewModel = new ChangeLockViewModel(this._selectedItems());
    viewModel.bind('ProcessItemsDone', function() {
      this.collection.fetch();
    }, this);

    var view = new ChangeLockDialog({
      contentType: this.router.model.get('content_type'),
      viewModel: viewModel,
      clean_on_hide: true,
      enter_to_confirm: true
    });
    this.addView(view);

    view.appendToBody();
  },

  _openPrivacyDialog: function(e) {
    this.killEvent(e);
    cdb.god.trigger('openPrivacyDialog', this._selectedItems()[0]);
  },

  _onSearchClick: function(e) {
    this.killEvent(e);
    var wasSearchInputVisible = this.$('.Filters-inner').hasClass('search--enabled');
    this.$('.Filters-inner').toggleClass('search--enabled', !wasSearchInputVisible);

    if (this.router.model.isSearching()) {
      this._cleanSearch();
    } else if (!wasSearchInputVisible) {
      this.$('.js-search-input').val('');
      this.$('.js-search-input').focus();
    }
  },

  _onSearchKeyDown: function(e) {
    if (e.keyCode === 27) {
      this._onSearchClick(e);
    }
  },

  // Creation actions

  _createMap: function(e) {
    if (e) e.preventDefault();
    this._openCreateDialog('map', true);
  },

  _newMap: function(e) {
    if (e) e.preventDefault();
    this._openCreateDialog('map');
  },

  _connectDataset: function(e) {
    if (e) e.preventDefault();

    if (this.user.canCreateDatasets()) {
      this._openCreateDialog('dataset');
    }
  },

  _openCreateDialog: function(type, selectedItems) {
    cdb.god.trigger(
      'openCreateDialog',
      {
        type: type,
        selectedItems: selectedItems ? this._selectedItems() : []
      }
    );
  },

  // Filter actions

  _onCleanSearchClick: function(e) {
    this.killEvent(e);
    this._cleanSearch();
  },

  _submitSearch: function(e) {
    this.killEvent(e);
    this._navigateToUrl({
      search: Utils.stripHTML(this.$('.js-search-input').val().trim(),''),
      liked: false,
      shared: 'no',
      library: false
    });
  },

  _cleanSearch: function() {
    this._navigateToUrl({
      search: '',
      liked: false,
      library: false,
      shared: 'no'
    });
  },

  _navigateToUrl: function(opts) {
    this.router.navigate(this.router.currentUrl(opts), { trigger: true });
  },

  _changeOrder: function(e) {
    if (e) e.preventDefault();

    var $el = $(e.target).closest('.js-order-link');
    var order = 'updated_at';

    if ($el.hasClass('js-mapviews')) order = 'mapviews';
    if ($el.hasClass('js-likes')) order = 'likes';
    if ($el.hasClass('js-size')) order = 'size';

    // Order change?
    if (this.router.model.get('order') !== order) {
      this.localStorage.set({ 'dashboard.order': order });
      this.router.model.set('order', order);
    }
  },

  _onWindowScroll: function() {
    var offset = $(window).scrollTop();
    var anchorPoint = 81 /* header */ + ( this.user.get('notification') ? 81 : 0 );
    this.$el[ offset > anchorPoint ? 'addClass' : 'removeClass' ]('is-fixed')
  },

  _canDeleteSelectedItems: function() {
    var self = this;
    return !_.find(this._selectedItems(), function(m) {
      return !m.permission.isOwner(self.user) || m.get('type') === "remote"
    });
  },

  clean: function() {
    this._unbindScroll();
    cdb.core.View.prototype.clean.call(this);
  }

});
