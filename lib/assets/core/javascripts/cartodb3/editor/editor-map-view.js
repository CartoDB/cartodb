var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('../helpers/required-opts');
var EditorView = require('./editor-view');
var AnalysesService = require('./layers/layer-content-views/analyses/analyses-service');
var StackLayoutView = require('../components/stack-layout/stack-layout-view');
var BasemapContentView = require('./layers/basemap-content-view');
var LayerContentView = require('./layers/layer-content-view');
var EditFeatureContentView = require('./layers/edit-feature-content-view');
var WidgetsFormContentView = require('./widgets/widgets-form/widgets-form-content-view');
var Notifier = require('../components/notifier/notifier');
var WidgetsService = require('./widgets/widgets-service');

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
  'onboardingNotification'
];

module.exports = CoreView.extend({
  className: 'MapEditor Editor-panel',

  events: {
    'click .js-add-analysis': '_onAddAnalysisClicked',
    'click .js-georeference': '_onGeoreferenceClicked'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
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
          onboardingNotification: self._onboardingNotification
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

    WidgetsService.setStackLayoutBehaviour(
      this._stackLayoutView.model,
      {
        position: 1,
        arguments: 'widget-content'
      }, {
        position: 0,
        arguments: 'widgets'
      }
    );
  },

  _initBinds: function () {
    this._editorModel.on('change:edition', this._changeStyle, this);
    this.add_related_model(this._editorModel);

    this._mapModeModel.on('change:mode', this._onMapModeChanged, this);
    this.add_related_model(this._mapModeModel);
  },

  _onMapModeChanged: function (mapModeModel) {
    var stackLayoutModel = this._stackLayoutView.model;

    if (mapModeModel.isEditingFeatureMode() || mapModeModel.isDrawingFeatureMode()) {
      var feature = mapModeModel.getFeatureDefinition();
      stackLayoutModel.goToStep(2, feature.getLayerDefinition(), !feature.isNew());
    } else {
      stackLayoutModel.goBack();
    }
  },

  _changeStyle: function () {
    this.$el.toggleClass('is-dark', this._editorModel.isEditing());
  },

  _onAddAnalysisClicked: function () {
    AnalysesService.addAnalysis();
  },

  _onGeoreferenceClicked: function () {
    AnalysesService.addGeoreferenceAnalysis();
  }

});
