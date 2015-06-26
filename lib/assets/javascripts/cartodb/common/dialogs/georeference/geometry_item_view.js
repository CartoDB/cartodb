var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * View for an individual geometry type
 */
module.exports = cdb.core.View.extend({

  className: 'OptionCard',

  events: {
    'click': '_onClick'
  },

  initialize: function() {
    if (!this.options.type) cdb.log.error('type is required');
    if (!this.options.titles) cdb.log.error('titles is required');
    if (!this.options.titles.available) cdb.log.error('titles.available is required');
    if (!this.options.titles.unavailable) cdb.log.error('titles.unavailable is required');
    this.availableGeometries = this.options.availableGeometries;
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.getTemplate('common/dialogs/georeference/geometry_item')({
        titles: this.options.titles
      })
    );
    this._onChangeAvailableGeometries();
    return this;
  },

  _initBinds: function() {
    this.availableGeometries.bind('change:available_geometries', this._onChangeAvailableGeometries, this);
    this.add_related_model(this.availableGeometries);

    this.model.bind('change:geometryType', this._onChangeGeometryType, this);
  },

  _onChangeGeometryType: function(m, type) {
    this.$el.toggleClass('is-selected', type === this.options.type);
  },

  _onChangeAvailableGeometries: function() {
    var isAvailable = this._isAvailable();

    this.$el.toggleClass('is-disabled', !isAvailable);
    this.$('.js-title').text(this.options.titles[isAvailable ? 'available' : 'unavailable']);
    this.$('.js-learn-more')
      .toggle(!isAvailable && this.options.titles.learnMore)
      .text(this.options.titles.learnMore);
  },

  _onClick: function(ev) {
    this.killEvent(ev);
    if (this._isAvailable()) {
      this.model.set('geometryType', this.options.type);
    }
  },

  _isAvailable: function() {
    return _.contains(this.availableGeometries.get('available_geometries'), this.options.type);
  }

});
