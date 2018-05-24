const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const navigateThroughRouter = require('builder/helpers/navigate-through-router');
const filtersTemplate = require('./filters.tpl');
const filtersDeepInsights = require('./filters-deep-insights.tpl');
const TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
const pluralizeString = require('dashboard/helpers/pluralize');
const MetricsTracker = require('dashboard/views/dashboard/metrics-tracker');
const DuplicateMap = require('dashboard/views/dashboard/dialogs/duplicate-vis/duplicate-vis-view');
const DeleteItemsView = require('dashboard/views/dashboard/dialogs/delete-items/delete-items-view');
const ChangeLockView = require('dashboard/views/dashboard/dialogs/change-lock/change-lock-view');
const ChangeLockViewModel = require('dashboard/views/dashboard/dialogs/change-lock/change-lock-view-model');
const DeleteItemsViewModel = require('dashboard/views/dashboard/dialogs/delete-items/delete-items-view-model');
const ChangePrivacyView = require('dashboard/views/dashboard/dialogs/change-privacy/change-privacy-view');
const CreateDialog = require('dashboard/views/dashboard/dialogs/create-dialog/sacar-fuera/dialog-view');
const Utils = require('builder/helpers/utils');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'routerModel',
  'userModel',
  'configModel',
  'localStorage',
  'modals'
];

/**
 *  Dashboard filters.
 *
 *  - 'Order by' (time,likes,etc) collection.
 *  - 'Filter by' collection.
 *  - 'Search' any pattern within collection.
 *
 */
