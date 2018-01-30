var CoreView = require('backbone/core-view');
var template = require('./input-categories-ramps.tpl');
var cartoColor = require('../../../../../../../helpers/carto-color');

// Events triggered by this view
var EVENTS = {
  CUSTOM_COLOR: 'custom-color'
};

module.exports = CoreView.extend({

  // Back event is handled by stackView
  events: {
    'click .js-custom-color-set': '_onCustomColorSetClick'
  },

  initialize: function (opts) {
    this.model = opts.model;
    this._maxValues = opts.maxValues;
    this._requiredCartoColorRamps = opts.requiredCartoColorRamps;
    this._colors = cartoColor.getQualitativeRamps(this._computeRequiredNumberOfColors());
  },

  _computeRequiredNumberOfColors: function () {
    return Math.min(this.model.get('domain').length, this._maxValues + 1);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.append(template({
      colors: this._colors
    }));

    return this;
  },

  _onCustomColorSetClick: function (event) {
    this.killEvent(event);
    this.trigger(EVENTS.CUSTOM_COLOR);
  }
},
{
  EVENTS: EVENTS
});
