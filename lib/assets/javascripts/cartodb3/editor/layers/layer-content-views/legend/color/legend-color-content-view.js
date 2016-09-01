var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var _ = require('underscore');
var CarouselFormView = require('../../../../../components/carousel-form-view');
var CarouselCollection = require('../../../../../components/custom-carousel/custom-carousel-collection');
var LegendTypes = require('./legend-color-types.js');

var REQUIRED_OPTS = [
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    // TOFIX
    this.model = new Backbone.Model({
      type: 'none'
    });

    this._carouselCollection = new CarouselCollection(
      _.map(LegendTypes, function (legend) {
        return {
          selected: this.model.get('type') === legend.value,
          val: legend.value,
          label: legend.label,
          template: function () {
            return (legend.legendIcon && legend.legendIcon()) || legend.value;
          }
        };
      }, this)
    );

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    // TBD
  },

  _initViews: function () {
    // TODO: Form view
    this._renderCarousel();
  },

  _renderCarousel: function () {
    var view = new CarouselFormView({
      collection: this._carouselCollection,
      template: require('../legend-form-types.tpl')
    });
    this.addView(view);
    this.$el.append(view.render().el);
  }
});
