var cdb = require('cartodb.js');
var randomQuote = require('../common/view_helpers/random_quote');

/*
 *  Content result default view
 */

module.exports = cdb.core.View.extend({

  initialize: function() {
    this.template = cdb.templates.getTemplate(this.options.template);

    this._initBinds();
  },

  render: function() {
    this.$el.html(this.template({
      // defaultUrl:     this.router.currentDashboardUrl(),
      // page:           this.router.model.get('page'),
      // tag:            this.router.model.get('tag'),
      // q:              this.router.model.get('q'),
      // shared:         this.router.model.get('shared'),
      // liked:          this.router.model.get('liked'),
      // locked:         this.router.model.get('locked'),
      // library:        this.router.model.get('library'),
      // isSearching:    this.router.model.isSearching(),
      // quote:          randomQuote(),
      // type:           this.router.model.get('content_type'),
      // totalItems:     this.collection.size(),
      // totalEntries:   this.collection.total_entries
      defaultUrl:     null,
      page:           1,
      tag:            null,
      q:              null,
      shared:         null,
      liked:          null,
      locked:         null,
      library:        null,
      isSearching:    null,
      quote:          null,
      type:           null,
      totalItems:     null,
      totalEntries:   null
    }));

    return this;
  },

  _initBinds: function() {
    this.collection.bind('change', this.render, this);
    this.collection.bind('remove add reset', this.render, this);
    this.add_related_model(this.collection);
  }

});
