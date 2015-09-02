var cdb = require('cartodb.js');

var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');

var Item = cdb.core.View.extend();

var Items = Backbone.Collection.extend({
  model: Item,
  url: '/api/v1/viz'
});

module.exports = cdb.core.View.extend({
  tagName: 'div',

  events: {},

  initialize: function() {
    this.template = cdb.templates.getTemplate('common/views/feed/template');
    this.collection = new Items();
    this.collection.bind('reset', this._renderVisualizations, this);
    this.collection.fetch({
      data: {
        types: 'table,derived',
        page: 1,
        per_page: 16,
        order: 'updated_at'
      }
    });
  },

  _renderVisualizations: function() {
    var visualizations = this.collection.models.length > 0 ? this.collection.models[0].get("visualizations") : null;

    this.$el.html(
      this.template({
        visualizations: visualizations
      })
    );
  },

  render: function() {

    this.loader = ViewFactory.createByTemplate('common/templates/loading', {
      title: 'Loading visualizations',
      quote: randomQuote()
    });

    this.$el.append(this.loader.render().$el);

    return this;
  }
});
