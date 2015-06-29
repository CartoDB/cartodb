var _ = require('underscore');
var cdb = require('cartodb.js');
var GeometryItemView = require('./geometry_item_view');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');

/**
 * View to select which geometry type to use for georeference process.
 */
module.exports = cdb.core.View.extend({

  className: 'Georeference-contentItem OptionCards',

  initialize: function() {
    this.availableGeometries = new cdb.admin.Geocodings.AvailableGeometries();

    this._initBinds();
    this._fetchAvailableGeometries();
  },

  render: function() {
    this.clearSubViews();
    if (this.availableGeometries.get('available_geometries')) {
      this._appendGeometryViews();
    } else {
      this.$el.html(this._createLoadingView());
    }
    return this;
  },

  _appendView: function(view) {
    this.$el.append(view.render().$el);
  },

  _appendGeometryViews: function() {
    this.$el.append(
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
    );
  },

  _createItemView: function(d) {
    var view = new GeometryItemView(_.extend({
      model: this.model,
      availableGeometries: this.availableGeometries
    }, d));
    this.addView(view);
    return view.render().$el;
  },

  _createLoadingView: function() {
    var view = ViewFactory.createByTemplate('common/templates/loading', {
      title: 'Checking for available geometries…',
      quote: randomQuote()
    });
    this.addView(view);
    return view.render().$el;
  },

  _initBinds: function() {
    this.availableGeometries.bind('change:available_geometries', this.render, this);
    this.add_related_model(this.availableGeometries);
  },

  _fetchAvailableGeometries: function() {
    var d = this.options.fetchData || {};
    d.kind = this.model.kind || 'anytype';
    d.free_text = d.free_text || 'World';

    this.availableGeometries.fetch({
      data: d
    });
  }

});
