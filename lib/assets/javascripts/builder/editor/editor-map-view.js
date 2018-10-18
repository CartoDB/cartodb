var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var EditorView = require('./editor-view');
var AnalysesService = require('./layers/layer-content-views/analyses/analyses-service');
var StackLayoutView = require('builder/components/stack-layout/stack-layout-view');
var BasemapContentView = require('./layers/basemap-content-view');
var LayerContentView = require('./layers/layer-content-view');
var EditFeatureContentView = require('./layers/edit-feature-content-view');
var WidgetsFormContentView = require('./widgets/widgets-form/widgets-form-content-view');
var Notifier = require('builder/components/notifier/notifier');
var Router = require('builder/routes/router');

var REQUIRED_OPTS = [
  'userActions',
  'basemaps',
  'visDefinitionModel',
  'layerDefinitionsCollection',
  'analysisDefinitionNodesCollection',
  'legendDefinitionsCollection',
  'widgetDefinitionsCollection',
  'mapcapsCollection',
  'privacyCollection',
  'modals',
  'onboardings',
  'userModel',
  'configModel',
  'editorModel',
  'pollingModel',
  'mapDefinitionModel',
  'mapModeModel',
  'stateDefinitionModel',
  'onboardingNotification',
  'settingsCollection',
  'routeModel'
];

