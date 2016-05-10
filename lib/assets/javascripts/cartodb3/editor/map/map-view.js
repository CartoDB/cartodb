var Backbone = require('backbone');
var cdb = require('cartodb.js');
var EditorView = require('../editor-view');
var StackLayoutView = require('../../components/stack-layout/stack-layout-view');
var WidgetsFormContentView = require('../widgets/widgets-form/widgets-form-content-view');
var LayerContentView = require('../layers/layer-content-view');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.analysisDefinitionsCollection) throw new Error('analysisDefinitionsCollection is required');
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    if (!opts.analysis) throw new Error('analysis is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._analysis = opts.analysis;
    this._modals = opts.modals;
    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this._visDefinitionModel = opts.visDefinitionModel;
    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._analysisDefinitionsCollection = opts.analysisDefinitionsCollection;
  },

  render: function () {
    var self = this;

    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        var selectedTabItem = opts[0] || 'layers';
        return new EditorView({
          modals: self._modals,
          analysis: self._analysis,
          userModel: self._userModel,
          configModel: self._configModel,
          visDefinitionModel: self._visDefinitionModel,
          layerDefinitionsCollection: self._layerDefinitionsCollection,
          analysisDefinitionsCollection: self._analysisDefinitionsCollection,
          widgetDefinitionsCollection: self._widgetDefinitionsCollection,
          mapStackLayoutModel: stackLayoutModel,
          selectedTabItem: selectedTabItem
        });
      }
    }, {
      createStackView: function (stackLayoutModel, opts) {
        var viewType = opts[1];

        switch (viewType) {
          case 'layers':
            var layerDefinitionModel = opts[0];
            var selectedNodeId = opts[2];
            return new LayerContentView({
              layerDefinitionModel: layerDefinitionModel,
              analysisDefinitionsCollection: self._analysisDefinitionsCollection,
              layerDefinitionsCollection: self._layerDefinitionsCollection,
              analysis: self._analysis,
              modals: self._modals,
              stackLayoutModel: stackLayoutModel,
              selectedNodeId: selectedNodeId
            });
          case 'widgets':
            var widgetDefinitionModel = opts[0];
            return new WidgetsFormContentView({
              widgetDefinitionModel: widgetDefinitionModel,
              analysisDefinitionNodesCollection: self._analysisDefinitionsCollection.analysisDefinitionNodesCollection,
              stackLayoutModel: stackLayoutModel
            });
          case 'elements':
            console.log(viewType + 'view is not implemented yet');
            break;
          default:
            console.log(viewType + 'view doesn\'t exist');
        }
      }
    }]);

    var stackLayoutView = new StackLayoutView({
      collection: stackViewCollection
    });

    this.$el.append(stackLayoutView.render().$el);
    return this;
  }
});
