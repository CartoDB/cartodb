var cdb = require('cartodb.js');

var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');

var Items = Backbone.Collection.extend({
  url: '/api/v1/viz'
});

module.exports = cdb.core.View.extend({
  tagName: 'div',

  page: 1,
  visCount: 0,

  events: {
    'click .js-more': '_onClickMore'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('common/views/feed/template');
    this.itemsTemplate = cdb.templates.getTemplate('common/views/feed/items_template');

    this.collection = new Items();
    this.collection.bind('reset', this._renderVisualizations, this);
    this._fetchItems({ page: this.page });
  },

  _renderVisualizations: function() {

    this.loader.hide();

    var visualizations = this.collection.models.length > 0 ? this.collection.models[0].get('visualizations') : null;

    if (visualizations) {
      this.totalEntries = this.collection.models[0].get("total_entries");
      this.visCount += visualizations.length;
      if (this.visCount >= this.totalEntries) {
        this.$(".js-more").hide();
      }
    }


    this.$('.js-items').append(
      this.itemsTemplate({
        avatarURL: this.options.avatarURL,
        visualizations: visualizations
      })
    );
  },

  render: function() {

    this.loader = ViewFactory.createByTemplate('common/templates/loading', {
      title: 'Loading visualizations',
      quote: randomQuote()
    });

    this.$el.html(this.template());
    this.$el.append(this.loader.render().$el);

    return this;
  },

  _fetchItems: function(params) {
    var data = _.extend({ types: 'table,derived', per_page: 1, order: 'updated_at', error: this._onFetchError }, params);
    this.collection.fetch({
      data: data
    });
  },

  _onFetchError: function() {
    //debugger;
  },

  _onClickMore: function(e) {
    this.killEvent(e);
    this.loader.show();
    this._fetchItems({ page: this.page++ });
  }
});
