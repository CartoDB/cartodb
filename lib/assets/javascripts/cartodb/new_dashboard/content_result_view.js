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
    this.$el.html(this.template({
      defaultUrl:     this.router.currentDashboardUrl(),
      page:           this.router.model.get('page'),
      tag:            this.router.model.get('tag'),
      q:              this.router.model.get('q'),
      shared:         this.router.model.get('shared'),
      liked:          this.router.model.get('liked'),
      locked:         this.router.model.get('locked'),
      library:        this.router.model.get('library'),
      isSearching:    this.router.model.isSearching(),
      quote:          randomQuote(),
      type:           this.router.model.get('content_type'),
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
      cdb.god.trigger(
        'openCreateDialog',
        {
          type: 'dataset'
        }
      );
    }
  }

});
