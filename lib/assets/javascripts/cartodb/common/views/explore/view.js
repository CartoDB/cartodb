var cdb = require('cartodb.js');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');
var LikeView = require('../likes/view');
var MapCardPreview = require('../mapcard_preview');

var Items = Backbone.Collection.extend({
  url: 'http://common-data.cartodb.com/api/v2/sql'
});

module.exports = cdb.core.View.extend({
  tagName: 'div',

  _PAGE: 0,
  _LIMIT: 4,
  _ORDER_BY: 'visualization_likes',

  _SORT: {
    'likes': 'visualization_likes',
    'updated_at': 'visualization_updated_at',
    'mapviews': 'visualization_mapviews'
  },

  events: {
    'click .js-more': '_onClickMore',
    'click .js-likes': '_onClickLikes',
    'click .js-updated_at': '_onClickUpdatedAt',
    'click .js-mapviews': '_onClickMapViews'
  },

  initialize: function() {
    _.bindAll(this, '_initLikes');

    this.template = cdb.templates.getTemplate('common/views/explore/template');
    this.itemsTemplate = cdb.templates.getTemplate('common/views/explore/items_template');

    this.collection = new Items();
    this.collection.bind('reset', this._renderVisualizations, this);
    this._fetchItems();

    var self = this;

    this._likeModels = new Backbone.Collection();

    this.options.authenticatedUser.bind('change', function() {
      self._onAuthenticatedUserChange();
      self._initLikes();
    }, this);
  },

  _renderVisualizations: function() {

    this.loader.hide();

    var visualizations = this.collection.models.length > 0 ? this.collection.models[0].get('rows') : null;

    if (visualizations) {
      this.totalEntries = this.collection.models[0].get('rows').length;
      this.$('.js-more').removeClass('is-hidden');

      this.$('.js-items').append(
        this.itemsTemplate({
          visualizations: visualizations
        })
      );

      this._renderStaticMaps();
      this._initLikes();
      this.$('.js-mast').removeClass('is-hidden');
    }
  },

  render: function() {
    this.loader = ViewFactory.createByTemplate('common/views/explore/loading', {
      title: 'Exploring',
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
          width: 860,
          height: 220,
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

  _fetchItems: function(params, reset) {

    if (reset) {
      this.$('.js-more').addClass('is-hidden');
      this.$('.js-mast').addClass('is-hidden');
      this.loader.show();
      this.$('.js-items').empty();
      this._PAGE = 0;
    }

    var fields = [
      'visualization_mapviews::numeric/(1.0 + (now()::date - visualization_created_at::date)::numeric)^2 As r',
      'visualization_tags',
      'visualization_table_names',
      'visualization_updated_at AS updated_at',
      'visualization_name AS name',
      'user_username AS username',
      'user_avatar_url AS avatar_url',
      'visualization_id AS id',
      'visualization_likes AS likes',
      'visualization_type AS type',
      'visualization_title AS title',
      'visualization_mapviews AS mapviews'
    ].join(',');

    var q = 'SELECT ' + fields + ' FROM visualizations ORDER BY ' + this._ORDER_BY + ' DESC, r DESC LIMIT ' + this._LIMIT + ' OFFSET ' + (this._LIMIT * this._PAGE);
    var data = _.extend({ q: q, error: this._onFetchError }, params);

    this.collection.fetch({
      data: data,
      reset: reset
    });
  },

  _onFetchError: function() {
    // debugger;
  },

  _onClickMore: function(e) {
    this.killEvent(e);
    this.loader.show();
    this.$('.js-more').addClass('is-hidden');
    ++this._PAGE;
    this._fetchItems({}, false);
  },

  _sort: function(method) {
    $('.js-order-link').removeClass('is-selected');
    $('.js-' + method).addClass('is-selected');
    this._ORDER_BY = this._SORT[method];
    this._fetchItems({}, true);
  },

  _onClickLikes: function(e) {
    this.killEvent(e);
    this._sort('likes');
  },

  _onClickUpdatedAt: function(e) {
    this.killEvent(e);
    this._sort('updated_at');
  },

  _onClickMapViews: function(e) {
    this.killEvent(e);
    this._sort('mapviews');
  }
});
