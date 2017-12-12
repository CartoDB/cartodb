var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var _ = require('underscore');
var StyleFormView = require('./style-form/style-form-view');
var StylesFactory = require('./styles-factory');
var CarouselFormView = require('../../components/carousel-form-view');
var CarouselCollection = require('../../components/custom-carousel/custom-carousel-collection');
var styleFormNotReadyTemplate = require('../layers/panel-loading-template.tpl');
var styleFormPlaceholderTemplate = require('./style-form-placeholder.tpl');
var styleSQLErrorTemplate = require('./style-content-sql-error.tpl');
var OverlayView = require('../components/overlay/overlay-view');
var Notifier = require('../../components/notifier/notifier');
var QuerySanity = require('../layers/query-sanity-check');
var actionErrorTemplate = require('../layers/sql-error-action.tpl');
var MetricsTracker = require('../../components/metrics/metrics-tracker');
var checkAndBuildOpts = require('../../helpers/required-opts');
var fetchAllQueryObjectsIfNecessary = require('../../helpers/fetch-all-query-objects');

var STATES = {
  ready: 'ready',
  loading: 'loading',
  fetched: 'fetched',
  error: 'error'
};

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
  'queryRowsCollection',
  'freezeTorgeAggregation',
  'editorModel',
  'modals'
];

module.exports = CoreView.extend({
  module: 'editor/style/style-content-view',

  className: 'Editor-styleContent',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this.render = this.render.bind(this);

    this._initModels();
    this._initBinds();
    this._fetchAllQueryObjectsIfNecessary();

    QuerySanity.track(this, this.render);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    if (this._hasError()) {
      this._renderError();
    } else if (this._isLoading()) {
      this._renderStateless();
    } else if (this._isReady()) {
      if (this._queryGeometryModel.hasValue()) {
        if (this._queryGeometryModel.get('simple_geom') === 'point') {
          this._renderCarousel();
        }

        this._renderForm();
        this._renderOverlay();
      } else {
        this.$el.html(styleFormPlaceholderTemplate());
      }
    }

    return this;
  },

  _hasError: function () {
    return this.modelView.get('state') === STATES.error ||
      this._querySchemaModel.hasRepeatedErrors() ||
      this._queryGeometryModel.hasRepeatedErrors() ||
      this._queryRowsCollection.hasRepeatedErrors();
  },

  _isLoading: function () {
    return this.modelView.get('state') === STATES.loading ||
      !this._querySchemaModel.isFetched() ||
      !this._queryGeometryModel.isFetched() ||
      !this._queryRowsCollection.isFetched();
  },

  _isReady: function () {
    return this.modelView.get('state') === STATES.ready &&
      this._querySchemaModel.isFetched() &&
      this._queryGeometryModel.isFetched() &&
      this._queryRowsCollection.isFetched();
  },

  _getInitialState: function () {
    return STATES.loading;
  },

  _initModels: function () {
    this.modelView = new Backbone.Model({
      state: STATES.loading
    });

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
  },

  _initBinds: function () {
    this.listenTo(this._layerDefinitionModel, 'change:autoStyle', this._onAutoStyleChanged);
    this.listenTo(this.modelView, 'change:state', this._checkEditorModel);
    this.listenTo(this._carouselCollection, 'change:selected', this._onSelectAggregation);

    // Render everything when there is an undo/redo action
    this.listenTo(this._styleModel, 'undo redo', this.render);
    this.listenTo(this._styleModel, 'change', this._onStyleChanged);

    this.listenTo(this._querySchemaModel, 'change:status', this._onStatusChanged);
    this.listenTo(this._queryGeometryModel, 'change:status', this._onStatusChanged);
    this.listenTo(this._queryRowsCollection.statusModel, 'change:status', this._onStatusChanged);
  },

  _fetchAllQueryObjectsIfNecessary: function () {
    fetchAllQueryObjectsIfNecessary({
      queryRowsCollection: this._queryRowsCollection,
      queryGeometryModel: this._queryGeometryModel,
      querySchemaModel: this._querySchemaModel
    });
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

  _onStatusChanged: function (model, status) {
    fetchAllQueryObjectsIfNecessary({
      queryRowsCollection: this._queryRowsCollection,
      queryGeometryModel: this._queryGeometryModel,
      querySchemaModel: this._querySchemaModel
    }, this.render);

    this._checkEditorModel();
  },

  _checkEditorModel: function () {
    var hasGeometry = this._queryGeometryModel.hasValue();
    this._editorModel.set({ disabled: this._hasError() || !hasGeometry });
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

  _renderStateless: function () {
    this.$el.append(
      styleFormNotReadyTemplate()
    );
  },

  _renderOverlay: function () {
    var view = new OverlayView({
      overlayModel: this._overlayModel
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _renderCarousel: function () {
    var view = new CarouselFormView({
      collection: this._carouselCollection,
      template: require('./style-form-types.tpl')
    });
    view.$el.addClass('js-aggregationTypes');
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

      isTorqueType = (styleType === 'heatmap' || styleType === 'animation');

      if (alreadyTorqueLayer && !isTorqueLayer && isTorqueType) {
        this._freezeTorgeAggregation(styleType, currentGeometryType);
      } else {
        var setDefaultProperties = function () {
          var previousType = this._styleModel.get('type');
          this._styleModel.setDefaultPropertiesByType(styleType, currentGeometryType);

          MetricsTracker.track('Aggregated geometries', {
            previus_type: previousType,
            type: styleType
          });
        }.bind(this);

        // If an animated or a heatmap style is selected, we should move the layer to the
        // top, but if it is in the most high position, we shouldn't do anything
        if (isTorqueType && !this._layerDefinitionsCollection.isDataLayerOnTop(this._layerDefinitionModel)) {
          this._moveTorqueLayerToTop(setDefaultProperties);
        } else {
          setDefaultProperties();
        }
      }
    }
  },

  _moveTorqueLayerToTop: function (callback) {
    var notification = Notifier.addNotification({
      status: 'loading',
      info: _t('editor.layers.moveTorqueLayer.loading'),
      closable: true
    });

    this._layerDefinitionsCollection.once('layerMoved', function () {
      callback && callback();
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
    this._styleForm = new StyleFormView({
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      layerDefinitionModel: this._layerDefinitionModel,
      styleModel: this._styleModel,
      configModel: this._configModel,
      userModel: this._userModel,
      queryGeometryModel: this._queryGeometryModel,
      querySchemaModel: this._querySchemaModel,
      modals: this._modals
    });
    this.$el.append(this._styleForm.render().el);
    this.addView(this._styleForm);
  },

  _onStyleChanged: function () {
    this._styleModel.attributes.autogenerated = false;
    this._layerDefinitionModel.save();

    MetricsTracker.track('Modified Style Form', {
      layer_id: this._layerDefinitionModel.get('id'),
      cartocss: this._layerDefinitionModel.get('cartocss'),
      style_properties: this._layerDefinitionModel.get('style_properties')
    });
  }
});
