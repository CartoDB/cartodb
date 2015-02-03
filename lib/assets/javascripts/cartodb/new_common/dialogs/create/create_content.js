var cdb = require('cartodb.js');
var CreateHeader = require('new_common/dialogs/create/create_header');
var CreateFooter = require('new_common/dialogs/create/create_footer');
var CreateTemplates = require('new_common/dialogs/create/create_templates');
var CreateListing = require('new_common/dialogs/create/create_listing');
var CreatePreview = require('new_common/dialogs/create/create_preview');

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
      model: this.model
    });

    createFooter.render();
    this.addView(createFooter);

    // Create pane
    this.createPane = new cdb.ui.common.TabPane({
      el: this.$(".CreateDialog-body")
    });
    this.addView(this.createPane);
    
    // Create dialog templates
    if (this.model.get('type') === "map") {
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
    }

    // Create dialog listing
    var createListing = new CreateListing({
      user: this.user,
      model: this.model
    });
    
    createListing.render();
    this.createPane.addTab('listing', createListing);
    this.addView(createListing);
  },

  _setOption: function() {
    this.createPane.active(this.model.get('option'));
  },

  _initBinds: function() {
    this.model.bind('change:option', this._setOption, this);
  }

});