var cdb = require('cartodb.js');
var RouterModel = require('../../../new_dashboard/router/model');
var NavigationView = require('./listing/navigation_view');
var DatasetsView = require('./listing/datasets_view');
var ImportsView = require('./listing/imports_view');
var CreateScratchView = require('./listing/create_scratch_view');
var LocalStorage = require('../../../../../javascripts/cartodb/new_common/local_storage');
var CreateOnboarding = require('../../../../../javascripts/cartodb/new_common/dialogs/create/create_onboarding');

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
    this.localStorage = new LocalStorage();
    this.template = cdb.templates.getTemplate('new_common/views/create/create_listing');
    this.model = new cdb.core.Model({
      state: !this.user.canCreateDatasets() || this.createModel.get('type') === "map" ? 'list' : 'import', // import, list or scratch states
      collectionFetched: false
    });

    this.routerModel = new RouterModel({
      content_type: 'datasets',
      library: this.createModel.isDatasetType()
    }, {
      dashboardUrl: this.user.viewUrl().dashboard()
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
    this.model.bind('change:state', this._setState, this);
    this.createModel.bind('change:option', this._optionCheck, this);
    this.routerModel.bind('change', this._fetchCollection, this);
    this.add_related_model(this.routerModel);
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
    var datasetsView = new DatasetsView({
      defaultUrl: this.user.viewUrl().dashboard().datasets(),
      user: this.user,
      createModel: this.createModel,
      routerModel: this.routerModel,
      collection: this.collection
    });

    datasetsView.bind('remoteSelected', function(d) {
      this.trigger('remoteSelected', d, this);
    }, this);

    datasetsView.render();
    this.listingPane.addTab('list', datasetsView);

    // Imports view
    if (this.user.canCreateDatasets()) {
      var createEmptyView = new CreateScratchView({
        user: this.user,
        createModel: this.createModel
      });

      createEmptyView.render();
      this.listingPane.addTab('scratch', createEmptyView);
      
      var importsView = new ImportsView({
        user: this.user,
        createModel: this.createModel
      });

      importsView.render();
      this.listingPane.addTab('import', importsView);
    }

    // Create onboarding
    var mapType = this.createModel.isMapType();

    if ((mapType && !this.localStorage.get("onboarding-create-map")) ||
      (!mapType && !this.localStorage.get("onboarding-create-dataset"))) {
      var createOnboarding = new CreateOnboarding({
        localStorage: this.localStorage,
        model: this.createModel
      });

      this.$el.append(createOnboarding.render().el);
      createOnboarding.show();
      this.addView(createOnboarding);
    } 
  },

  _setState: function() {
    if (this.listingPane) {
      this.listingPane.active(this.model.get('state'));
    }
    this.createModel.setListingState(this.model.get('state'));
  },

  _optionCheck: function() {
    var option = this.createModel.getOption();
    var datasetOption = this.createModel.getDatasetsState();
    var search = this.routerModel.get('q');

    // Fetch collection if it was never fetched (and a search is not applied!)
    if (option === "listing" && datasetOption && !this.model.get('collectionFetched') && !search) {
      this.model.set('collectionFetched', true);
      this._fetchCollection();
    }

    // Set sub state
    if (option === "listing") {
      this._setState();
    }
  },

  _fetchCollection: function() {
    var params = this.routerModel.attributes;
    var types = 'table';

    // Requesting data library items?
    if (params.library || this.createModel.get('type') !== "map") {
      types = 'remote'
    }
    
    // Supporting search in data library and user datasets at the same time
    if ((params.q || params.tag) && this.createModel.get('type') === "map") {
      types = 'table,remote'
    }

    this.collection.options.set({
      locked:         '',
      q:              params.q,
      page:           params.page || 1,
      tags:           params.tag,
      per_page:       this.collection['_TABLES_PER_PAGE'],
      shared:         params.shared,
      only_liked:     params.liked,
      order:          'updated_at',
      type:           '',
      types:          types
    });

    this.collection.fetch();
  },

});
