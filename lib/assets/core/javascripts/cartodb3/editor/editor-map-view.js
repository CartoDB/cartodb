var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('../helpers/required-opts');
var EditorView = require('./editor-view');
var AnalysesService = require('./layers/layer-content-views/analyses/analyses-service');
var BasemapContentView = require('./layers/basemap-content-view');
var LayerContentView = require('./layers/layer-content-view');
var EditFeatureContentView = require('./layers/edit-feature-content-view');
var WidgetsFormContentView = require('./widgets/widgets-form/widgets-form-content-view');
var Notifier = require('../components/notifier/notifier');
var WidgetsService = require('./widgets/widgets-service');
var Router = require('../routes/router');

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

  render: function (route) {
    this.clearSubViews();
    this.$el.empty();

    // var stackViewCollection = new Backbone.Collection([{
    //   // TODO: remove
    // }, {
    //   createStackView: function (stackLayoutModel, opts) {
    //     var viewType = opts[1];

    //     switch (viewType) {
    //       // TODO: ongoing replace stacklayout with router
    //       case 'widget-content':
    //         var widgetDefinitionModel = opts[0];
    //         var stackLayoutPrevStep = opts[1];

    //         return new WidgetsFormContentView({
    //           className: 'Editor-content',
    //           modals: self._modals,
    //           userModel: self._userModel,
    //           configModel: self._configModel,
    //           userActions: self._userActions,
    //           widgetDefinitionModel: widgetDefinitionModel,
    //           layerDefinitionsCollection: self._layerDefinitionsCollection,
    //           analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
    //           stackLayoutPrevStep: stackLayoutPrevStep,
    //           stackLayoutModel: stackLayoutModel
    //         });
    //       case 'element-content':
    //         console.log(viewType + 'view is not implemented yet');
    //         break;
    //       default:
    //         console.log(viewType + 'view doesn\'t exist');
    //     }
    //   }
    // }, {
    //   // TODO: remove
    // }]);

    if (!route) return this;

    var routeName = route[0];
    var view = null;
    var selectedTabItem = null;

    if (routeName.indexOf('layer_') === 0) {
      var layerId = route[1];
      var layerDefinitionModel = this._layerDefinitionsCollection.find({ id: layerId });

      if (layerDefinitionModel === undefined) {
        Router.goToLayerList();
        return true;
      }

      var analysisPayload = null;

      switch (routeName) {
        case 'layer_data':
          selectedTabItem = 'data';
          break;
        case 'layer_style':
          selectedTabItem = 'style';
          break;
        case 'layer_analyses':
          selectedTabItem = 'analyses';
          analysisPayload = route[2];
          break;
        case 'layer_popups':
          selectedTabItem = 'popups';
          break;
        case 'layer_legends':
          selectedTabItem = 'legends';
          break;
      }

      view = new LayerContentView({
        className: 'Editor-content',
        userActions: this._userActions,
        userModel: this._userModel,
        layerDefinitionModel: layerDefinitionModel,
        mapDefinitionModel: this._mapDefinitionModel,
        widgetDefinitionsCollection: this._widgetDefinitionsCollection,
        layerDefinitionsCollection: this._layerDefinitionsCollection,
        analysisDefinitionNodesCollection: this._analysisDefinitionNodesCollection,
        legendDefinitionsCollection: this._legendDefinitionsCollection,
        analysis: this._analysis,
        modals: this._modals,
        onboardings: this._onboardings,
        analysisPayload: analysisPayload,
        configModel: this._configModel,
        editorModel: this._editorModel,
        mapModeModel: this._mapModeModel,
        stateDefinitionModel: this._stateDefinitionModel,
        onboardingNotification: this._onboardingNotification,
        visDefinitionModel: this._visDefinitionModel,
        selectedTabItem: selectedTabItem
      });
    } else if (routeName === 'root' || routeName === 'layers') {
      selectedTabItem = 'layers';

      view = new EditorView({
        className: 'Editor-content',
        modals: this._modals,
        userModel: this._userModel,
        userActions: this._userActions,
        configModel: this._configModel,
        editorModel: this._editorModel,
        pollingModel: this._pollingModel,
        mapDefinitionModel: this._mapDefinitionModel,
        visDefinitionModel: this._visDefinitionModel,
        layerDefinitionsCollection: this._layerDefinitionsCollection,
        analysisDefinitionNodesCollection: this._analysisDefinitionNodesCollection,
        widgetDefinitionsCollection: this._widgetDefinitionsCollection,
        mapcapsCollection: this._mapcapsCollection,
        privacyCollection: this._privacyCollection,
        selectedTabItem: selectedTabItem,
        mapModeModel: this._mapModeModel,
        stateDefinitionModel: this._stateDefinitionModel,
        settingsCollection: this._settingsCollection
      });
    } else if (routeName === 'edit_feature') {
      var feature = this._mapModeModel.getFeatureDefinition();

      if (feature) {
        var isFeatureNew = !feature.isNew();

        view = new EditFeatureContentView({
          layerDefinitionModel: layerDefinitionModel,
          configModel: this._configModel,
          mapModeModel: this._mapModeModel,
          editorModel: this._editorModel,
          model: new Backbone.Model({
            hasChanges: false,
            isValidAttributes: true,
            isValidGeometry: isFeatureNew
          }),
          modals: this._modals
        });
      } else {
        // We could instantiate a feature here based on the URL parameters, this is easier for now
        Router.goToPreviousRoute();
      }
    } else if (routeName === 'basemap') {
      view = new BasemapContentView({
        className: 'Editor-content',
        basemaps: this._basemaps,
        layerDefinitionsCollection: this._layerDefinitionsCollection,
        customBaselayersCollection: this._userModel.layers,
        modals: this._modals,
        configModel: this._configModel
      });
    }

    this.$el.append(view.render().$el);
    this.addView(view);

    var notifierView = Notifier.getView();
    this.$el.append(notifierView.render().el);
    this.addView(notifierView);

    this._setServices();

    return this;
  },

  _setServices: function () {
    // AnalysesService.setStackLayoutView(this._stackLayoutView);

    // WidgetsService.setStackLayoutBehaviour(
    //   this._stackLayoutView.model,
    //   {
    //     position: 1,
    //     arguments: 'widget-content'
    //   }, {
    //     position: 0,
    //     arguments: 'widgets'
    //   }
    // );
  },

  _initBinds: function () {
    this.listenTo(this._routeModel, 'change:currentRoute', this._routeChange);
    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);
  },

  handleRoute: function (route) {
    this.render(route);
  },

  _routeChange: function (routeModel) {
    var route = routeModel.get('currentRoute');
    this.handleRoute(route);
  },

  _changeStyle: function () {
    this.$el.toggleClass('is-dark', this._editorModel.isEditing());
  },

  _onAddAnalysisClicked: function () {
    AnalysesService.addAnalysis();
  }
});
