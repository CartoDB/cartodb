var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var LocalStorage = require('../new_common/local_storage');
var HeaderView = require('../new_common/views/dashboard_header_view');
var SupportView = require('../new_common/support_view');
var MamufasImportView = require('./mamufas_import_view');
var ContentControllerView = require('./content_controller_view');
var BackgroundImporterView = require('./background_importer/background_importer_view');
var ImportsModel = require('./background_importer/imports_model');
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
    // Why not have only one collection?
    this.collection =  new cdb.admin.Visualizations();

    this.user = this.options.user;
    this.router = this.options.router;
    this.localStorage = new LocalStorage();

    // Update order and category attribute to router model
    this.router.model.set('order',    this.localStorage.get('dashboard.order'), { silent: true });
    this.router.model.set('category', this.localStorage.get('dashboard.category'), { silent: true });
  },

  _onRouterChange: function(m, changes) {
    this._fetchCollection(m, changes);
  },

  _fetchCollection: function(m, changes) {
    var params = this.router.model.attributes;

    // Get order from localStorage if it is not defined or
    // come from other type (tables or visualizations)
    var order = this.localStorage.get("dashboard.order") || 'updated_at';
    var type = params.content_type === "datasets" ? 'table' : 'derived';
    if (params.library) { type = 'remote' }

    // TODO: review, should collection params really be set here?
    this.collection.options.set({
      q:              params.q,
      page:           params.page || 1,
      tags:           params.tag,
      per_page:       this.collection[ "_" + ( params.content_type === "datasets" ? 'TABLES' : 'ITEMS') + '_PER_PAGE'],
      only_shared:    params.shared,
      exclude_shared: !params.shared,
      category:       params.library ? params.category : '',
      locked:         params.locked,
      only_liked:     params.liked,
      order:          order,
      type:           type
    });

    this.collection.fetch();
  },

  _initViews: function() {
    var backgroundImporterView = new BackgroundImporterView({
      router: this.router,
      items: this.collection,
      user: this.user
    });

    this.$el.append(backgroundImporterView.render().el);
    backgroundImporterView.enable();

    var mamufasView = new MamufasImportView({
      el: this.$el,
      user: this.user
    });

    cdb.god.bind('dialogOpened', function() {
      mamufasView.disable();
    }, this);
    cdb.god.bind('dialogClosed', function() {
      mamufasView.enable();
    }, this);

    mamufasView.bind('onDrop', function(files) {
      backgroundImporterView.add(
        new ImportsModel({ upload: { type: 'file', value: files } }, { user: this.user })
      )
    }, this);
    mamufasView.render();
    mamufasView.enable();

    var headerView = new HeaderView({
      el:             this.$('#header'), //pre-rendered in DOM by Rails app
      model:          this.user,
      viewModel:      new HeaderViewModel(this.router),
      currentUserUrl: this.router.currentUserUrl,
      router:         this.router,
      localStorage:   this.localStorage
    });
    headerView.render();

    this.controllerView = new ContentControllerView({
      el:           this.$('#content-controller'),
      user:         this.user,
      router:       this.router,
      collection:   this.collection,
      localStorage: this.localStorage
    });

    this.controllerView.bind('datasetSelected', function(d) {
      backgroundImporterView.add(
        new ImportsModel({ upload: d }, { user: this.user })
      )
    }, this);
    this.controllerView.bind('remoteSelected', function(d) {
      backgroundImporterView.add(
        new ImportsModel({ upload: d }, { user: this.user })
      )
    }, this);
    this.controllerView.render();

    var supportView = new SupportView({
      el: this.$('#support-banner'),
      user: this.user
    });

    supportView.render();
  },

  // In case user clicks out of any dialog "body" will fire
  // a closeDialogs event
  _onClick: function() {
    cdb.god.trigger("closeDialogs");
  }

});
