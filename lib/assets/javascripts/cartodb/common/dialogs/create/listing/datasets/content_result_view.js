var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var randomQuote = require('../../../../../common/view_helpers/random_quote');

/*
 *  Content result default view
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-mail-link': '_onMailClick',
    'click .js-link':      '_onLinkClick'
  },

  initialize: function() {
    if (!this.options.defaultUrl) {
      throw new Error('defaultUrl is required')
    }
    this.user = this.options.user;
    this.routerModel = this.options.routerModel;
    this.template = cdb.templates.getTemplate(this.options.template);

    this._initBinds();
  },

  render: function() {
    var type = this.routerModel.get('content_type');

    this.$el.html(this.template({
      defaultUrl:     this.options.defaultUrl,
      page:           this.routerModel.get('page'),
      tag:            this.routerModel.get('tag'),
      q:              this.routerModel.get('q'),
      shared:         this.routerModel.get('shared'),
      locked:         this.routerModel.get('locked'),
      library:        this.routerModel.get('library'),
      quote:          randomQuote(),
      type:           type,
      totalItems:     this.collection.size(),
      totalEntries:   this.collection.total_entries
    }));

    return this;
  },

  _initBinds: function() {
    this.routerModel.bind('change', this.render, this);
    this.collection.bind('reset', this.render, this);
    this.add_related_model(this.routerModel);
    this.add_related_model(this.collection);
  },

  _onMailClick: function(e) {
    if (e) e.stopPropagation()
  },

  _onLinkClick: function() {
  }

});
