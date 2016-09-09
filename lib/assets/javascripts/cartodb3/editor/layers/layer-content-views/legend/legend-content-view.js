var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var _ = require('underscore');
var CarouselFormView = require('../../../../components/carousel-form-view');
var CarouselCollection = require('../../../../components/custom-carousel/custom-carousel-collection');
var FormView = require('./legend-properties-form');
var CategoryFormModel = require('./form/legend-form-category-model');
var BubbleFormModel = require('./form/legend-form-bubble-model');
var GradientFormModel = require('./form/legend-form-ramp-model');
var CustomFormModel = require('./form/legend-form-custom-model');
var template = require('./legend-content.tpl');

var REQUIRED_OPTS = [
  'legendTypes',
  'layerDefinitionModel'
];

var LEGEND_MODEL_TYPE = {
  'bubble': BubbleFormModel,
  'category': CategoryFormModel,
  'gradient': GradientFormModel,
  'custom': CustomFormModel
};

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

    // new LegendDefinitionModel

    this._carouselCollection = new CarouselCollection(
      _.map(this._legendTypes, function (legend) {
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
    this.$el.html(template());
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
      this._renderForm();
    }
  },

  _initViews: function () {
    this._renderCarousel();
    this._renderForm();
  },

  _renderForm: function () {
    var Klass;
    var view;
    var type = this._legendType;
    if (type && type !== 'none') {
      Klass = LEGEND_MODEL_TYPE[type];
      this._formModel = new Klass({}, {
        layerDefinitionModel: this._layerDefinitionModel
      });
      this._bindFormModel();

      view = new FormView({
        formModel: this._formModel
      });
      this.addView(view);
      this.$('.js-form').html(view.render().el);
    }
  },

  _renderCarousel: function () {
    var view = new CarouselFormView({
      collection: this._carouselCollection,
      template: require('./legend-form-types.tpl')
    });
    this.addView(view);
    this.$('.js-carousel').html(view.render().el);
  },

  _bindFormModel: function () {
    this._formModel.on('change', this._onChangeModel, this);
    this.add_related_model(this._formModel);
  },

  _onChangeModel: function () {
    // LegendDefinitionModel.set(this._formModelset.toJSON())
    console.log(this._formModel.toJSON());
  }
});
