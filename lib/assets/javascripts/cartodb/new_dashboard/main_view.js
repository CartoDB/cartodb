var $ = require('jquery');
var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var LocalStorage = require('new_common/local_storage');
var FiltersView = require('new_dashboard/filters_view');
var MapsView = require('new_dashboard/maps/maps_view');
var DatasetsView = require('new_dashboard/datasets/datasets_view');
var HeaderView = require('new_dashboard/header_view');
var SupportView = require('new_dashboard/support_view');

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
    this.userUrls = this.options.userUrls;
    this.localStorage = new LocalStorage();
  },

  _onRouterChange: function(m, changes) {
    this._fetchCollection(m, changes);
  },

  _fetchCollection: function(m, changes) {
    var params = this.router.model.attributes;

    // Get order from localStorage if it is not defined or
    // come from other type (tables or visualizations)
    var order = this.localStorage.get("dashboard.order") || 'updated_at';

    this.collection.options.set({
      q:              params.q,
      page:           params.page || 1,
      tags:           params.tag,
      per_page:       this.collection[ "_" + ( params.content_type === "datasets" ? 'TABLES' : 'ITEMS') + '_PER_PAGE'],
      exclude_shared: params.exclude_shared,
      locked:         params.locked,
      liked:          params.liked,
      order:          order,
      type:           params.content_type === "datasets" ? 'table' : 'derived'
    });

    var order_obj = {};
    order_obj[order] = 'desc';
    this.collection.fetch({ data: { o: order_obj } });
  },

  _initViews: function() {

    var headerView = new HeaderView({
      el:         this.$('.Header'), //pre-rendered in DOM by Rails app
      model:      this.user,
      router:     this.router,
      userUrls:   this.userUrls,
      localStorage: this.localStorage
    });
    headerView.render();


    var filtersView = new FiltersView({
      user:         this.user,
      router:       this.router,
      collection:   this.collection,
      localStorage: this.localStorage
    });

    this.$('.DashboardFilters > .u-inner').append(filtersView.render().el);


    var mapsView = new MapsView({
      user:         this.user,
      router:       this.router,
      collection:   this.collection
    });

    this.$('.Maps').html(mapsView.render().el);


    var datasetsView = new DatasetsView({
      user:         this.user,
      router:       this.router,
      collection:   this.collection
    });

    this.$('.Datasets').html(datasetsView.render().el);


    var supportView = new SupportView({
      el: this.$('.SupportBanner'),
      user: this.user
    });

    supportView.render();
  },

  // In case user clicks out of any dialog "body" will fire
  // a closeDialogs event
  _onClick: function(e) {
    cdb.god.trigger("closeDialogs");
  }

});