module.exports = CoreView.extend({
  className: 'MapEditor Editor-panel',

  events: {
    'click .js-add-analysis': '_onAddAnalysisClicked'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    var self = this;

    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        var selectedTabItem = opts[0] || 'layers';

        return new EditorView({
          className: 'Editor-content',
          modals: self._modals,
          userModel: self._userModel,
          userActions: self._userActions,
          configModel: self._configModel,
          editorModel: self._editorModel,
          pollingModel: self._pollingModel,
          mapDefinitionModel: self._mapDefinitionModel,
          visDefinitionModel: self._visDefinitionModel,
          layerDefinitionsCollection: self._layerDefinitionsCollection,
          analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
          widgetDefinitionsCollection: self._widgetDefinitionsCollection,
          mapcapsCollection: self._mapcapsCollection,
          privacyCollection: self._privacyCollection,
          mapStackLayoutModel: stackLayoutModel,
          selectedTabItem: selectedTabItem,
          mapModeModel: self._mapModeModel,
          stateDefinitionModel: self._stateDefinitionModel,
          settingsCollection: self._settingsCollection,
          routeModel: self._routeModel
        });
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        var viewType = opts[1];

        switch (viewType) {
          case 'basemaps':
            return new BasemapContentView({
              className: 'Editor-content',
              basemaps: self._basemaps,
              layerDefinitionsCollection: self._layerDefinitionsCollection,
              stackLayoutModel: stackLayoutModel,
              customBaselayersCollection: self._userModel.layers,
              modals: self._modals,
              configModel: self._configModel
            });
          case 'layer-content':
            var layerDefinitionModel = opts[0];
            var selectedTabItem = opts[2];
            var analysisPayload = opts[3];

            return new LayerContentView({
              className: 'Editor-content',
              userActions: self._userActions,
              userModel: self._userModel,
              layerDefinitionModel: layerDefinitionModel,
              mapDefinitionModel: self._mapDefinitionModel,
              widgetDefinitionsCollection: self._widgetDefinitionsCollection,
              layerDefinitionsCollection: self._layerDefinitionsCollection,
              analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
              legendDefinitionsCollection: self._legendDefinitionsCollection,
              analysis: self._analysis,
              modals: self._modals,
              onboardings: self._onboardings,
              stackLayoutModel: stackLayoutModel,
              analysisPayload: analysisPayload,
              configModel: self._configModel,
              editorModel: self._editorModel,
              mapModeModel: self._mapModeModel,
              stateDefinitionModel: self._stateDefinitionModel,
              onboardingNotification: self._onboardingNotification,
              visDefinitionModel: self._visDefinitionModel,
              selectedTabItem: selectedTabItem
            });
          case 'widget-content':
            var widgetDefinitionModel = opts[0];
            var stackLayoutPrevStep = opts[1];

            return new WidgetsFormContentView({
              className: 'Editor-content',
              modals: self._modals,
              userModel: self._userModel,
              configModel: self._configModel,
              userActions: self._userActions,
              widgetDefinitionModel: widgetDefinitionModel,
              widgetDefinitionsCollection: self._widgetDefinitionsCollection,
              layerDefinitionsCollection: self._layerDefinitionsCollection,
              analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
              stackLayoutPrevStep: stackLayoutPrevStep,
              stackLayoutModel: stackLayoutModel
            });
          case 'element-content':
            console.log(viewType + 'view is not implemented yet');
            break;
          default:
            console.log(viewType + 'view doesn\'t exist');
        }
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        var layerDefinitionModel = opts[0];
        var isValidGeometry = opts[1];

        return new EditFeatureContentView({
          layerDefinitionModel: layerDefinitionModel,
          configModel: self._configModel,
          stackLayoutModel: stackLayoutModel,
          mapModeModel: self._mapModeModel,
          editorModel: self._editorModel,
          model: new Backbone.Model({
            hasChanges: false,
            isValidAttributes: true,
            isValidGeometry: isValidGeometry
          }),
          modals: self._modals
        });
      }
    }]);

    this._stackLayoutView = new StackLayoutView({
      className: 'Editor-content',
      collection: stackViewCollection
    });

    this.$el.append(this._stackLayoutView.render().$el);
    this.addView(this._stackLayoutView);

    var notifierView = Notifier.getView();
    this.$el.append(notifierView.render().el);
    this.addView(notifierView);

    this._setServices();

    return this;
  },

  _setServices: function () {
    AnalysesService.setStackLayoutView(this._stackLayoutView);
  },

  _initBinds: function () {
    this.listenTo(this._routeModel, 'change:currentRoute', this._handleRoute);
    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);
  },

  // Required to receive external route from parent
  handleRoute: function (routeModel) {
    this._handleRoute(routeModel);
  },

  _handleRoute: function (routeModel) {
    var currentRoute = routeModel.get('currentRoute');
    var routeName = currentRoute[0];

    if (routeName.indexOf('layer_') === 0) {
      var layerId = currentRoute[1];
      var layerDefinitionModel = this._layerDefinitionsCollection.find({ id: layerId });

      if (layerDefinitionModel === undefined) {
        Router.goToLayerList();
        return true;
      }

      var args = [1, layerDefinitionModel, 'layer-content'];
      switch (routeName) {
        case 'layer_data':
          args.push('data');
          break;
        case 'layer_style':
          args.push('style');
          break;
        case 'layer_analyses':
          args.push('analyses');
          args.push(currentRoute[2]);
          break;
        case 'layer_popups':
          args.push('popups');
          break;
        case 'layer_legends':
          args.push('legends');
          break;
      }

      this._stackLayoutView.model.goToStep.apply(this._stackLayoutView.model, args);
      return true;
    } else if (routeName === 'widget') {
      var widgetId = currentRoute[1];
      var widgetDefinitionModel = this._widgetDefinitionsCollection.find({ id: widgetId });

      if (widgetDefinitionModel === undefined) {
        Router.goToWidgetList();
        return true;
      }

      this._stackLayoutView.model.goToStep(1, widgetDefinitionModel, 'widget-content');
      return true;
    } else if (routeName === 'root' || routeName === 'layers' || routeName === 'widgets') {
      this._stackLayoutView.model.goToStep(0, routeName);
      return true;
    } else if (routeName === 'edit_feature') {
      var feature = this._mapModeModel.getFeatureDefinition();

      if (feature) {
        var isFeatureNew = !feature.isNew();
        this._stackLayoutView.model.goToStep(2, this._layerDefinitionsCollection.find({ id: currentRoute[1] }), isFeatureNew);
      } else {
        // We could instantiate a feature here based on the URL parameters, this is easier for now
        Router.goToPreviousRoute({
          options: { replace: true }
        });
      }
    } else if (routeName === 'basemap') {
      this._stackLayoutView.model.goToStep(1, null, 'basemaps');
      return true;
    }

    return false;
  },

  _changeStyle: function () {
    this.$el.toggleClass('is-dark', this._editorModel.isEditing());
  },

  _onAddAnalysisClicked: function () {
    AnalysesService.addAnalysis();
  }
});