module.exports = CoreView.extend({
  _TOOLTIPS: ['js-likes', 'js-mapviews', 'js-updated_at', 'js-size'],

  events: {
    'submit .js-search-form': '_submitSearch',
    'keydown .js-search-form': '_onSearchKeyDown',
    'click .js-search-form': 'killEvent',
    'click .js-search-link': '_onSearchClick',
    'click .js-clean-search': '_onCleanSearchClick',
    'click .js-deselect_all': '_unselectAll',
    'click .js-select_all': '_selectAll',
    'click .js-order-link': '_changeOrder',
    'click .js-delete': '_openDeleteItemsDialog',
    'click .js-create_map': '_createMap',
    'click .js-import_remote': '_importRemote',
    'click .js-new_dataset': '_connectDataset',
    'click .js-duplicate_dataset': '_duplicateDataset',
    'click .js-duplicate_map': '_duplicateMap',
    'click .js-new_map': '_newMap',
    'click .js-lock': '_openChangeLockDialog',
    'click .js-privacy': '_openPrivacyDialog',
    'click .js-link': navigateThroughRouter
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.metrics = new MetricsTracker();

    this.model = new Backbone.Model();
    this._preRender();
    this._initBinds();
  },

  // It is necessary to add two static elements because
  // they can't be removed/replaced using render method
  // each time a change (in a model or a collection) happens.
  // This is due to the behaviour of the CSS animations.
  _preRender: function () {
    const $uInner = $('<div>').addClass('u-inner');
    const $filtersInner = $('<div>').addClass('Filters-inner js-skip-unselect-all');
    this.$el.append($uInner.append($filtersInner));
  },

  render: function (m, c) {
    this.clearSubViews();

    const selectedItemsCount = this._selectedItems().length;
    // If a change is made from content type we have to know
    // preventing show wrong data about total items
    const changedContentType = c && c.changes && c.changes.content_type;
    const routerContentType = this._routerModel.model.get('content_type');
    const isDeepInsights = this._routerModel.model.isDeepInsights();
    const contentType = isDeepInsights ? 'dashboard' : routerContentType.slice(0, -1);

    const template = isDeepInsights ? filtersDeepInsights : filtersTemplate;

    const pluralizedContentType = pluralizeString(
      contentType,
      changedContentType ? 0 : this.collection.total_user_entries
    );

    const pluralizedContentTypeSelected = pluralizeString(contentType, selectedItemsCount);

    this.$('.Filters-inner').html(
      template(
        _.extend({
          canCreateDatasets: this._userModel.canCreateDatasets(),
          hasCreateMapsFeature: this._userModel.hasCreateMapsFeature(),
          hasCreateDatasetsFeature: this._userModel.hasCreateDatasetsFeature(),
          canDeleteItems: this._canDeleteSelectedItems(),
          order: this._localStorage.get('dashboard.order'),
          isInsideOrg: this._userModel.isInsideOrg(),
          isMaps: this._routerModel.model.isMaps(),
          selectedItemsCount: selectedItemsCount,
          isSelectedItemLibrary: this._isSelectedItemLibrary(),
          maxLayersByMap: this._userModel.getMaxLayers(),
          totalShared: changedContentType ? 0 : this.collection.total_shared,
          totalLiked: changedContentType ? 0 : this.collection.total_likes,
          totalItems: changedContentType ? 0 : this.collection.total_user_entries,
          pageItems: this.collection.size(),
          router: this._routerModel,
          isDataLibraryEnabled: this._configModel.get('data_library_enabled'),
          currentDashboardUrl: this._routerModel.currentDashboardUrl(),
          pluralizedContentType: pluralizedContentType,
          pluralizedContentTypeSelected: pluralizedContentTypeSelected
        }, this._routerModel.model.attributes)
      )
    );

    this._initViews();
    this._checkScroll();
    this._animate();

    if (this._routerModel.model.isSearching()) {
      this._focusSearchInput();
    }

    return this;
  },

  _initBinds: function () {
    this.model.on('change:isSearchEnabled', this._onChangeIsSearchEnabled, this);
    this.listenTo(this._routerModel.model, 'change', this.render);
    this.listenTo(this.collection, 'loading', () => this.$el.removeClass('is-relative'));
    this.listenTo(this.collection, 'add remove change reset sync', this.render);
    this.listenTo(this._userModel, 'change:remaining_byte_quota', this.render);

    // TODO: cdb.god thing
    // cdb.god.bind('closeDialogs', this._animate, this);
    // cdb.god.bind('unselectAllItems', this._unselectAll, this);

    _.bindAll(this, '_onWindowScroll');

    // this.add_related_model(cdb.god);
  },

  _checkScroll: function () {
    const content_type = this._routerModel.model.get('content_type');
    const shared = this._routerModel.model.get('shared');
    const locked = this._routerModel.model.get('locked');
    const liked = this._routerModel.model.get('liked');
    const search = this._routerModel.model.isSearching();
    const total_entries = this.collection.total_entries;

    // Bind scroll
    if (total_entries === 0 && content_type === 'maps' && shared === 'no' && !locked && !liked && !search) {
      // If there is no maps, onboarding should appear
      // and filters block should be after that section
      this.$el.addClass('is-relative');
      this._unbindScroll();
    } else {
      this.$el.removeClass('is-relative');
      this._bindScroll();
    }
  },

  _bindScroll: function () {
    this._unbindScroll();
    $(window).bind('scroll', this._onWindowScroll);
  },

  _unbindScroll: function () {
    $(window).unbind('scroll', this._onWindowScroll);
  },

  _initViews: function () {
    _.each(this._TOOLTIPS, el => {
      const viewElement = this.$el;

      this.addView(
        new TipsyTooltipView({
          el: this.$(`.${el}`),
          title: function () {
            const isFixed = viewElement.hasClass('is-fixed');
            return isFixed ? '' : `Order by ${$(this).attr('data-title')}`;
          }
        })
      );
    });
  },

  _selectedItems: function () {
    return this.collection.where({ selected: true });
  },

  _animate: function () {
    this.$('.Filters-inner').toggleClass('show-second-row', this._selectedItems().length > 0);
    this._enableSearchUI(!!this._routerModel.model.isSearching());
  },

  _selectAll: function (e) {
    this._select(e, true);
  },

  _unselectAll: function (e) {
    this._select(e, false);
  },

  _select: function (e, val) {
    this.killEvent(e);
    this.collection.each(function (vis) {
      vis.set('selected', val);
    });
  },

  _openDeleteItemsDialog: function (e) {
    e.preventDefault();

    const viewModel = new DeleteItemsViewModel(this._selectedItems(), {
      contentType: this._routerModel.model.get('content_type')
    });

    viewModel.bind('DeleteItemsDone', function () {
      this._userModel.fetch(); // needed in order to keep the 'quota' synchronized
      this.collection.fetch();
    }, this);

    this._modals.create(modalModel =>
      new DeleteItemsView({
        modalModel,
        viewModel: viewModel,
        userModel: this._userModel,
        configModel: this._configModel
      })
    );
  },

  _openChangeLockDialog: function (e) {
    e.preventDefault();

    const viewModel = new ChangeLockViewModel({
      items: this._selectedItems(),
      contentType: this._routerModel.model.get('content_type')
    });
    viewModel.bind('change:state', function () {
      if (viewModel.get('state') === 'ProcessItemsDone') {
        this.collection.fetch();
      }
    }, this);

    this._modals.create(modalModel =>
      new ChangeLockView({
        modalModel,
        model: viewModel
      })
    );
  },

  _openPrivacyDialog: function (e) {
    e.preventDefault();

    this._modals.create(modalModel => {
      return new ChangePrivacyView({
        visModel: this._selectedItems()[0],
        userModel: this._userModel,
        configModel: this._configModel,
        modals: this._modals,
        modalModel
      });
    });
  },

  _onSearchClick: function (e) {
    this.killEvent(e);
    this.model.set('isSearchEnabled', !this.model.get('isSearchEnabled'));
  },

  _onChangeIsSearchEnabled: function (model, isSearchEnabled) {
    this._enableSearchUI(isSearchEnabled);

    if (this._routerModel.model.isSearching()) {
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
    this._$searchInput().select();
    this._$searchInput().focus();
  },

  _enableSearchUI: function (enable) {
    this.$('.js-search-field').toggle(enable);
    this.$('.js-links-list').toggle(!enable);
    this.$('.js-order-list').toggle(!enable);
  },

  _onSearchKeyDown: function (e) {
    // ESC
    if (e.keyCode === 27) {
      this._cleanSearch();
    }
  },

  // Creation actions

  _createMap: function (e) {
    if (e) e.preventDefault();
    this._openCreateDialog('map', true);
  },

  _newMap: function (e) {
    if (e) e.preventDefault();

    // Event tracking 'Opened Create new map'
    this.metrics.trackEvent('create_map', {
      email: this._userModel.get('email')
    });

    this._openCreateDialog('map');
  },

  _connectDataset: function (e) {
    if (e) e.preventDefault();

    // Event tracking 'Opened Connect new dataset'
    this.metrics.trackEvent('connect_dataset', {
      email: this._userModel.get('email')
    });

    if (this._userModel.canCreateDatasets()) {
      this._openCreateDialog('dataset');
    }
  },

  _duplicateDataset: function (e) {
    if (e) this.killEvent(e);
    const selectedDatasets = this._selectedItems();

    if (selectedDatasets.length === 1) {
      const m = selectedDatasets[0];
      const table = m.tableMetadata();
      const tableName = table.get('name');

      this.trigger('importByUploadData', {
        type: 'duplication',
        table_name: table.getUnqualifiedName() + '_copy',
        value: tableName,
        create_vis: false
      });
    }
  },

  _duplicateMap: function (e) {
    if (e) {
      this.killEvent(e);
    }

    const selectedDatasets = this._selectedItems();

    if (selectedDatasets.length === 1) {
      const m = selectedDatasets[0];
      const table = m.tableMetadata();

      this._modals.create(modalModel =>
        new DuplicateMap({
          model: m,
          table: table,
          userModel: this._userModel,
          configModel: this._configModel,
          clean_on_hide: true
        })
      );
    }
  },

  _importRemote: function (e) {
    if (e) this.killEvent(e);

    const selectedItems = this._selectedItems();
    if (selectedItems.length !== 1) {
      return;
    }

    const remoteItem = selectedItems[0];
    const remoteItemTable = remoteItem.get('table');

    const data = {
      type: 'remote',
      value: remoteItem.get('name'),
      remote_visualization_id: remoteItem.get('id'),
      size: remoteItemTable && remoteItemTable.size,
      create_vis: false
    };

    this.trigger('importByUploadData', data, this);

    this._select(false);
  },

  _openCreateDialog: function (type, selectedItems) {
    this._modals.create(modalModel => {
      return CreateDialog.openDialog({ modalModel }, {
        type,
        selectedItems: selectedItems ? this._selectedItems() : [],
        modalModel
      });
    });
  },

  // Filter actions

  _onCleanSearchClick: function (e) {
    this.killEvent(e);
    this._cleanSearch();
  },

  _submitSearch: function (e) {
    this.killEvent(e);
    this._navigateToUrl({
      search: Utils.stripHTML(this.$('.js-search-input').val().trim(), ''),
      page: 1,
      liked: false,
      shared: 'no',
      library: false,
      locked: false
    });
  },

  _cleanSearch: function () {
    this._navigateToUrl({
      search: '',
      liked: false,
      library: false,
      shared: 'no'
    });
    this.model.set('isSearchEnabled', false);
  },

  _navigateToUrl: function (opts) {
    this._routerModel.navigate(this._routerModel.currentUrl(opts), { trigger: true });
  },

  _changeOrder: function (e) {
    if (e) e.preventDefault();

    const $el = $(e.target).closest('.js-order-link');
    let order = 'updated_at';

    if ($el.hasClass('js-mapviews')) order = 'mapviews';
    if ($el.hasClass('js-likes')) order = 'likes';
    if ($el.hasClass('js-size')) order = 'size';

    // Order change?
    if (this._routerModel.model.get('order') !== order) {
      this._localStorage.set({ 'dashboard.order': order });
      this._routerModel.model.set('order', order);
    }
  },

  _onWindowScroll: function () {
    const offset = $(window).scrollTop();
    const anchorPoint = this.options.headerHeight + (this._userModel.get('notification') ? this.options.headerHeight : 0);
    this.$el[ offset > anchorPoint ? 'addClass' : 'removeClass' ]('is-fixed with-long-separator');
  },

  _canDeleteSelectedItems: function () {
    return !_.find(this._selectedItems(), (model) =>
      !model.permission.isOwner(this._userModel) || model.get('type') === 'remote'
    );
  },

  _isSelectedItemLibrary: function () {
    const selectedItems = this._selectedItems();
    if (selectedItems.length === 1 && selectedItems[0].get('type') === 'remote') {
      return true;
    } else {
      return false;
    }
  },

  clean: function () {
    this._unbindScroll();
    CoreView.prototype.clean.call(this);
  }

});
