var $ = require('jquery');
var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var navigateThroughRouter = require('../new_common/view_helpers/navigate_through_router');
var randomQuote = require('../new_common/view_helpers/random_quote');
var CreateDialog = require('../new_common/dialogs/create/create_view');

/*
 *  Content result default view
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-mail-link': '_onMailClick',
    'click .js-link':      navigateThroughRouter,
    'click .js-connect':   '_onConnectClick'
  },

  initialize: function() {
    this.user = this.options.user;
    this.router = this.options.router;
    this.template = cdb.templates.getTemplate(this.options.template);

    this._initBinds();
  },

  render: function() {
    var type = this.router.model.get('content_type');

    // Render can be called before there even are data to render, guard for that case
    var defaultUrl = '';
    if (type) {
      defaultUrl = this.router.rootUrlForCurrentType().toDefault();
    }

    this.$el.html(this.template({
      defaultUrl:     defaultUrl,
      page:           this.router.model.get('page'),
      tag:            this.router.model.get('tag'),
      q:              this.router.model.get('q'),
      shared:         this.router.model.get('shared'),
      liked:          this.router.model.get('liked'),
      locked:         this.router.model.get('locked'),
      library:        this.router.model.get('library'),
      quote:          randomQuote(),
      type:           type,
      totalItems:     this.collection.size(),
      totalEntries:   this.collection.total_entries
    }));

    return this;
  },

  _initBinds: function() {
    this.router.model.bind('change', this.render, this);
    this.collection.bind('remove add reset', this.render, this);
    this.add_related_model(this.router.model);
    this.add_related_model(this.collection);
  },

  _onMailClick: function(e) {
    if (e) e.stopPropagation()
  },

  _onConnectClick: function(e) {
    if (e) e.preventDefault();

    if (this.user && this.user.canCreateDatasets()) {
      var createDialog = new CreateDialog({
        type: 'dataset',
        user: this.user
      });

      createDialog.bind('hide', function(d) {
        this.clean();
      });

      createDialog.bind('done', function(d) {
        console.log("show background importer");
        // this.trigger('connectDataset', this);
      }, this);
      createDialog.appendToBody();
    }
  }

});
