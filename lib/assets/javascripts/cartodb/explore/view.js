var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');
var Backbone = require('backbone-cdb-v3');
var cdb = require('cartodb.js-v3');
var MapCardPreview = require('../common/views/mapcard_preview');
var ScrollableHeader = require('../common/views/scrollable_header');
var VisualizationDropdown = require('./dropdown');
var Visualizations = require('./feed_collection');
var Feed = require('../user_feed/view');

module.exports = Feed.extend({
  tagName: 'div',

  _LIMIT: 8,

  _SMALL_WIDTH: 544,
  _MEDIUM_WIDTH: 900,

  _CARD_HEIGHT: 220,
  _LOADER_TITLE: 'Exploring',

  _DROPDOWN_TEXT: {
    null: 'Maps and datasets',
    'table': 'Datasets',
    'derived': 'Maps'
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
    _.bindAll(this, '_initLike', '_fetchLike', '_onWindowResize', '_renderStaticMaps');

    this.maps = [];

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
      el: $('.js-explore-context-menu'),
      anchorPoint: $('.Header').height() + $('.FavMap').height()
    });
    this.addView(this.scrollableHeader);
  },

  _setupVisualizationDropdown: function() {
    this.visualizationDropdown = new VisualizationDropdown({
      target: this.$('.js-dropdown'),
      horizontal_position: 'horizontal_left',
      horizontal_offset: -110,
      tick: 'center',
      model: this.model,
      position: 'offset',
      vertical_offset: 0
    });

    this.addView(this.visualizationDropdown);
    cdb.god.bind('closeDialogs', this.visualizationDropdown.hide, this.visualizationDropdown);
    this.add_related_model(cdb.god);
    $('body').append(this.visualizationDropdown.render().el);
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
    this.template = cdb.templates.getTemplate('explore/template');
    this.mapTemplate = cdb.templates.getTemplate('explore/map_item_template');
    this.datasetTemplate = cdb.templates.getTemplate('explore/dataset_item_template');
    this.loaderTemplatePath = 'explore/loading';
  },

  _initModels: function() {
    var size = 'big';
    var wWidth = $(window).width();

    if (wWidth <= this._SMALL_WIDTH) {
      size = 'small';
    } else if (wWidth <= this._MEDIUM_WIDTH) {
      size = 'medium';
    }

    this.model = new cdb.core.Model({
      rendered_big: false,
      rendered_medium: false,
      rendered_small: false,
      type: '',
      size: size,
      page: 0,
      order_by: 'likes'
    });

    this.collection = new Visualizations();

    this.collection.bind('reset', this._renderVisualizations, this);
  },

  _initBindings: function() {
    var self = this;

    this.model.bind('change:show_more', this._onChangeShowMore, this);
    this.model.bind('change:show_loader', this._onChangeShowLoader, this);
    this.model.bind('change:show_filters', this._onChangeShowFilters, this);
    this.model.bind('change:show_mast', this._onChangeShowMast, this);
    this.model.bind('change:order_by', this._onChangeOrderBy, this);
    this.model.bind('change:type', this._onChangeType, this);

    this.add_related_model(this.options.authenticatedUser);

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

  _getDatasetSize: function(item) {
    var size = item.get('table_size');
    return size ? cdb.Utils.readablizeBytes(size, true).split(' ') : 0;
  },

  _renderVisualizations: function() {

    this.model.set({ show_loader: false, show_more: true, show_filters: true, show_mast: true });

    this.collection.each(function(item) {
      var template = item.get('type') === 'derived' ? this.mapTemplate : this.datasetTemplate;

      var el = template({
        vis: item.attributes,
        date: this.model.get('order_by') === 'updated_at' ? item.get('updated_at') : item.get('created_at'),
        datasetSize: this._getDatasetSize(item),
        geomType: this._getGeometryType(item.get('geom_types')),
        account_host: cdb.config.get('account_host')
      });

      this.$('.js-items').append(el);

      var $item = this.$('.js-items').find('[data-vis-id="' + item.get('id') + '"]');

      if (item.get('type') === 'derived') {
        this.maps.push(item);
      }

      if (item.get('type') === 'derived' && !item.get('rendered_' + this.model.get('size'))) {
        this._renderStaticMap(item, $item);
      }

      this._initLike(item, $item.find('.js-like'));

    }, this);

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
        mapsApiResource: cdb.config.getMapsResourceName(username)
      }).load();
    }
  },

  _getLikesEndpoint: function(vis) {
    return '//' + vis.get('username') + '.' + cdb.config.get('account_host') + '/api/v1/viz/' + vis.get('id') + '/like';
  },

  _selectType: function(what) {
    var self = this;

    this.model.set({ show_more: false });

    $('body').animate({ scrollTop: 150 }, { duration: 250, complete: function() {
      self.model.set({ type: what });
    }});
  },

  _sort: function(method) {
    var self = this;

    this.model.set({ show_more: false });

    $('body').animate({ scrollTop: 150 }, { duration: 250, complete: function() {
      self.model.set({ order_by: method });
    }});
  },

  _fetchItems: function(reset) {

    if (reset) {
      this.model.set({ page: 0, show_more: false, show_loader: true, show_mast: false });
      this.$('.js-items').empty();
    }

    var type = this.model.get('type');
    var orderBy = this.model.get('order_by');
    var page = this.model.get('page');
    var limit = this._LIMIT;

    this.collection.fetch({ type: type, orderBy: orderBy, page: page, limit: limit, reset: reset });
  },

  _onClickMore: function(e) {
    this.killEvent(e);
    this.model.set({ page: this.model.get('page') + 1, show_loader: true, show_more: false });
    this._fetchItems(false);
  },

  _onChangeType: function() {
    this.$('.js-dropdownLabel').text(this._DROPDOWN_TEXT[this.model.get('type')]);
    this._fetchItems(true);
  },

  _onChangeOrderBy: function() {
    $('.js-order-link').removeClass('is-selected');
    $('.js-' + this.model.get('order_by')).addClass('is-selected');
    this._fetchItems(true);
  },

  _onChangeShowFilters: function() {
    this.$('.js-filters').toggleClass('is-hidden', !this.model.get('show_filters'));
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
