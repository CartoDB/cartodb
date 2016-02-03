var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var GeometryItemView = require('./geometry_item_view');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');

/**
 * View to select which geometry type to use for georeference process.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this.availableGeometries = new cdb.admin.Geocodings.AvailableGeometries();

    this._initBinds();
    this._fetchAvailableGeometries();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(
      this.getTemplate('common/dialogs/georeference/choose_geometry')()
    );
    _.each(
      this.availableGeometries.get('available_geometries') ? this._createItemsViews() : [this._createLoadingView()],
      this._appendView, this
    );
    return this;
  },

  _appendView: function(view) {
    this.addView(view);
    this.$('.js-items').append(view.render().el);
  },

  _createItemsViews: function() {
    return [
      this._createItemView({
        type: 'point',
        titles: {
          available: 'Georeference your data with points',
          unavailable: 'No point data available for your selection'
        }
      }),
      this._createItemView({
        type: 'polygon',
        titles: {
          available: 'Georeference your data with administrative regions',
          unavailable: 'No polygon data available for your selection.',
          learnMore: "Sorry, we don't have polygons available for the datatype you are trying to geocode. " +
            'For example, if you are geocoding placenames we can only give you points for where those places exist.'
        }
      })
    ];
  },

  _createItemView: function(d) {
    return new GeometryItemView(_.extend({
      model: this.model,
      availableGeometries: this.availableGeometries
    }, d));
  },

  _createLoadingView: function() {
    return ViewFactory.createByTemplate('common/templates/loading', {
      title: 'Checking for available geometries…',
      quote: randomQuote()
    });
  },

  _initBinds: function() {
    this.availableGeometries.bind('change:available_geometries', this.render, this);
    this.add_related_model(this.availableGeometries);
  },

  _fetchAvailableGeometries: function() {
    this.availableGeometries.fetch({
      data: this.model.availableGeometriesFetchData()
    });
  }

});
