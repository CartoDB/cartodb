var CoreView = require('backbone/core-view');
var _ = require('underscore');
var CarouselFormView = require('../../../../components/carousel-form-view');
var CarouselCollection = require('../../../../components/custom-carousel/custom-carousel-collection');
var FormView = require('./legend-properties-form');
var CategoryFormModel = require('./form/legend-form-category-model');
var BubbleFormModel = require('./form/legend-form-bubble-model');
var ChoroplethFormModel = require('./form/legend-form-choropleth-model');
var template = require('./legend-content.tpl');
var LegendDefinitionModel = require('../../../../data/legend-definition-model');
var LegendFactory = require('./legend-factory');

var REQUIRED_OPTS = [
  'legendTypes',
  'layerDefinitionModel',
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

    this._legendDefinitionModel = this._getUserLegend(this._legendTypes);
    this._legendType = this._legendDefinitionModel.get('type');

    this._carouselCollection = new CarouselCollection(
      _.map(this._legendTypes, function (legend) {
        return {
          selected: this._legendType === legend.value,
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

  _getUserLegend: function (types) {
    var values = _.map(types, function (type) { return type.value; });
    var selected = this._legendDefinitionsCollection.find(function (legendDefModel) {
      return values.indexOf(legendDefModel.get('type')) !== -1;
    });

    if (selected === undefined) {
      selected = new LegendDefinitionModel(null, {
        layerDefinitionModel: this._layerDefinitionModel
      });
    }

    return selected;
  },

  _initBinds: function () {
    this._carouselCollection.on('change:selected', this._onRenderFromType, this);
    this.add_related_model(this._carouselCollection);
  },

  _onRenderFromType: function (mdl) {
    if (mdl.get('selected') === true) {
      this._legendType = mdl.getValue();
      this._renderForm();
    }

    // Remove legend
    if (mdl.get('selected') === false) {
      LegendFactory.remove(this._legendDefinitionModel);
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
    this._legendDefinitionModel.set(this._formModel.toJSON());
    LegendFactory.add(this._legendDefinitionModel);
  }
});
