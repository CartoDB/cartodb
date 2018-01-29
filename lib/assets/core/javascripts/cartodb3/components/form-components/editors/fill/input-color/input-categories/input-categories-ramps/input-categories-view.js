var CoreView = require('backbone/core-view');
var template = require('./input-categories-ramps.tpl');
var cartoColor = require('../../../../../../../helpers/carto-color');

// Events triggered by this view
var EVENTS = {
  RAMP_SELECTED: 'ramp-selected',
  CUSTOM_COLOR: 'custom-color'
};

module.exports = CoreView.extend({

  // Back event is handled by stackView
  events: {
    'click .js-ramp': '_onRampClick',
    'click .js-custom-color-set': '_onCustomColorSetClick'
  },

  initialize: function (opts) {
    this.model = opts.model;
    this._maxValues = opts.maxValues;
    this._requiredCartoColorRamps = opts.requiredCartoColorRamps;
    this._requiredNumberOfColors = this._computeRequiredNumberOfColors();
    this._colors = cartoColor.getQualitativeRamps(this._requiredNumberOfColors);
  },

  _computeRequiredNumberOfColors: function () {
    if (this.model.get('domain') && this.model.get('domain').length < this._maxValues) {
      return this.model.get('domain').length;
    }

    return this._maxValues + 1; // Include "Others"
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.append(template({
      colors: this._colors,
      requiredNumberOfColors: this._requiredNumberOfColors
    }));

    return this;
  },

  _onRampClick: function (event) {
    this.killEvent(event); // Prevent closing the popup
    var index = parseInt(event.target.dataset.index);
    if (!isFinite(index)) {
      return;
    }
    var newRange = this._colors[index].slice(0, this._requiredNumberOfColors);
    this.model.set('range', newRange);
    this.trigger(EVENTS.RAMP_SELECTED);
  },

  _onCustomColorSetClick: function (event) {
    this.killEvent(event);
    this.trigger(EVENTS.CUSTOM_COLOR);
  }
},
{
  EVENTS: EVENTS
});
