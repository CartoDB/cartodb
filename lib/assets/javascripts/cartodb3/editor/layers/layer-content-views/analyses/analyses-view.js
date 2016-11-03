var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var Infobox = require('../../../../components/infobox/infobox-factory');
var InfoboxModel = require('../../../../components/infobox/infobox-model');
var InfoboxCollection = require('../../../../components/infobox/infobox-collection');
var PanelWithOptionsView = require('../../../../components/view-options/panel-with-options-view');
var panelTemplate = require('./panel-with-options.tpl');
var LayerContentAnalysesView = require('./layer-content-analyses-view');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.analysisFormsCollection) throw new Error('analysisFormsCollection is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');

    this._userActions = opts.userActions;
    this._stackLayoutModel = opts.stackLayoutModel;
    this._userModel = opts.userModel;
    this._analysisFormsCollection = opts.analysisFormsCollection;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this._configModel = opts.configModel;
    this._editorModel = opts.editorModel;
    this._selectedNodeId = opts.selectedNodeId;

    this._infoboxModel = new InfoboxModel({
      state: this._isLayerHidden() ? 'layer-hidden' : ''
    });

    this._overlayModel = new Backbone.Model({
      visible: this._isLayerHidden()
    });
  },

  render: function () {
    this.clearSubViews();

    var self = this;
    var infoboxSstates = [
      {
        state: 'layer-hidden',
        createContentView: function () {
          return Infobox.createConfirm({
            type: 'alert',
            title: _t('editor.style.messages.layer-hidden.title'),
            body: _t('editor.style.messages.layer-hidden.body'),
            confirmLabel: _t('editor.style.messages.layer-hidden.show'),
            confirmType: 'secondary',
            confirmPosition: 'right'
          });
        },
        mainAction: self._showHiddenLayer.bind(self)
      }
    ];

    var infoboxCollection = new InfoboxCollection(infoboxSstates);

    var panelWithOptionsView = new PanelWithOptionsView({
      template: panelTemplate,
      className: 'Editor-content',
      editorModel: self._editorModel,
      infoboxModel: self._infoboxModel,
      infoboxCollection: infoboxCollection,
      createContentView: function () {
        return new LayerContentAnalysesView({
          className: 'Editor-content',
          userActions: self._userActions,
          analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
          userModel: self._userModel,
          analysisFormsCollection: self._analysisFormsCollection,
          configModel: self._configModel,
          layerDefinitionModel: self._layerDefinitionModel,
          stackLayoutModel: self._stackLayoutModel,
          selectedNodeId: self._selectedNodeId,
          overlayModel: self._overlayModel
        });
      }
    });

    this.$el.append(panelWithOptionsView.render().el);
    this.addView(panelWithOptionsView);
    return this;
  },

  _infoboxState: function () {
    if (this._isLayerHidden()) {
      this._infoboxModel.set({state: 'layer-hidden'});
      this._overlayModel.set({visible: true});
    } else {
      this._infoboxModel.set({state: ''});
      this._overlayModel.set({visible: false});
    }
  },

  _showHiddenLayer: function () {
    this._layerDefinitionModel.toggleVisible();
    this._userActions.saveLayer(this._layerDefinitionModel);

    this._infoboxState();
  },

  _isLayerHidden: function () {
    return this._layerDefinitionModel.get('visible') === false;
  }

});
