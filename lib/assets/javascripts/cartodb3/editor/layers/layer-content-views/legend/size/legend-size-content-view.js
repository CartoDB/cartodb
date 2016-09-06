var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var _ = require('underscore');
var CarouselFormView = require('../../../../../components/carousel-form-view');
var CarouselCollection = require('../../../../../components/custom-carousel/custom-carousel-collection');
var LegendTypes = require('./legend-size-types.js');
var BubbleFormModel = require('../form/legend-form-bubble-model');
var FormView = require('../legend-properties-form');

var LEGEND_MODEL_TYPE = {
  'bubble': BubbleFormModel
};

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
    this._carouselCollection.on('change:selected', this._onSelectLegendType, this);
    this.add_related_model(this._carouselCollection);
  },

  _onSelectLegendType: function (mdl) {
    if (mdl.get('selected')) {
      this._legendType = mdl.getValue();
      this.render();
    }
  },

  _initViews: function () {
    this._renderCarousel();
    this._renderForm();
  },

  _renderCarousel: function () {
    var view = new CarouselFormView({
      collection: this._carouselCollection,
      template: require('../legend-form-types.tpl')
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _renderForm: function () {
    var Klass;
    var type = this._legendType;
    if (type && type !== 'none') {
      Klass = LEGEND_MODEL_TYPE[type];
      this._formModel = new Klass();
      this._bindFormModel();

      this._formView = new FormView({
        formModel: this._formModel
      });

      this.$el.append(this._formView.render().el);
    }
  },

  _bindFormModel: function () {
    this._formModel.on('change', this._onChangeModel, this);
    this.add_related_model(this._formModel);
  },

  _removeFormView: function () {
    if (this._formView) {
      this._formView.remove();
    }
  },

  clean: function () {
    this._removeFormView();
    CoreView.prototype.clean.call(this);
  }
});
