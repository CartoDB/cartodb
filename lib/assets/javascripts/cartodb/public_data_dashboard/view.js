var cdb = require('cartodb.js');
var Visualizations = require('./datasets_collection');

module.exports = cdb.core.View.extend({
  tagName: 'div',

  _LIMIT: 12,

  initialize: function() {
    this.maps = [];

    this._initTemplates();
    this._initModels();
    this._initBindings();
    this._fetchItems();
  },

  render: function() {
    this.$el.html(this.template(_.extend({
      order: null, // TODO
    })));

    return this;
  },

  _initTemplates: function() {
    this.template = cdb.templates.getTemplate('public_data_dashboard/template');
    this.mapTemplate = cdb.templates.getTemplate('public_data_dashboard/map_item_template');
    this.loaderTemplatePath = 'explore/loading';
  },

  _initModels: function() {
    this.model = new cdb.Backbone.Model({
      type: 'table',
      page: 0,
      order_by: 'likes'
    });

    this.collection = new Visualizations();
    this.collection.bind('reset', this._renderVisualizations, this);
  },

  _initBindings: function() {

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
  }

});
