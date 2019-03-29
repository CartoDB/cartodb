var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');

var StyleFormView = require('./style-form/style-form-view');
var StylesFactory = require('./styles-factory');
var CarouselFormView = require('builder/components/carousel-form-view');
var CarouselCollection = require('builder/components/custom-carousel/custom-carousel-collection');
var Notifier = require('builder/components/notifier/notifier');
var MetricsTracker = require('builder/components/metrics/metrics-tracker');
var MetricsTypes = require('builder/components/metrics/metrics-types');

var StyleConstants = require('builder/components/form-components/_constants/_style');

var styleSQLErrorTemplate = require('./style-content-sql-error.tpl');
var actionErrorTemplate = require('builder/editor/layers/sql-error-action.tpl');
var layerTabMessageTemplate = require('builder/editor/layers/layer-tab-message.tpl');

var checkAndBuildOpts = require('builder/helpers/required-opts');

var EXTRA_STYLE_PROPERTIES = [
  'fillSize',
  'fillColor',
  'strokeSize',
  'strokeColor'
];

var EXTRA_LABELS_STYLE_PROPERTIES = [
  'fillSize',
  'fillColor',
  'haloSize',
  'haloColor'
];

var REQUIRED_OPTS = [
  'configModel',
  'layerDefinitionsCollection',
  'userModel',
  'layerDefinitionModel',
  'userActions',
  'styleModel',
  'overlayModel',
  'queryGeometryModel',
  'querySchemaModel',
  'freezeTorgeAggregation',
  'editorModel',
  'modals',
  'layerContentModel'
];

