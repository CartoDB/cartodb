var cdb = require('cartodb.js');
var ViewFactory = require('../common/view_factory');
var randomQuote = require('../common/view_helpers/random_quote');
var Visualizations = require('./datasets_collection');

module.exports = cdb.core.View.extend({
  tagName: 'div',

  _PAGE: 1,
  _LIMIT: 12,

  events: {
    'click .js-more': '_onClickMore'
  },

  initialize: function() {
    this.maps = [];

    this._initTemplates();
    this._initModels();
    this._initBindings();
  },

  render: function() {
    this.$el.html(this.template(_.extend({
      order: null, // TODO
    })));
    this._renderLoader();
    this._fetchItems({ page: this._PAGE });

    return this;
  },

  _initTemplates: function() {
    this.template = cdb.templates.getTemplate('public_data_dashboard/template');
    this.mapTemplate = cdb.templates.getTemplate('public_data_dashboard/map_item_template');
    this.loaderTemplatePath = 'public_data_dashboard/loading';
  },

  _initModels: function() {
    this.model = new cdb.core.Model({
      type: 'table',
      page: 0,
      order_by: 'likes'
    });

    this.collection = new Visualizations();
    this.collection.bind('reset', this._renderVisualizations, this);
  },

  _initBindings: function() {
    this.model.bind('change:show_more', this._onChangeShowMore, this);
    this.model.bind('change:show_loader', this._onChangeShowLoader, this);
    this.model.bind('change:vis_count', this._onChangeVisCount, this);
  },

  _onChangeShowLoader: function() {
    if (this.model.get('show_loader')) {
      this.loader.show();
    } else {
      this.loader.hide();
    }
  },

  _onChangeVisCount: function() {
    if (this.model.get('vis_count') >= this.collection.total_entries) {
      this.model.set({ show_more: false });
    } else {
      this.model.set({ show_more: true });
    }
  },

  _onChangeShowMore: function() {
    this.$('.js-more').toggleClass('is-hidden', !this.model.get('show_more'));
  },

  _renderLoader: function() {
    this.loader = ViewFactory.createByTemplate(this.loaderTemplatePath, {
      title: this._LOADER_TITLE,
      quote: randomQuote()
    });

    this.$el.append(this.loader.render().$el);
  },

  _fetchItems: function(reset) {
    debugger;
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
    this.model.set({ vis_count: this.model.get('vis_count') + this.collection.length, show_loader: false, show_more: true, show_filters: true });

    this.collection.each(function(item) {
      var template = this.mapTemplate;

      var el = template({
        vis: item.attributes,
        date: this.model.get('order_by') === 'updated_at' ? item.get('updated_at') : item.get('created_at'),
        datasetSize: this._getDatasetSize(item),
        geomType: this._getGeometryType(item.get('geom_types')),
        account_host: 'cartodb.com'
      });

      this.$('.js-items').append(el);

      var $item = this.$('.js-items').find('[data-vis-id="' + item.get('id') + '"]');

      if (item.get('type') === 'derived') {
        this.maps.push(item);
      }

      // if (!item.get('rendered_' + this.model.get('size'))) {
      //   this._renderStaticMap(item, $item);
      // }

    }, this);

    // this._initLikes();
  },

  _onClickMore: function(e) {
    this.killEvent(e);
    this.model.set({ page: this.model.get('page') + 1, show_loader: true, show_more: false });
    this._fetchItems(false);
  },

});
