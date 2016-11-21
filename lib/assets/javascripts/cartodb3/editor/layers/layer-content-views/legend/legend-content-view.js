var CoreView = require('backbone/core-view');
var _ = require('underscore');
var CarouselFormView = require('../../../../components/carousel-form-view');
var CarouselCollection = require('../../../../components/custom-carousel/custom-carousel-collection');
var OverlayView = require('../../../../editor/components/overlay/overlay-view');
var FormView = require('./legend-properties-form');

var CustomFormModel = require('./form/legend-custom-definition-form-model');
var CategoryFormModel = require('./form/legend-category-definition-form-model');
var BubbleFormModel = require('./form/legend-bubble-definition-form-model');
var ChoroplethFormModel = require('./form/legend-choropleth-definition-form-model');
var CustomChoroplethFormModel = require('./form/legend-custom-choropleth-definition-form-model');

var template = require('./legend-content.tpl');
var LegendFactory = require('./legend-factory');

var DEBOUNCE_TIME = 350;

var REQUIRED_OPTS = [
  'editorModel',
  'legendTypes',
  'updateLegend',
  'overlayModel',
  'layerDefinitionModel',
  'legendDefinitionModel',
  'legendDefinitionsCollection',
  'type'
];

var LEGEND_MODEL_TYPE = {
  bubble: BubbleFormModel,
  custom: CustomFormModel,
  category: CategoryFormModel,
  choropleth: ChoroplethFormModel,
  custom_choropleth: CustomChoroplethFormModel
};

module.exports = CoreView.extend({

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    var type = this._legendDefinitionModel.get('type');

    this._onDebouncedChange = _.debounce(this._updateChanges.bind(this), DEBOUNCE_TIME);

    this._createFormModel(type);

    var styleModel = this._layerDefinitionModel.styleModel;
    this._carouselCollection = new CarouselCollection(
      _.chain(this._legendTypes).filter(function (legend) {
        return legend.isStyleCompatible ? legend.isStyleCompatible(styleModel) : true;
      }, this).map(function (legend) {
        return {
          selected: type === legend.value,
          val: legend.value,
          label: legend.label,
          template: function () {
            return (legend.legendIcon && legend.legendIcon()) || legend.value;
          }
        };
      }, this).value()
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

  _createFormModel: function (type) {
    var Klass;
    var attrs;

    if (this._formModel) {
      this._unBindFormModel(this._formModel);
      delete this._formModel;
    }

    if (type && type !== 'none') {
      Klass = LEGEND_MODEL_TYPE[type];
      attrs = this._pickAttrs(this._legendDefinitionModel);
      this._formModel = new Klass(attrs, {
        legendDefinitionModel: this._legendDefinitionModel
      });

      this._bindFormModel(this._formModel);
    }
  },

  _pickAttrs: function (legendDefinitionModel) {
    var attrs = _.pick(legendDefinitionModel.attributes, 'title', 'prefix', 'suffix', 'leftLabel', 'rightLabel', 'items');
    return attrs;
  },

  _initBinds: function () {
    this._carouselCollection.on('change:selected', this._onCarouselChange, this);
    this.add_related_model(this._carouselCollection);
  },

  _onCarouselChange: function (mdl) {
    var type = mdl.getValue();

    if (mdl.get('selected') === true) {
      this._updateLegendModel(type);
      this._createFormModel(type);
      this._renderForm(type);
      this._updateToggle(type);
    }

    // Remove legend
    if (mdl.get('selected') === false && type !== 'none') {
      LegendFactory.removeLegend(this._layerDefinitionModel, type);
    }
  },

  _initViews: function () {
    var type = this._legendDefinitionModel.get('type');
    this._renderCarousel();
    this._renderForm(type);
    this._renderOverlay();
    this._updateToggle(type);
  },

  _renderOverlay: function () {
    var view = new OverlayView({
      overlayModel: this._overlayModel
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _updateLegendModel: function (type) {
    if (type && type !== 'none') {
      LegendFactory.enableLegend(this._type);
      this._legendDefinitionModel = LegendFactory.createLegend(this._layerDefinitionModel, type);
      this._updateLegend(this._legendDefinitionModel);
    } else {
      LegendFactory.disableLegend(this._type);
      this._updateLegend(null);
      delete this._legendDefinitionModel;
    }
  },

  _renderForm: function (type) {
    this._removeForm();

    if (type && type !== 'none') {
      this._addForm();
    }
  },

  _addForm: function () {
    this._formView = new FormView({
      formModel: this._formModel
    });
    this.addView(this._formView);
    this.$('.js-form').html(this._formView.render().el);
  },

  _removeForm: function () {
    if (this._formView) {
      this.removeView(this._formView);
      this._formView.clean();
    }
  },

  _updateToggle: function (type) {
    var isDisabled = type === 'none';
    this._editorModel.set({disabled: isDisabled});
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
    if (model) {
      model.on('change', this._onDebouncedChange, this);
      this.add_related_model(model);
    }
  },

  _unBindFormModel: function (model) {
    model && model.off('change', this._onDebouncedChange, this);
  },

  _updateChanges: function () {
    if (this._legendDefinitionModel) {
      this._legendDefinitionModel.set(this._formModel.toJSON());
      LegendFactory.createLegend(this._layerDefinitionModel, this._legendDefinitionModel.get('type'));
    }
  }
});
