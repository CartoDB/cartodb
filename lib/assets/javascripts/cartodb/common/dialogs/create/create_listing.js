var cdb = require('cartodb.js-v3');
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

  className: 'CreateDialog-listing CreateDialog-listing--noPaddingTop',

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
  },

  _addListingPane: function(name, view) {
    this.listingPane.addTab(name, view, {
      active: this.createModel.get('listing') === name
    });
  }

});
