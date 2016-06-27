var cdb = require('cartodb.js-v3');
var randomQuote = require('../../common/view_helpers/random_quote');

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
      defaultUrl:     '',
      page:           this.collection.options.get('page'),
      isSearching:    this.model.get('is_searching'),
      tag:            this.collection.options.get('tags'),
      q:              this.collection.options.get('q'),
      quote:          randomQuote(),
      type:           this.collection.options.get('type'),
      totalItems:     this.collection.size(),
      totalEntries:   this.collection.total_entries
    }));

    return this;
  },

  _initBinds: function() {
    this.collection.bind('change', this.render, this);
    this.collection.bind('remove add reset', this.render, this);
    this.add_related_model(this.collection);
  }

});
