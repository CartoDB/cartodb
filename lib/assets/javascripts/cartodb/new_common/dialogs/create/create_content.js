var cdb = require('cartodb.js');
var CreateHeader = require('../../../../../javascripts/cartodb/new_common/dialogs/create/create_header');
var CreateFooter = require('../../../../../javascripts/cartodb/new_common/dialogs/create/create_footer');
var CreateTemplates = require('../../../../../javascripts/cartodb/new_common/dialogs/create/create_templates');
var CreateListing = require('../../../../../javascripts/cartodb/new_common/dialogs/create/create_listing');
var CreatePreview = require('../../../../../javascripts/cartodb/new_common/dialogs/create/create_preview');
var CreateLoading = require('../../../../../javascripts/cartodb/new_common/dialogs/create/create_loading');

/**
 *  Create content view
 *
 *  It will manage big components within dialog. They are:
 *
 *  - Create header
 *  - Create body
 *  - Create footer
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'click': '_onClickContent'
  },

  initialize: function() {
    this.user = this.options.user;
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this._initViews();
    this._setOption();
    return this;
  },

  _initViews: function() {
    // Create dialog header
    var createHeader = new CreateHeader({
      el: this.$('.CreateDialog-header'),
      user: this.user,
      model: this.model
    })
    createHeader.render();
    this.addView(createHeader);

    // Create dialog footer
    var createFooter = new CreateFooter({
      el: this.$('.CreateDialog-footer'),
      user: this.user,
      createModel: this.model
    });

    createFooter.bind('datasetSelected', function() {
      this.trigger('datasetSelected', this);
    }, this);

    createFooter.bind('start', function() {
      this.trigger('start', this);
    }, this);

    createFooter.render();
    this.addView(createFooter);

    // Create pane
    this.createPane = new cdb.ui.common.TabPane({
      el: this.$(".CreateDialog-body")
    });
    this.addView(this.createPane);

    // Create dialog loading state
    var createLoading = new CreateLoading({
      user: this.user,
      createModel: this.model
    });

    createLoading.render();
    this.createPane.addTab('loading', createLoading);

    // Create dialog templates
    if (this.model.isMapType()) {
      // Create map templates list
      var createTemplates = new CreateTemplates({
        user: this.user,
        model: this.model
      });

      createTemplates.render();
      this.createPane.addTab('templates', createTemplates);

      // Create dialog template preview
      var createPreview = new CreatePreview({
        user: this.user,
        model: this.model
      });

      createPreview.render();
      this.createPane.addTab('preview', createPreview);
    } else {
      this.model.set('option', 'listing');
    }

    // Create dialog listing
    var createListing = new CreateListing({
      user: this.user,
      createModel: this.model
    });

    createListing.bind('remoteSelected', function(d){
      this.trigger('remoteSelected', d, this);
    }, this);

    createListing.render();
    this.createPane.addTab('listing', createListing);
    this.addView(createListing);
  },

  _setOption: function() {
    this.createPane.active(this.model.getOption());
  },

  _initBinds: function() {
    this.model.bind('change:option', this._setOption, this);
  },

  _onClickContent: function() {
    cdb.god.trigger('closeDialogs');
  }

});
