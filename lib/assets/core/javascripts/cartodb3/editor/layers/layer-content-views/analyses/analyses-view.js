var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var Infobox = require('../../../../components/infobox/infobox-factory');
var InfoboxModel = require('../../../../components/infobox/infobox-model');
var InfoboxCollection = require('../../../../components/infobox/infobox-collection');
var PanelWithOptionsView = require('../../../../components/view-options/panel-with-options-view');
var panelTemplate = require('./panel-with-options.tpl');
var LayerContentAnalysesView = require('./layer-content-analyses-view');
var OnboardingLauncher = require('../../../../components/onboardings/layers/onboarding-launcher');
var OnboardingView = require('../../../../components/onboardings/layers/analysis-onboarding/analysis-onboarding-view');
var onboardingKey = require('../../../../components/onboardings/layers/layer-onboarding-keys').analyses;
var checkAndBuildOpts = require('../../../../helpers/required-opts');
var UserNotifications = require('../../../../data/user-notifications');

var REQUIRED_OPTS = [
  'userActions',
  'analysisFormsCollection',
  'layerDefinitionModel',
  'analysisDefinitionNodesCollection',
  'configModel',
  'userModel',
  'editorModel',
  'stackLayoutModel',
  'onboardings',
  'onboardingNotification'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._selectedNodeId = opts.selectedNodeId;

    this._infoboxModel = new InfoboxModel({
      state: this._isLayerHidden() ? 'layer-hidden' : ''
    });

    this._overlayModel = new Backbone.Model({
      visible: this._isLayerHidden()
    });

    this._onboardingLauncher = new OnboardingLauncher({
      view: OnboardingView,
      onboardingNotification: this._onboardingNotification,
      notificationKey: onboardingKey,
      onboardings: this._onboardings
    }, {
      editorModel: this._editorModel
    });
  },

  render: function () {
    this._launchOnboarding();
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

  _launchOnboarding: function () {
    if (this._onboardingNotification.getKey(onboardingKey)) {
      return;
    }

    if (this._analysisFormsCollection.isEmpty()) {
      this._onboardingLauncher.launch();
    }
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
