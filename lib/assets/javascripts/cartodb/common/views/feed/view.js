var cdb = require('cartodb.js');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');
var LikeView = require('../likes/view');
var MapCardPreview = require('../mapcard_preview');

var Items = Backbone.Collection.extend({
  url: '/api/v1/viz'
});

module.exports = cdb.core.View.extend({
  tagName: 'div',

  _page: 1,
  _itemsPerPage: 4,
  _visCount: 0,

  events: {
    'click .js-more': '_onClickMore'
  },

  initialize: function() {
    _.bindAll(this, '_initLikes');

    this.template = cdb.templates.getTemplate('common/views/feed/template');
    this.itemsTemplate = cdb.templates.getTemplate('common/views/feed/items_template');

    this.collection = new Items();
    this.collection.bind('reset', this._renderVisualizations, this);
    this._fetchItems({ page: this._page });

    var self = this;
    this._likeModels = new Backbone.Collection();

    this.options.authenticatedUser.bind('change', function() {
      self._onAuthenticatedUserChange();
      self._initLikes();
    }, this);
  },

  _renderVisualizations: function() {

    this.loader.hide();

    var visualizations = this.collection.models.length > 0 ? this.collection.models[0].get('visualizations') : null;

    if (visualizations) {
      this.totalEntries = this.collection.models[0].get('total_entries');
      this._visCount += visualizations.length;

      if (this._visCount >= this.totalEntries) {
        this.$('.js-more').addClass('is-hidden');
      } else {
        this.$('.js-more').removeClass('is-hidden');
      }
    }

    this.$('.js-items').append(
      this.itemsTemplate({
        visualizations: visualizations
      })
    );

    this._renderStaticMaps();
    this._initLikes();
  },

  render: function() {

    this.loader = ViewFactory.createByTemplate('common/views/feed/loading', {
      title: 'Loading visualizations',
      quote: randomQuote()
    });

    this.$el.html(this.template());
    this.$el.append(this.loader.render().$el);

    return this;
  },

  _renderStaticMaps: function() {
    this.$('.MapCard').each(function() {

      var vizjson = $(this).data('vizjson-url');
      var zoom = $(this).data('zoom');

      if (vizjson) {
        var mapCardPreview = new MapCardPreview({
          el: $(this).find('.js-header'),
          width: 500,
          height: 170,
          zoom: zoom,
          vizjson: vizjson
        });
        mapCardPreview.load();
      }
    });
  },

  _initLikes: function() {
    var self = this;
    this.$('.js-like').each(function() {

      var likeable = self.options.authenticatedUser && self.options.authenticatedUser.get('username');

      var likeModel = cdb.admin.Like.newByVisData({
        url: !cdb.config.get('url_prefix') ? $(this).attr('href') : '',
        likeable: likeable,
        show_count: $(this).data('show-count') || false,
        show_label: $(this).data('show-label') || false,
        vis_id: $(this).data('vis-id'),
        likes: $(this).data('likes-count')
      });

      if (likeable) {
        likeModel.fetch();
      }

      self._likeModels.push(likeModel);

      var likeView = new LikeView({
        el: this,
        model: likeModel
      });

      likeView.render();
    });
  },

  _onAuthenticatedUserChange: function() {
    if (this.options.authenticatedUser.get('username')) {
      this._likeModels.each(function(model) {
        model.set('likeable', true);
        model.fetch();
      });
    }
  },

  _fetchItems: function(params) {
    var data = _.extend({ types: 'table,derived', per_page: this._itemsPerPage, order: 'updated_at', error: this._onFetchError }, params);
    this.collection.fetch({
      data: data
    });
  },

  _onFetchError: function() {
    // debugger;
  },

  _onClickMore: function(e) {
    this.killEvent(e);
    this.loader.show();
    this.$('.js-more').addClass('is-hidden');
    this._fetchItems({ page: ++this._page });
  }
});
