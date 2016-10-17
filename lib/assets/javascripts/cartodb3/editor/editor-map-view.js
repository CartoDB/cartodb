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

module.exports = CoreView.extend({
  className: 'MapEditor Editor-panel',

  events: {
    'click .js-add-analysis': '_onAddAnalysisClicked'
  },

  initialize: function (opts) {
    if (!opts.basemaps) throw new Error('basemaps is required');
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.legendDefinitionsCollection) throw new Error('legendDefinitionsCollection is required');
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    if (!opts.mapcapsCollection) throw new Error('mapcapsCollection is required');
    if (!opts.privacyCollection) throw new Error('privacyCollection is required');

    if (!opts.modals) throw new Error('modals is required');
    if (!opts.onboardings) throw new Error('onboardings is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.pollingModel) throw new Error('pollingModel is required');

    this._userActions = opts.userActions;
    this._modals = opts.modals;
    this._onboardings = opts.onboardings;
    this._userModel = opts.userModel;
    this._vis = opts.vis;
    this._configModel = opts.configModel;
    this._basemaps = opts.basemaps;
    this._visDefinitionModel = opts.visDefinitionModel;
    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this._mapcapsCollection = opts.mapcapsCollection;
    this._privacyCollection = opts.privacyCollection;
    this._legendDefinitionsCollection = opts.legendDefinitionsCollection;

    this._editorModel = opts.editorModel;
    this._pollingModel = opts.pollingModel;

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
          selectedTabItem: selectedTabItem
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
              editorModel: self._editorModel
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
        var cdbid = opts[1].cdbid;
        var thegeom = opts[1].thegeom;

        this._featureModel = new Backbone.Model();
        if (cdbid) {
          this._featureModel.set('cartodb_id', cdbid);
        }
        if (thegeom) {
          this._featureModel.set('the_geom', thegeom);
        }

        return new EditFeatureContentView({
          userActions: self._userActions,
          className: 'Editor-content',
          layerDefinitionModel: layerDefinitionModel,
          configModel: self._configModel,
          stackLayoutModel: stackLayoutModel,
          featureModel: this._featureModel
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
