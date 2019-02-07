var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var moment = require('moment');

var Utils = require('builder/helpers/utils');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var randomQuote = require('builder/components/loading/random-quote');
var Visualizations = require('./user-feed/feed-collection');
var ViewFactory = require('builder/components/view-factory');
var MapCardPreview = require('dashboard/components/mapcard-preview-view');

var feedTemplate = require('./user-feed/feed.tpl');
var mapTemplate = require('./user-feed/map-item.tpl');
var datasetTemplate = require('./user-feed/dataset-item.tpl');
var loaderTemplatePath = require('./user-feed/loading.tpl');
var emptyTemplatePath = require('./user-feed/empty.tpl');
var errorTemplatePath = require('./user-feed/error.tpl');

var REQUIRED_OPTS = [
  'config',
  'authenticatedUser'
];

module.exports = CoreView.extend({
  tagName: 'div',

  _PAGE: 1,
  _ITEMS_PER_PAGE: 8,

  _SMALL_WIDTH: 544,

  _CARD_HEIGHT: 170,
  _LOADER_TITLE: 'Loading visualizations',

  events: {
    'click .js-more': '_onClickMore'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    _.bindAll(this, '_onFetchError', '_onWindowResize', '_renderStaticMaps');

    this.maps = [];

    this._initModels();
    this._initBindings();
  },

  render: function () {
    this.$el.html(feedTemplate());
    this._renderLoader();
    this._fetchItems({ page: this._PAGE });

    return this;
  },

  _onWindowResize: function () {
    var width = $(window).width();

    if (width <= this._SMALL_WIDTH) {
      this.model.set('size', 'small');
    } else {
      this.model.set('size', 'big');
    }

    this._renderStaticMaps();
  },

  _initModels: function () {
    var size = 'big';
    var wWidth = $(window).width();

    if (wWidth <= this._SMALL_WIDTH) {
      size = 'small';
    }

    this.model = new Backbone.Model({
      vis_count: 0,
      type: '',
      size: size,
      page: 0,
      order_by: 'updated_at'
    });

    this.collection = new Visualizations([], {
      config: this._config
    });
    this.collection.on('reset', this._renderVisualizations, this);
  },

  _initBindings: function () {
    this.model.on('change:show_more', this._onChangeShowMore, this);
    this.model.on('change:show_loader', this._onChangeShowLoader, this);
    this.model.on('change:show_mast', this._onChangeShowMast, this);
    this.model.on('change:vis_count', this._onChangeVisCount, this);

    $(window).on('resize', this._onWindowResize);
  },

  _onChangeVisCount: function () {
    if (this.model.get('vis_count') >= this.collection.total_entries) {
      this.model.set({ show_more: false });
    } else {
      this.model.set({ show_more: true });
    }
  },

  _onChangeShowMast: function () {
    if (this.model.get('show_mast')) {
      this.$('.js-mast').removeClass('is-hidden');
    } else {
      this.$('.js-mast').addClass('is-hidden');
    }
  },

  _onChangeShowLoader: function () {
    if (this.model.get('show_loader')) {
      this.loader.show();
    } else {
      this.loader.hide();
    }
  },

  _onChangeShowMore: function () {
    this.$('.js-more').toggleClass('is-hidden', !this.model.get('show_more'));
  },

  _renderLoader: function () {
    this.loader = ViewFactory.createByTemplate(loaderTemplatePath, {
      title: this._LOADER_TITLE,
      quote: randomQuote()
    });

    this.$el.append(this.loader.render().$el);
  },

  _renderError: function () {
    this.error = ViewFactory.createByTemplate(errorTemplatePath, {
    });

    this.$el.append(this.error.render().$el);
  },

  _renderEmpty: function () {
    this.empty = ViewFactory.createByTemplate(emptyTemplatePath, {
      name: this._config.user_name
    });

    this.$el.append(this.empty.render().$el);
  },

  _getDatasetSize: function (item) {
    var size = item.get('table').size;
    return size ? Utils.readablizeBytes(size, true).split(' ') : 0;
  },

  _getGeometryType: function (geomTypes) {
    if (geomTypes && geomTypes.length > 0) {
      var types = ['point', 'polygon', 'line', 'raster'];
      var geomType = geomTypes[0];

      return _.find(types, function (type) {
        return geomType.toLowerCase().indexOf(type) !== -1;
      });
    }
    return null;
  },

  _renderVisualizations: function () {
    if (this.collection.length === 0) {
      this.model.set({ show_loader: false });
      this._renderEmpty();
      return;
    }

    this.model.set({
      vis_count: this.model.get('vis_count') + this.collection.length,
      show_loader: false,
      show_more: true,
      show_filters: true,
      show_mast: true
    });

    this.collection.each(function (item) {
      var template = item.get('type') === 'derived' ? mapTemplate : datasetTemplate;
      var geomType = (item.get('table') && item.get('table').geometry_types) ? this._getGeometryType(item.get('table').geometry_types) : null;

      var owner = item.get('permission').owner;

      var el = template({
        vis: item.attributes,
        datasetSize: this._getDatasetSize(item),
        username: owner.username,
        avatar_url: owner.avatar_url,
        table_count: owner.table_count,
        maps_count: owner.maps_count,
        geomType: geomType,
        account_host: this._config.get('account_host'),
        base_url: this._config.get('base_url'),
        updated: moment(item.get('updated_at')).fromNow(),
        showLikeButton: this._userLoggedIn()
      });

      this.$('.js-items').append(el);

      var $item = this.$('.js-items').find('[data-vis-id="' + item.get('id') + '"]');

      if (item.get('type') === 'derived') {
        this.maps.push(item);
      }

      if (item.get('type') === 'derived' && !item.get('rendered_' + this.model.get('size'))) {
        this._renderStaticMap(item, $item);
      }
    }, this);
  },

  _renderStaticMaps: function () {
    _.each(this.maps, function (item) {
      if (!item.get('rendered_' + this.model.get('size'))) {
        var $item = this.$('.js-items').find('[data-vis-id="' + item.get('id') + '"]');
        this._renderStaticMap(item, $item);
      }
    }, this);
  },

  _renderStaticMap: function (vis, $el) {
    var visId = vis.get('id');
    var username = vis.get('permission').owner.username;
    var width = 540;
    var className = 'is-' + this.model.get('size');

    if (this.model.get('size') === 'small') {
      width = 288;
    }

    if (visId && username) {
      vis.set('rendered_' + this.model.get('size'), true);

      new MapCardPreview({
        el: $el.find('.js-header'),
        width: width,
        height: this._CARD_HEIGHT,
        mapsApiResource: this._config.getMapsResourceName(username),
        username: username,
        visId: visId,
        className: className,
        config: this._config
      }).load();
    }
  },

  _getLikesEndpoint: function (vis) {
    return '/api/v1/viz/' + vis.get('id') + '/like';
  },

  _userLoggedIn: function () {
    return this._authenticatedUser && !!this._authenticatedUser.get('username');
  },

  _fetchLike: function (model, url) {
    if (this._authenticatedUser.get('username')) {
      // no more loadModelCompleted event
      model.once('change', function () {
        model.set('likeable', true);
      });
      model.url = url;
      model.sync = Backbone.withCORS;
      model.fetch();
    }
  },

  _fetchItems: function (params) {
    var data = _.extend({
      types: 'table,derived',
      privacy: 'public',
      only_published: 'true',
      exclude_shared: 'true',
      per_page: this._ITEMS_PER_PAGE,
      order: 'updated_at'
    }, params);

    this.collection.fetch({
      data: data,
      error: this._onFetchError,
      reset: true
    });
  },

  _onFetchError: function () {
    this.model.set({ show_loader: false });
    this._renderError();
  },

  _onClickMore: function (e) {
    this.killEvent(e);
    this.model.set({ show_more: false, show_loader: true });
    this._fetchItems({ page: ++this._PAGE });
  }
});
