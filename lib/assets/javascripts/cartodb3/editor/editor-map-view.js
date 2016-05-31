var Backbone = require('backbone');
var cdb = require('cartodb.js');
var EditorView = require('./editor-view');
var AddAnalysisView = require('../components/modals/add-analysis/add-analysis-view');
var StackLayoutView = require('../components/stack-layout/stack-layout-view');
var LayerContentView = require('./layers/layer-content-view');
var WidgetsFormContentView = require('./widgets/widgets-form/widgets-form-content-view');

module.exports = cdb.core.View.extend({
  className: 'MapEditor',

  events: {
    'click .js-add-analysis': '_onAddAnalysisClicked'
  },

  initialize: function (opts) {
    if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    if (!opts.analysis) throw new Error('analysis is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');

    this._analysis = opts.analysis;
    this._modals = opts.modals;
    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this._visDefinitionModel = opts.visDefinitionModel;
    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this._editorModel = opts.editorModel;
  },

  render: function () {
    var self = this;

    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        var selectedTabItem = opts[0] || 'layers';
        return new EditorView({
          className: 'Editor-panel',
          modals: self._modals,
          analysis: self._analysis,
          userModel: self._userModel,
          configModel: self._configModel,
          editorModel: self._editorModel,
          visDefinitionModel: self._visDefinitionModel,
          layerDefinitionsCollection: self._layerDefinitionsCollection,
          analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
          widgetDefinitionsCollection: self._widgetDefinitionsCollection,
          mapStackLayoutModel: stackLayoutModel,
          selectedTabItem: selectedTabItem
        });
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        var viewType = opts[1];
        switch (viewType) {
          case 'layer-content':
            var layerDefinitionModel = opts[0];
            var analysisPayload = opts[2];

            return new LayerContentView({
              className: 'Editor-panel',
              layerDefinitionModel: layerDefinitionModel,
              layerDefinitionsCollection: self._layerDefinitionsCollection,
              analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
              analysis: self._analysis,
              modals: self._modals,
              stackLayoutModel: stackLayoutModel,
              analysisPayload: analysisPayload,
              configModel: self._configModel,
              editorModel: self._editorModel
            });
          case 'widget-content':
            var widgetDefinitionModel = opts[0];
            return new WidgetsFormContentView({
              className: 'Editor-panel',
              widgetDefinitionModel: widgetDefinitionModel,
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
    }]);

    this._stackLayoutView = new StackLayoutView({
      collection: stackViewCollection
    });

    this.$el.append(this._stackLayoutView.render().$el);
    this.addView(this._stackLayoutView);

    return this;
  },

  _onAddAnalysisClicked: function (ev) {
    var layerId = ev.currentTarget && ev.currentTarget.dataset.layerId;
    if (!layerId) throw new Error('missing data-layer-id on element to open add-analysis modal, the element was: ' + ev.currentTarget.outerHTML);

    var layerDefinitionModel = this._layerDefinitionsCollection.get(layerId);
    if (!layerDefinitionModel) throw new Error('no layer-definition found for id' + layerId + ', available layer ids are: ' + this._layerDefinitionsCollection.pluck('id') + ')');

    this._modals.create(function (modalModel) {
      return new AddAnalysisView({
        modalModel: modalModel,
        analysisDefinitionNodeModel: layerDefinitionModel.getAnalysisDefinitionNodeModel()
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
