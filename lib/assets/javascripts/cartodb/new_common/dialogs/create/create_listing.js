var cdb = require('cartodb.js');
var RouterModel = require('new_dashboard/router/model');
// var Router = require('new_dashboard/router');
// var urls = require('new_common/urls_fn');
var NavigationView = require('new_common/dialogs/create/listing/navigation_view');
var DatasetsView = require('new_common/dialogs/create/listing/datasets_view');
var ImportsView = require('new_common/dialogs/create/listing/imports_view');

/**
 *  Create listing view
 *
 *  It will display all the possibilities to select
 *  any of your current datasets or connect a new dataset.
 *
 */

module.exports = cdb.core.View.extend({

  className: 'CreateDialog-listing',
  
  initialize: function() {
    this.user = this.options.user;
    this.createModel = this.options.createModel;
    this.template = cdb.templates.getTemplate('new_common/views/create/create_listing');
    this.model = new cdb.core.Model({ state: 'import' }); // import or list states

    this.routerModel = new RouterModel({
      content_type: 'datasets',
      library: this.createModel.isDatasetType()
    });

    this.collection = new cdb.admin.Visualizations();
    this._initBinds();
    this._optionCheck();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(this.template());
    this._initViews();
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:state', this._onStateChange, this);
    this.createModel.bind('change:option', this._optionCheck, this);
    // this.routerModel.bind('change', this._fetchCollection, this);
    // this.add_related_model(this.routerModel);
    this.add_related_model(this.createModel);
  },

  _initViews: function() {
    // Navigation view
    var navigationView = new NavigationView({
      el: this.$('.js-navigation'),
      user: this.user,
      routerModel: this.routerModel,
      createModel: this.createModel,
      collection: this.collection,
      model: this.model
    })
    navigationView.render();
    this.addView(navigationView);

    // Listing content pane
    // - Datasets view
    // - Imports view

    // Listing pane
    this.listingPane = new cdb.ui.common.TabPane({
      el: this.$(".ListingContent")
    });
    this.addView(this.listingPane);

    // Datasets view
    // var datasetsView = new DatasetsView({
    //   user: this.user,
    //   router: this.router,
    //   collection: this.collection
    // });
    
    // datasetsView.render();
    // this.listingPane.addTab('list', datasetsView);

    // Imports view
    var importsView = new ImportsView({
      user: this.user,
      createModel: this.createModel
    });

    importsView.render();
    this.listingPane.addTab('import', importsView);
  },

  _onStateChange: function() {
    this.listingPane.active(this.model.get('state'));
  },

  _optionCheck: function() {
    // Fetch collection once listing is visible
    if (this.createModel.get('option') === "listing") {
      this._fetchCollection();
      this.createModel.unbind('change:option', this._onOptionChange, this);
    }
  },

  _fetchCollection: function() {
    var params = this.routerModel.attributes;

    this.collection.options.set({
      q:              params.q,
      page:           params.page || 1,
      tags:           params.tag,
      per_page:       this.collection['_TABLES_PER_PAGE'],
      only_shared:    params.shared,
      exclude_shared: !params.shared,
      locked:         params.locked,
      only_liked:     params.liked,
      order:          'updated_at',
      type:           params.library ? 'remote' : 'table'
    });

    this.collection.fetch();
  },

});