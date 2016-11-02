var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var EditorView = require('./editor-view');
var AddAnalysisView = require('../components/modals/add-analysis/add-analysis-view');
var StackLayoutView = require('../components/stack-layout/stack-layout-view');
var BasemapContentView = require('./layers/basemap-content-view');
var LayerContentView = require('./layers/layer-content-view');
var EditFeatureContentView = require('./layers/edit-feature-content-view');
var WidgetsFormContentView = require('./widgets/widgets-form/widgets-form-content-view');
var Notifier = require('../components/notifier/notifier');

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
  'mapModeModel'
];

module.exports = CoreView.extend({
  className: 'MapEditor Editor-panel',

  events: {
    'click .js-add-analysis': '_onAddAnalysisClicked'
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

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
          mapModeModel: self._mapModeModel
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
              modals: self._modals
            });
          case 'layer-content':
            var layerDefinitionModel = opts[0];
            var analysisPayload = opts[2];

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
              mapModeModel: self._mapModeModel
            });
          case 'widget-content':
            var widgetDefinitionModel = opts[0];

            return new WidgetsFormContentView({
              className: 'Editor-content',
              modals: self._modals,
              userActions: self._userActions,
              widgetDefinitionModel: widgetDefinitionModel,
              layerDefinitionsCollection: self._layerDefinitionsCollection,
              analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
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

        return new EditFeatureContentView({
          layerDefinitionModel: layerDefinitionModel,
          configModel: self._configModel,
          stackLayoutModel: stackLayoutModel,
          mapModeModel: self._mapModeModel,
          editorModel: self._editorModel,
          model: new Backbone.Model({
            hasChanges: false
          })
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

    return this;
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
      stackLayoutModel.goToStep(2, feature.getLayerDefinition());
    } else {
      stackLayoutModel.goBack();
    }
  },

  _changeStyle: function () {
    this.$el.toggleClass('is-dark', this._editorModel.isEditing());
  },

  _onAddAnalysisClicked: function (ev) {
    this._onboardings.destroy();

    var layerId = ev.currentTarget && ev.currentTarget.dataset.layerId;
    if (!layerId) throw new Error('missing data-layer-id on element to open add-analysis modal, the element was: ' + ev.currentTarget.outerHTML);

    var layerDefinitionModel = this._layerDefinitionsCollection.get(layerId);
    if (!layerDefinitionModel) throw new Error('no layer-definition found for id' + layerId + ', available layer ids are: ' + this._layerDefinitionsCollection.pluck('id') + ')');

    var generateAnalysisOptions = this._userModel.featureEnabled('generate_analysis_options');

    this._modals.create(function (modalModel) {
      return new AddAnalysisView({
        generateAnalysisOptions: generateAnalysisOptions,
        modalModel: modalModel,
        layerDefinitionModel: layerDefinitionModel
      });
    });
    this._modals.onDestroyOnce(function (analysisFormAttrs) {
      if (analysisFormAttrs) {
        // A analysis option was seleted, redirect to layer-content view with new attrs
        this._stackLayoutView.model.goToStep(1, layerDefinitionModel, 'layer-content', analysisFormAttrs);
      }
    }, this);
  }

});
