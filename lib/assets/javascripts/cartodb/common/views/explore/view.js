var cdb = require('cartodb.js');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');
var LikeView = require('../likes/view');
var MapCardPreview = require('../mapcard_preview');
var ScrollableHeader = require('../scrollable_header');
var VisualizationDropdown = require('./dropdown');

var Items = Backbone.Collection.extend({
  url: 'http://common-data.cartodb.com/api/v2/sql',

  parse: function(models) {
    return models.rows;
  }
});

module.exports = cdb.core.View.extend({
  tagName: 'div',

  _LIMIT: 4,
  _smallWidth: 320,
  _mediumWidth: 965,

  _DROPDOWN_TEXT: {
    null: 'Maps and datasets',
    'table': 'Datasets',
    'derived': 'Maps'
  },

  _SORT: {
    'likes': 'visualization_likes',
    'updated_at': 'visualization_updated_at',
    'mapviews': 'visualization_mapviews'
  },

  events: {
    'click .js-more': '_onClickMore',
    'click .js-likes': '_onClickLikes',
    'click .js-updated_at': '_onClickUpdatedAt',
    'click .js-mapviews': '_onClickMapViews',
    'click .js-maps-datasets': '_onClickMapsAndDatasets',
    'click .js-maps': '_onClickMaps',
    'click .js-datasets': '_onClickDatasets'
  },

  initialize: function() {
    _.bindAll(this, '_initLike', '_onWindowResize');

    this._initTemplates();
    this._initModels();
    this._initBindings();
    this._fetchItems();

    $(window).bind('resize', this._onWindowResize);
  },

  _onWindowResize: function() {
    var width = $(window).width();

    if (width <= this._smallWidth) {
      this.model.set('size', 'small');
      this._renderStaticMaps();
    } else if (width <= this._mediumWidth) {
      this.model.set('size', 'medium');
      this._renderStaticMaps();
    } else {
      this.model.set('size', 'big');
      this._renderStaticMaps();
    }
  },

  _unbindScroll: function() {
    $(window).unbind('scroll', this._onWindowScroll);
  },

  _bindScroll: function() {
    this._unbindScroll();
    $(window).bind('scroll', this._onWindowScroll);
  },

  _initTemplates: function() {
    this.template = cdb.templates.getTemplate('common/views/explore/template');
    this.itemTemplate = cdb.templates.getTemplate('common/views/explore/items_template');
  },

  _initModels: function() {

    var size = 'big';
    var wWidth = $(window).width();

    if (wWidth <= this._smallWidth) {
      size = 'small';
    } else if (wWidth <= this._mediumWidth) {
      size = 'medium';
    }

    this.model = new cdb.Backbone.Model({
      type: '',
      size: size,
      page: 0,
      order_by: 'likes'
    });

    this.collection = new Items();
    this.collection.bind('reset', this._renderVisualizations, this);
    this._likeModels = new Backbone.Collection();
  },

  _initBindings: function() {
    var self = this;

    this.model.bind('change:show_more', this._onChangeShowMore, this);
    this.model.bind('change:show_loader', this._onChangeShowLoader, this);
    this.model.bind('change:show_filters', this._onChangeShowFilters, this);
    this.model.bind('change:show_mast', this._onChangeShowMast, this);
    this.model.bind('change:order_by', this._onChangeOrderBy, this);
    this.model.bind('change:type', this._onChangeType, this);

    this.options.authenticatedUser.bind('change', function() {
      self._onAuthenticatedUserChange();
      self._initLikes();
    }, this);
  },

  _renderStaticMaps: function() {
    this.collection.each(function(item) {
      if (item.get('type') === 'derived' && !item.get('rendered_' + this.model.get('size'))) {
        var $item = this.$('.js-items').find('[data-vis-id="' + item.get('id') + '"]');
        this._renderStaticMap(item, $item);
      }
    }, this);
  },

  _renderVisualizations: function() {

    this.model.set({ show_loader: false, show_more: true, show_filters: true, show_mast: true });

    this.collection.each(function(item) {
      var el = this.itemTemplate({
        vis: item.attributes,
        account_host: 'cartodb.com' //, config.account_host
      });

      this.$('.js-items').append(el);

      var $item = this.$('.js-items').find('[data-vis-id="' + item.get('id') + '"]');

      if (item.get('type') === 'derived' && !item.get('rendered_' + this.model.get('size'))) {
        this._renderStaticMap(item, $item);
      }

    }, this);

    this._initLikes();
  },

  render: function() {
    this.$el.html(this.template());
    this._renderLoader();

    var dropdown = new VisualizationDropdown({
      target: this.$('.js-dropdown'),
      horizontal_position: 'horizontal_left',
      horizontal_offset: -135,
      tick: 'left',
      model: this.model,
      position: 'offset',
      vertical_offset: 0
    });

    this.addView(dropdown);
    cdb.god.bind('closeDialogs', dropdown.hide, dropdown);
    this.add_related_model(cdb.god);
    $('body').append(dropdown.render().el);

    this.scrollableHeader = new ScrollableHeader({
      el: $('.Filters-explore'),
      anchorPoint: $('.Header').height() + $('.FavMap').height()
    });

    return this;
  },

  _onChangeShowMast: function() {
    if (this.model.get('show_mast')) {
      this.$('.js-mast').removeClass('is-hidden');
    } else {
      this.$('.js-mast').addClass('is-hidden');
    }
  },

  _onChangeShowFilters: function() {
    if (this.model.get('show_filters')) {
      this.$('.js-filters').removeClass('is-hidden');
    } else {
      this.$('.js-filters').addClass('is-hidden');
    }
  },

  _onChangeShowLoader: function() {
    if (this.model.get('show_loader')) {
      this.loader.show();
    } else {
      this.loader.hide();
    }
  },

  _onChangeShowMore: function() {
    if (this.model.get('show_more')) {
      this.$('.js-more').removeClass('is-transparent');
    } else {
      this.$('.js-more').addClass('is-transparent');
    }
  },

  _renderLoader: function() {
    this.loader = ViewFactory.createByTemplate('common/views/explore/loading', {
      title: 'Exploring',
      quote: randomQuote()
    });

    this.$('.js-feed').append(this.loader.render().$el);
  },

  _renderStaticMap: function(vis, $el) {

    var visId = vis.get('id');
    var username = vis.get('username');

    var width = 860;

    if (this.model.get('size') === 'small') {
      width = 288;
    } else if (this.model.get('size') === 'medium') {
      width = 488;
    }

    var height = 220;

    var className = this.model.get('size');

    if (visId && username) {

      vis.set('rendered_' + this.model.get('size'), true);

      new MapCardPreview({
        el: $el.find('.js-header'),
        width: width,
        height: height,
        username: username,
        visId: visId,
        className: className
      }).load();
    }
  },

  _initLikes: function() {
    this.collection.each(function(item) {
      var $item = this.$('.js-items').find('[data-vis-id="' + item.get('id') + '"]');
      this._initLike(item, $item.find('.js-like'));
    }, this);
  },

  _initLike: function(vis, $el) {
    var likeable = this.options.authenticatedUser && this.options.authenticatedUser.get('username');

    if (likeable) {
      var username = this.options.authenticatedUser.get('username');
      var url = '/user/' + username + '/u/' + vis.get('username') + '/api/v1/viz/' + vis.get('id') + '/like';

      var likeModel = cdb.admin.Like.newByVisData({
        url: url,
        likeable: likeable,
        show_count: $el.data('show-count') || false,
        show_label: $el.data('show-label') || false,
        vis_id: vis.get('id'),
        likes: vis.get('likes')
      });

      if (likeable) {
        likeModel.fetch();
      }

      this._likeModels.push(likeModel);

      var likeView = new LikeView({
        el: $el,
        model: likeModel
      });

      likeView.render();
    }
  },

  _onAuthenticatedUserChange: function() {
    if (this.options.authenticatedUser.get('username')) {
      this._likeModels.each(function(model) {
        model.set('likeable', true);
        model.fetch();
      });
    }
  },

  _generateQuery: function() {
    var fields = [
      'user_avatar_url AS avatar_url',
      'user_username AS username',
      'visualization_id AS id',
      'visualization_likes AS likes',
      'visualization_mapviews AS mapviews',
      'visualization_mapviews::numeric/(1.0 + (now()::date - visualization_created_at::date)::numeric)^2 As r',
      'visualization_name AS name',
      'visualization_table_names AS table_names',
      'visualization_tags AS tags',
      'visualization_title AS title',
      'visualization_type AS type',
      'visualization_updated_at AS updated_at'
    ].join(',');

    var queryTemplate = 'SELECT <%= fields %> FROM visualizations <%= where %> ORDER BY <%- order_by %> DESC, r DESC LIMIT <%- limit %> OFFSET <%- offset %>';

    return _.template(queryTemplate, {
      fields: fields,
      order_by: this._SORT[this.model.get('order_by')],
      limit: this._LIMIT,
      where: this.model.get('type') ? 'WHERE visualization_type = \'' + this.model.get('type') + '\'' : '',
      offset: this._LIMIT * this.model.get('page')
    });
  },

  _fetchItems: function(params, reset) {

    if (reset) {
      this.model.set({ page: 0, show_more: false, show_loader: true, show_mast: false });
      this.$('.js-items').empty();
    }

    this.collection.fetch({
      data: _.extend({ q: this._generateQuery() }, params),
      reset: reset
    });
  },

  _onClickMore: function(e) {
    this.killEvent(e);
    this.model.set({ page: this.model.get('page') + 1, show_loader: true, show_more: false });
    this._fetchItems({}, false);
  },

  _onChangeType: function() {
    this.$('.js-dropdown').text(this._DROPDOWN_TEXT[this.model.get('type')]);
    this._fetchItems({}, true);
  },

  _onChangeOrderBy: function() {
    $('.js-order-link').removeClass('is-selected');
    $('.js-' + this.model.get('order_by')).addClass('is-selected');
    this._fetchItems({}, true);
  },

  _selectType: function(what) {
    var self = this;

    this.model.set({ show_more: false });

    $('body').animate({ scrollTop: 0 }, { duration: 250, complete: function() {
      self.model.set({ type: what });
    }});
  },

  _sort: function(method) {
    var self = this;

    this.model.set({ show_more: false });

    $('body').animate({ scrollTop: 0 }, { duration: 250, complete: function() {
      self.model.set({ order_by: method });
    }});
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
  },

  _onClickMapsAndDatasets: function(e) {
    this.killEvent(e);
    this._selectType(null);
  },

  _onClickMaps: function(e) {
    this.killEvent(e);
    this._selectType('derived');
  },

  _onClickDatasets: function(e) {
    this.killEvent(e);
    this._selectType('table');
  }
});
