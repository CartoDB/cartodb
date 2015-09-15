var cdb = require('cartodb.js');
var LikeView = require('../likes/view');
var MapCardPreview = require('../mapcard_preview');
var ScrollableHeader = require('../scrollable_header');
var VisualizationDropdown = require('./dropdown');

var Feed = require('../feed/view');

var Items = Backbone.Collection.extend({
  url: 'http://common-data.cartodb.com/api/v2/sql',

  parse: function(models) {
    return models.rows;
  }
});

module.exports = Feed.extend({
  tagName: 'div',

  _LIMIT: 4,

  _SMALL_WIDTH: 544,
  _MEDIUM_WIDTH: 900,

  _CARD_HEIGHT: 220,
  _LOADER_TITLE: 'Exploring',

  _DROPDOWN_TEXT: {
    null: 'Maps and datasets',
    'table': 'Datasets',
    'derived': 'Maps'
  },

  _SORT: {
    'likes': 'likes_trend',
    'updated_at': 'visualization_updated_at',
    'mapviews': 'mapviews_trend'
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
    _.bindAll(this, '_initLike', '_onWindowResize', '_renderStaticMaps');

    this._initTemplates();
    this._initModels();
    this._initBindings();
    this._fetchItems();
  },

  render: function() {
    this.$el.html(this.template());
    this._renderLoader();

    this._setupVisualizationDropdown();
    this._setupScrollableHeader();

    return this;
  },

  _setupScrollableHeader: function() {
    this.scrollableHeader = new ScrollableHeader({
      el: $('.Filters-explore'),
      anchorPoint: $('.Header').height() + $('.FavMap').height()
    });
  },

  _setupVisualizationDropdown: function() {
    this.visualizationDropdown = dropdown = new VisualizationDropdown({
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
  },

  _onWindowResize: function() {
    var width = $(window).width();

    if (width <= this._SMALL_WIDTH) {
      this.model.set('size', 'small');
    } else if (width <= this._MEDIUM_WIDTH) {
      this.model.set('size', 'medium');
    } else {
      this.model.set('size', 'big');
    }

    this._renderStaticMaps();
  },

  _initTemplates: function() {
    this.template = cdb.templates.getTemplate('common/views/explore/template');
    this.mapTemplate = cdb.templates.getTemplate('common/views/explore/map_item_template');
    this.datasetTemplate = cdb.templates.getTemplate('common/views/explore/dataset_item_template');
    this.loaderTemplatePath = 'common/views/explore/loading';
  },

  _initModels: function() {
    var size = 'big';
    var wWidth = $(window).width();

    if (wWidth <= this._SMALL_WIDTH) {
      size = 'small';
    } else if (wWidth <= this._MEDIUM_WIDTH) {
      size = 'medium';
    }

    this.model = new cdb.Backbone.Model({
      rendered_big: false,
      rendered_medium: false,
      rendered_small: false,
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

    $(window).bind('resize', this._onWindowResize);
  },

  _getGeometryType: function(geomTypes) {
    if (geomTypes && geomTypes.length > 0) {
      var types = ['point', 'polygon', 'line', 'raster'];
      var geomType = geomTypes[0];

      return _.find(types, function(type) {
        return geomType.toLowerCase().indexOf(type) !== -1;
      });

    } else {
      return null;
    }
  },

  _renderVisualizations: function() {

    this.model.set({ show_loader: false, show_more: true, show_filters: true, show_mast: true });

    this.collection.each(function(item) {
      var template = item.get('type') === 'derived' ? this.mapTemplate : this.datasetTemplate;

      var el = template({
        vis: item.attributes,
        geomType: this._getGeometryType(item.get('geom_types')),
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

  _renderStaticMap: function(vis, $el) {

    var visId = vis.get('id');
    var username = vis.get('username');

    var width = 860;

    if (this.model.get('size') === 'small') {
      width = 288;
    } else if (this.model.get('size') === 'medium') {
      width = 540;
    }

    var className = 'is-' + this.model.get('size');

    if (visId && username) {

      vis.set('rendered_' + this.model.get('size'), true);

      new MapCardPreview({
        el: $el.find('.js-header'),
        width: width,
        height: this._CARD_HEIGHT,
        username: username,
        visId: visId,
        className: className,
        account_host: 'cartodb.com' //, config.account_host
      }).load();
    }
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

  _generateQuery: function() {
    var fields = [
      'user_avatar_url AS avatar_url',
      'user_username AS username',
      'visualization_geometry_types AS geom_types',
      'visualization_id AS id',
      'visualization_likes AS likes',
      'visualization_mapviews AS mapviews',
      'visualization_mapviews::numeric/(1.0 + (now()::date - visualization_created_at::date)::numeric)^2 AS mapviews_trend',
      'visualization_likes::numeric/(1.0 + (now()::date - visualization_created_at::date)::numeric)^2 AS likes_trend',
      'visualization_name AS name',
      'visualization_table_names AS table_names',
      'visualization_table_rows AS rows',
      'visualization_table_size AS table_size',
      'visualization_tags AS tags',
      'visualization_title AS title',
      'visualization_type AS type',
      'visualization_updated_at AS updated_at'
    ].join(',');

    var queryTemplate = 'SELECT <%= fields %> FROM visualizations <%= where %> ORDER BY <%- order_by %> DESC LIMIT <%- limit %> OFFSET <%- offset %>';

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
    this.$('.js-dropdownLabel').text(this._DROPDOWN_TEXT[this.model.get('type')]);
    this._fetchItems({}, true);
  },

  _onChangeOrderBy: function() {
    $('.js-order-link').removeClass('is-selected');
    $('.js-' + this.model.get('order_by')).addClass('is-selected');
    this._fetchItems({}, true);
  },

  _onChangeShowFilters: function() {
    if (this.model.get('show_filters')) {
      this.$('.js-filters').removeClass('is-hidden');
    } else {
      this.$('.js-filters').addClass('is-hidden');
    }
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
