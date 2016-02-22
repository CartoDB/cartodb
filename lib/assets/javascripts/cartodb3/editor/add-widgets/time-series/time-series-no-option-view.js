var cdb = require('cartodb.js');
var template = require('./time-series-no-option.tpl');

/**
 * Represents the (default) no-option view, i.e. since time-series options only can have one selection,
 * this serves as the "unselect" option.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-radio': '_onSelect',
    'change .js-layers': '_onLayerIndexChange'
  },

  initialize: function (opts) {
    if (!opts.optionsCollection) throw new Error('optionsCollection is required');

    this._optionsCollection = opts.optionsCollection;

    this.listenTo(this._optionsCollection, 'change:selected', this.render);
    this.add_related_model(this._optionsCollection);
  },

  render: function () {
    this.$el.html(this._html());
    return this;
  },

  _html: function () {
    return template({
      isSelected: !this
        ._timeSeriesOptionsChain()
        .any(this._isSelected)
        .value()
    });
  },

  _isSelected: function (m) {
    return !!m.get('selected');
  },

  _onSelect: function () {
    this._timeSeriesOptionsChain().each(this._deselect);
  },

  _deselect: function (m) {
    m.set('selected', false);
  },

  _timeSeriesOptionsChain: function () {
    return this._optionsCollection
      .chain()
      .filter(this._isTimeSeries);
  },

  _isTimeSeries: function (m) {
    return m.get('type') === 'time-series';
  }


});
