var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var LocalStorage = require('../common/local_storage');
var HeaderView = require('../common/views/dashboard_header_view');
var SupportView = require('../common/support_view');
var MamufasImportView = require('../common/mamufas_import/mamufas_import_view');
var BackgroundPollingView = require('../common/background_polling/background_polling_view');
var DashboardBackgroundPollingModel = require('./background_polling_model');
var ContentControllerView = require('./content_controller_view');
var HeaderViewModel = require('./header_view_model');

module.exports = cdb.core.View.extend({

  events: {
    'click': '_onClick'
  },

  initialize: function() {
    this._initModels();
    this._initViews();
    this._initBindings();
  },

  _initBindings: function() {
    this.router.model.bind('change', this._onRouterChange, this);
    this.add_related_model(this.router.model);
  },

  _initModels: function() {
    this.user = this.options.user;
    this.router = this.options.router;
    this.localStorage = new LocalStorage();

    // Update order and category attribute to router model
    this.router.model.set('order',    this.localStorage.get('dashboard.order'), { silent: true });
    this.router.model.set('category', this.localStorage.get('dashboard.category'), { silent: true });
  },

  _onRouterChange: function(m, changes) {
    this._fetchCollection(m, changes);

    // Only create a visualization from an import if user is in maps section
    this._backgroundPollingView.createVis = this.router.model.isMaps();
  },

  _fetchCollection: function(m, changes) {
    var params = this.router.model.attributes;

    // Get order from localStorage if it is not defined or
    // come from other type (tables or visualizations)
    var order = this.localStorage.get("dashboard.order") || 'updated_at';
    // Maps doesn't have size order, so if that order is set
    // in maps section we will show with 'updated_at' order
    if (params.content_type === "maps" && order === "size") {
      order = 'updated_at'
    }

    var types = params.content_type === "datasets" ? 'table' : 'derived';

    // Requesting data library items?
    if (params.library) {
      types = 'remote';
    }

    // Supporting search in data library and user datasets at the same time
    if ((params.q || params.tag) && params.content_type === "datasets") {
      types = 'table,remote';
    }

    // TODO: review, should collection params really be set here?
    this.collection.options.set({
      q:              params.q,
      page:           params.page || 1,
      tags:           params.tag,
      per_page:       this.collection[ "_" + ( params.content_type === "datasets" ? 'TABLES' : 'ITEMS') + '_PER_PAGE'],
      shared:         params.shared,
      locked:         params.liked ? '' : params.locked, // If not locked liked items are not rendered
      only_liked:     params.liked,
      order:          order,
      types:          types,
      type:           '',
      deepInsights:   !!params.deepInsights
    });

    this.collection.fetch();
  },

  _initViews: function() {
    var backgroundPollingModel = new DashboardBackgroundPollingModel({
      showGeocodingDatasetURLButton: true,
      geocodingsPolling: true,
      importsPolling: true
    }, {
      user: this.user
    });

    this._backgroundPollingView = new BackgroundPollingView({
      model: backgroundPollingModel,
      // Only create a visualization from an import if user is in maps section
      createVis: this.router.model.isMaps(),
      user: this.user
    });
    backgroundPollingModel.bind('importCompleted', function() {
      this.collection.fetch();
      this.user.fetch();
    }, this);
    this.$el.append(this._backgroundPollingView.render().el);

    this.addView(this._backgroundPollingView);

    var mamufasView = new MamufasImportView({
      el: this.$el,
      user: this.user
    });

    cdb.god.bind('dialogOpened', function() {
      mamufasView.disable();
      backgroundPollingModel.stopPollings();
    }, this);
    cdb.god.bind('dialogClosed', function() {
      mamufasView.enable();
      backgroundPollingModel.startPollings();
    }, this);

    mamufasView.render();
    mamufasView.enable();

    var headerView = new HeaderView({
      el:             this.$('#header'), //pre-rendered in DOM by Rails app
      model:          this.user,
      viewModel:      new HeaderViewModel(this.router),
      router:         this.router,
      collection:     this.collection,
      localStorage:   this.localStorage
    });
    headerView.render();

    this.controllerView = new ContentControllerView({
      el:           this.$('#content-controller'),
      // Pass the whole element for only calculating
      // the height is not "fair"
      headerHeight: this.$('#header').height(),
      user:         this.user,
      router:       this.router,
      collection:   this.collection,
      localStorage: this.localStorage
    });

    this.controllerView.render();

    var supportView = new SupportView({
      el: this.$('#support-banner'),
      user: this.user
    });

    supportView.render();
  },

  _onClick: function(e) {
    // Clicks outside of any dialog "body" will fire a closeDialogs event
    if (this._isEventTriggeredOutsideOf(e, '.Dialog')) {
      cdb.god.trigger('closeDialogs');

      // If click outside the filters view should also unselect any selected items
      if (this._isEventTriggeredOutsideOf(e, '.js-skip-unselect-all')) {
        cdb.god.trigger('unselectAllItems');
      }
    }
  },

  _isEventTriggeredOutsideOf: function(ev, selector) {
    return $(ev.target).closest(selector).length === 0;
  }

});
