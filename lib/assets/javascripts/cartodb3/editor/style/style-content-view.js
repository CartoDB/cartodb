var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var _ = require('underscore');
var StyleFormView = require('./style-form/style-form-view');
var StylesFactory = require('./styles-factory');
var CarouselFormView = require('../../components/carousel-form-view');
var CarouselCollection = require('../../components/custom-carousel/custom-carousel-collection');
var styleFormNotReadyTemplate = require('./style-form-not-ready.tpl');
var styleFormPlaceholderTemplate = require('./style-form-placeholder.tpl');
var styleSQLErrorTemplate = require('./style-content-sql-error.tpl');
var OverlayView = require('../components/overlay/overlay-view');
var Notifier = require('../../components/notifier/notifier');
var QuerySanity = require('../layers/query-sanity-check');
var actionErrorTemplate = require('../layers/sql-error-action.tpl');
var MetricsTracker = require('../../components/metrics/metrics-tracker');

var STATES = {
  ready: 'ready',
  loading: 'loading',
  fetched: 'fetched',
  error: 'error'
};

module.exports = CoreView.extend({

  className: 'Editor-styleContent',

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layersDefinitionCollection is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.styleModel) throw new Error('styleModel is required');
    if (!opts.overlayModel) throw new Error('overlayModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.queryGeometryModel) throw new Error('queryGeometryModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');

    if (!opts.modals) throw new Error('modals is required');
    if (!opts.freezeTorgeAggregation) throw new Error('freezeTorgeAggregation is required');

    this._configModel = opts.configModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._userActions = opts.userActions;
    this._styleModel = opts.styleModel;
    this._overlayModel = opts.overlayModel;
    this._modals = opts.modals;
    this._queryGeometryModel = opts.queryGeometryModel;
    this._querySchemaModel = opts.querySchemaModel;
    this._freezeTorgeAggregation = opts.freezeTorgeAggregation;
    this._editorModel = opts.editorModel;

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
          }
        };
      }, this)
    );

    this._initBinds();

    if (this._querySchemaModel.shouldFetch()) {
      this._querySchemaModel.fetch();
    }
    if (this._queryGeometryModel.shouldFetch()) {
      this._queryGeometryModel.fetch();
    }

    QuerySanity.track(this, this.render.bind(this));
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
    return this.modelView.get('state') === STATES.error;
  },

  _isLoading: function () {
    return this.modelView.get('state') === STATES.loading;
  },

  _isReady: function () {
    return this.modelView.get('state') === STATES.ready;
  },

  _getInitialState: function () {
    return STATES.loading;
  },

  _initBinds: function () {
    this._carouselCollection.on('change:selected', this._onSelectAggregation, this);
    this.add_related_model(this._carouselCollection);

    this.modelView.on('change:state', this._checkEditorModel, this);
    this.add_related_model(this.modelView);

    // Render everything when there is an undo/redo action
    this._styleModel.bind('undo redo', this.render, this);
    this._styleModel.bind('change', this._onStyleChange, this);
    this.add_related_model(this._styleModel);

    this._querySchemaModel.bind('change:status', this._onStatusChanged, this);
    this._queryGeometryModel.bind('change:status', this._onStatusChanged, this);
    this.add_related_model(this._querySchemaModel);
    this.add_related_model(this._queryGeometryModel);
  },

  _onStatusChanged: function () {
    if (this._querySchemaModel.get('status') === 'fetched' &&
        this._queryGeometryModel.get('status') === 'fetched') {
      this.render();
    }

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
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _onSelectAggregation: function (mdl) {
    var alreadyTorqueLayer = this._layerDefinitionsCollection.isThereAnyTorqueLayer();
    var isTorqueLayer = this._layerDefinitionModel.get('type') === 'torque';

    var styleType;
    var isTorqueType;
    var currentGeometryType;

    if (mdl.get('selected')) {
      styleType = mdl.getValue();
      currentGeometryType = this._queryGeometryModel.get('simple_geom');

      isTorqueType = (styleType === 'heatmap' || styleType === 'animation');

      if (alreadyTorqueLayer && !isTorqueLayer && isTorqueType) {
        this._freezeTorgeAggregation(styleType, currentGeometryType);
      } else {
        var setDefaultProperties = function () {
          this._styleModel.setDefaultPropertiesByType(styleType, currentGeometryType);
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
      queryGeometryModel: this._queryGeometryModel,
      querySchemaModel: this._querySchemaModel
    });
    this.$el.append(this._styleForm.render().el);
    this.addView(this._styleForm);
  },

  _onStyleChange: function () {
    this._styleModel.attributes.autogenerated = false;
    this._layerDefinitionModel.attributes.cartocss_custom = false;
    this._layerDefinitionModel.save();

    MetricsTracker.track('Modified Style Form', {
      layer_id: this._layerDefinitionModel.get('id'),
      cartocss: this._layerDefinitionModel.get('cartocss'),
      style_properties: this._layerDefinitionModel.get('style_properties')
    });
  }
});
