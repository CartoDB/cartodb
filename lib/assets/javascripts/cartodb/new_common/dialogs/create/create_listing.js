var cdb = require('cartodb.js');
var RouterModel = require('../../../new_dashboard/router/model');
var NavigationView = require('./listing/navigation_view');
var DatasetsView = require('./listing/datasets_view');
var ImportsView = require('./listing/imports_view');

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
    var self = this;
    this.user = this.options.user;
    this.currentUserUrl = this.options.currentUserUrl;
    this.createModel = this.options.createModel;
    this.template = cdb.templates.getTemplate('new_common/views/create/create_listing');
    this.model = new cdb.core.Model({ state: 'import', collectionFetched: false }); // import or list states

    this.routerModel = new RouterModel({
      content_type: 'datasets',
      library: this.createModel.isDatasetType(),
      rootUrlForCurrentTypeFn: function() {
        return self.currentUserUrl[ 'datasetsUrl' ]();
      }
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
    var importsView = new ImportsView({
      user: this.user,
      createModel: this.createModel,
      currentUserUrl: this.currentUserUrl
    });

    importsView.render();
    this.listingPane.addTab('import', importsView);
  },

  _onStateChange: function() {
    this.listingPane.active(this.model.get('state'));
    this.createModel.setListingState(this.model.get('state'));
  },

  _optionCheck: function() {
    var option = this.createModel.getOption();
    var datasetOption = this.createModel.getDatasetsState();

    // Fetch collection if it was never fetched
    if (option === "listing" && datasetOption && !this.model.get('collectionFetched')) {
      this.model.set('collectionFetched', true);
      this._fetchCollection();
    }

    // Set sub state
    if (option === "listing") {
      this.createModel.setListingState(this.model.get('state'));
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
      only_liked:     params.liked,
      order:          'updated_at',
      type:           params.library ? 'remote' : 'table'
    });

    this.collection.fetch();
  },

});
