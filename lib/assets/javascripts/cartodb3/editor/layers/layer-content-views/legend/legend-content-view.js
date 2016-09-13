var CoreView = require('backbone/core-view');
var _ = require('underscore');
var CarouselFormView = require('../../../../components/carousel-form-view');
var CarouselCollection = require('../../../../components/custom-carousel/custom-carousel-collection');
var FormView = require('./legend-properties-form');
var CategoryFormModel = require('../../../../data/legends/legend-category-definition-model');
var BubbleFormModel = require('../../../../data/legends/legend-bubble-definition-model');
var ChoroplethFormModel = require('../../../../data/legends/legend-choropleth-definition-model');
var template = require('./legend-content.tpl');
var LegendFactory = require('./legend-factory');

var REQUIRED_OPTS = [
  'legendTypes',
  'layerDefinitionModel',
  'legendDefinitionModel',
  'legendDefinitionsCollection'
];

var LEGEND_MODEL_TYPE = {
  'bubble': BubbleFormModel,
  'category': CategoryFormModel,
  'choropleth': ChoroplethFormModel
};

module.exports = CoreView.extend({

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    var type = this._legendDefinitionModel.get('type');

    this._carouselCollection = new CarouselCollection(
      _.map(this._legendTypes, function (legend) {
        return {
          selected: type === legend.value,
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
    this._carouselCollection.on('change:selected', this._onCarouselChange, this);
    this.add_related_model(this._carouselCollection);
  },

  _onCarouselChange: function (mdl) {
    var type = mdl.getValue();
    var model;

    if (mdl.get('selected') === true) {
      this._updateModelForForm(type);
      this._renderForm(type);
    }

    // Remove legend
    if (mdl.get('selected') === false && type !== 'none') {
      model = LegendFactory.removeLegend(this._layerDefinitionModel, type);
      this._unBindLegendModel(model);
    }
  },

  _initViews: function () {
    var type = this._legendDefinitionModel.get('type');
    this._renderCarousel();
    this._renderForm(type);
  },

  _updateModelForForm: function (type) {
    var Klass;
    if (type && type !== 'none') {
      Klass = LEGEND_MODEL_TYPE[type];
      this._legendDefinitionModel = new Klass({}, {
        layerDefinitionModel: this._layerDefinitionModel
      });

      this._bindFormModel(this._legendDefinitionModel);
    }
  },

  _renderForm: function (type) {
    var view;
    if (type && type !== 'none') {
      view = new FormView({
        formModel: this._legendDefinitionModel
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

  _bindFormModel: function (model) {
    model.on('change', this._onChangeModel, this);
    this.add_related_model(model);
  },

  _unBindLegendModel: function (model) {
    model.off('change', this._onChangeModel, this);
  },

  _onChangeModel: function () {
    LegendFactory.add(this._legendDefinitionModel);
  }
});
