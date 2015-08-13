var cdb = require('cartodb.js');
var NavigationView = require('./listing/navigation_view');
var DatasetsView = require('./listing/datasets_view');
var ImportsView = require('./listing/imports_view');
var TemplatedWorkflowsMainView = require('./listing/templated_workflows/templated_workflows_main_view');

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
    this.template = cdb.templates.getTemplate('common/views/create/create_listing');

    // Bug with binding... do not work with the usual one for some reason :(
    this.createModel.bind('change:listing', this._onChangeListing.bind(this));
    this.add_related_model(this.createModel);
    this._onChangeListing();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(this.template());
    this._initViews();
    return this;
  },

  _onChangeListing: function() {
    if (this.listingPane) {
      this.listingPane.active(this.createModel.get('listing'));
    }
  },

  _initViews: function() {
    // Navigation view
    var navigationView = new NavigationView({
      el: this.$('.js-navigation'),
      user: this.user,
      routerModel: this.createModel.visFetchModel,
      createModel: this.createModel,
      collection: this.createModel.collection,
      model: this.model
    });
    navigationView.render();
    this.addView(navigationView);

    // Listing content pane
    this.listingPane = new cdb.ui.common.TabPane({
      el: this.$(".ListingContent")
    });
    this.addView(this.listingPane);

    // Datasets view
    var datasetsView = new DatasetsView({
      defaultUrl: this.user.viewUrl().dashboard().datasets(),
      user: this.user,
      createModel: this.createModel,
      routerModel: this.createModel.visFetchModel,
      collection: this.createModel.collection
    });

    datasetsView.render();
    this._addListingPane('datasets', datasetsView);

    // Imports view
    if (this.user.canCreateDatasets()) {
      var importsView = new ImportsView({
        user: this.user,
        createModel: this.createModel
      });

      importsView.render();
      this._addListingPane('import', importsView);
    }

    // Templates WorkflowView view
    if (this.user.featureEnabled('templated_workflows') && this.createModel.isMapType()) {
      var templatesWorkflowView = new TemplatedWorkflowsMainView({
        model: this.createModel,
        user: this.user
      });

      templatesWorkflowView.render();
      this._addListingPane('templated_workflows', templatesWorkflowView);
    }
  },

  _addListingPane: function(name, view) {
    this.listingPane.addTab(name, view, {
      active: this.createModel.get('listing') === name
    });
  }

});