module.exports = CoreView.extend({
  module: 'editor/style/style-content-view',

  className: 'Editor-styleContent',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initViewState();
    this._buildAggregationCarouselCollection();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._isErrored()) {
      this._renderError();
    } else if (this._viewState.get('isDataFiltered')) {
      this._renderFilteredData();
    } else {
      this._initViews();
    }

    this._toggleOverlay();
    return this;
  },

  _initViewState: function () {
    this._viewState = new Backbone.Model({
      isDataFiltered: false
    });

    this._setViewValues();
  },

  _buildAggregationCarouselCollection: function () {
    if (this._carouselCollection) {
      this.stopListening(this._carouselCollection, 'change:selected');
    }
    this._carouselCollection = new CarouselCollection(
      _.map(StylesFactory.getStyleTypes(this._styleModel.get('type'), this._queryGeometryModel.get('simple_geom')), function (type) {
        return {
          selected: this._styleModel.get('type') === type.value,
          val: type.value,
          label: type.label,
          template: function () {
            return (type.iconTemplate && type.iconTemplate()) || type.value;
          },
          tooltip: type.tooltip
        };
      }, this)
    );
    this.listenTo(this._carouselCollection, 'change:selected', this._onSelectAggregation);

    return this._carouselCollection;
  },

  _initBinds: function () {
    this.listenTo(this._layerDefinitionModel, 'change:autoStyle', this._onAutoStyleChanged);
    this.listenTo(this._layerDefinitionModel, 'change', this._onStyleChanged);
    this.listenTo(this._styleModel, 'change:fill', this._onStyleChanged);
    this.listenTo(this._styleModel, 'change:labels', this._onStyleLabelChanged);
    this.listenTo(this._styleModel, 'undo redo', this.render);
    this.listenTo(this._layerContentModel, 'change:state', this._setViewValues);
    this.listenTo(this._layerContentModel, 'change:state', this._checkEditorModel);
    this.listenTo(this._overlayModel, 'change:visible', this._toggleOverlay);
    this.listenTo(this._viewState, 'change:isDataFiltered', this.render);
  },

  _initViews: function () {
    if (this._queryGeometryModel.get('simple_geom') === 'point') {
      this._renderCarousel();
    }

    this._renderForm();
  },

  _toggleOverlay: function () {
    var isDisabled = this._overlayModel.get('visible');
    this.$el.toggleClass('is-disabled', isDisabled);
  },

  _isErrored: function () {
    return this._layerContentModel.isErrored();
  },

  _onAutoStyleChanged: function (layerDefModel) {
    var isAutoStyleApplied = layerDefModel.get('autoStyle');

    if (!isAutoStyleApplied) {
      this.render();
    } else {
      this._styleModel.unbind('change', this._onStyleChanged, this);
      this._styleModel.once('change', function () {
        this.render();
        this._styleModel.bind('change', this._onStyleChanged, this);
      }, this);
    }
  },

  _checkEditorModel: function () {
    this._queryGeometryModel.hasValueAsync()
      .then(function (hasGeometry) {
        this._editorModel.set({ disabled: this._isErrored() || !hasGeometry });
      }.bind(this));
  },

  _renderError: function () {
    this.$el.append(
      styleSQLErrorTemplate({
        body: _t('editor.error-query.body', {
          action: actionErrorTemplate({
            label: _t('editor.error-query.label')
          })
        })
      })
    );
  },

  _renderFilteredData: function () {
    this.$el.append(
      layerTabMessageTemplate({
        message: _t('editor.layers.warnings.no-data.message'),
        action: _t('editor.layers.warnings.no-data.action-message')
      })
    );
  },

  _renderCarousel: function () {
    var view = new CarouselFormView({
      collection: this._buildAggregationCarouselCollection(),
      template: require('./style-form-types.tpl')
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _onSelectAggregation: function (model) {
    var alreadyTorqueLayer = this._layerDefinitionsCollection.isThereAnyTorqueLayer();
    var isTorqueLayer = this._layerDefinitionModel.get('type') === 'torque';

    var styleType;
    var isTorqueType;
    var currentGeometryType;

    if (model.get('selected')) {
      styleType = model.getValue();
      currentGeometryType = this._queryGeometryModel.get('simple_geom');

      isTorqueType = (styleType === StyleConstants.Type.HEATMAP || styleType === StyleConstants.Type.ANIMATION);

      if (alreadyTorqueLayer && !isTorqueLayer && isTorqueType) {
        this._freezeTorgeAggregation(styleType, currentGeometryType);
      } else {
        // If an animated or a heatmap style is selected, we should move the layer to the
        // top, but if it is in the most high position, we shouldn't do anything
        if (isTorqueType && !this._layerDefinitionsCollection.isDataLayerOnTop(this._layerDefinitionModel)) {
          this._moveTorqueLayerToTop(function () {
            this._setDefaultProperties(styleType, currentGeometryType);
          }.bind(this));
        } else {
          this._setDefaultProperties(styleType, currentGeometryType, false /* silently */);
        }
      }
    }
  },

  _setDefaultProperties: function (styleType, currentGeometryType, silently) {
    var previousType = this._styleModel.get('type');
    this._styleModel.setDefaultPropertiesByType(styleType, currentGeometryType, silently);

    MetricsTracker.track(MetricsTypes.AGGREGATED_GEOMETRIES, {
      previous_agg_type: previousType,
      agg_type: styleType
    });
  },

  _moveTorqueLayerToTop: function (callback) {
    var notification = Notifier.addNotification({
      status: 'loading',
      info: _t('editor.layers.moveTorqueLayer.loading'),
      closable: true
    });

    this._layerDefinitionsCollection.once('layerMoved', function () {
      if (callback) { callback(); }

      notification.set({
        status: 'success',
        info: _t('editor.layers.moveTorqueLayer.success'),
        delay: Notifier.DEFAULT_DELAY
      });
    }, this);

    this._userActions.moveLayer({
      from: this._layerDefinitionModel.get('order'),
      to: this._layerDefinitionsCollection.getTopDataLayerIndex()
    });
  },

  _renderForm: function () {
    if (this._querySchemaModel.get('query')) {
      var view = new StyleFormView({
        layerDefinitionsCollection: this._layerDefinitionsCollection,
        layerDefinitionModel: this._layerDefinitionModel,
        styleModel: this._styleModel,
        configModel: this._configModel,
        userModel: this._userModel,
        queryGeometryModel: this._queryGeometryModel,
        querySchemaModel: this._querySchemaModel,
        modals: this._modals
      });
      this.$el.append(view.render().el);
      this.addView(view);
    }
  },

  _onStyleChanged: function () {
    this._styleModel.set('autogenerated', false);
    this._unsetExtraStyleProperties();
    this._layerDefinitionModel.save();

    MetricsTracker.track(MetricsTypes.MODIFIED_STYLE_FORM, {
      layer_id: this._layerDefinitionModel.get('id'),
      cartocss: this._layerDefinitionModel.get('cartocss'),
      style_properties: this._layerDefinitionModel.get('style_properties')
    });
  },

  _unsetExtraStyleProperties: function () {
    EXTRA_STYLE_PROPERTIES.forEach(function (property) {
      this._styleModel.unset(property, { silent: true });
    }.bind(this));
  },

  _onStyleLabelChanged: function () {
    var labels = this._styleModel.get('labels');

    EXTRA_LABELS_STYLE_PROPERTIES.forEach(function (property) {
      delete labels[property];
    });

    this._styleModel.set('labels', labels, { silent: true });
  },

  _setViewValues: function () {
    this._layerDefinitionModel.isDataFiltered()
      .then(function (isDataFiltered) {
        this._viewState.set('isDataFiltered', isDataFiltered);
      }.bind(this));
  }
});
