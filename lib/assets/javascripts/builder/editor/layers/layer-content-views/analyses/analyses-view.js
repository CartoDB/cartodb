var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var Infobox = require('builder/components/infobox/infobox-factory');
var InfoboxModel = require('builder/components/infobox/infobox-model');
var InfoboxCollection = require('builder/components/infobox/infobox-collection');
var PanelWithOptionsView = require('builder/components/view-options/panel-with-options-view');
var panelTemplate = require('./panel-with-options.tpl');
var AnalysesContentView = require('./analyses-content-view');
var OnboardingLauncher = require('builder/components/onboardings/generic/generic-onboarding-launcher');
var OnboardingView = require('builder/components/onboardings/layers/analysis-onboarding/analysis-onboarding-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var ONBOARDING_KEY = 'layer-analyses-onboarding';

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
  'onboardingNotification',
  'layerContentModel'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._selectedNodeId = opts.selectedNodeId;

    this._infoboxModel = new InfoboxModel({
      state: ''
    });

    this._overlayModel = new Backbone.Model({
      visible: this._isLayerHidden()
    });

    this._onboardingLauncher = new OnboardingLauncher({
      view: OnboardingView,
      onboardingNotification: this._onboardingNotification,
      notificationKey: ONBOARDING_KEY,
      onboardings: this._onboardings
    }, {
      editorModel: this._editorModel,
      selector: 'LayerOnboarding'
    });

    this._getQueryAndCheckState();

    this._initBinds();
  },

  render: function () {
    this._launchOnboarding();
    this.clearSubViews();
    this.$el.empty();

    this._initViews();
    this._infoboxState();

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._layerDefinitionModel, 'change:visible', this._infoboxState);
    this.listenTo(this._analysisFormsCollection, 'reset remove', this._getQueryAndCheckState);
  },

  _initViews: function () {
    var self = this;
    var infoboxSstates = [
      {
        state: 'layer-hidden',
        createContentView: function () {
          return Infobox.createWithAction({
            type: 'alert',
            title: _t('editor.messages.layer-hidden.title'),
            body: _t('editor.messages.layer-hidden.body'),
            mainAction: {
              label: _t('editor.messages.layer-hidden.show')
            }
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
        return new AnalysesContentView({
          className: 'Editor-content',
          userActions: self._userActions,
          analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
          userModel: self._userModel,
          analysisFormsCollection: self._analysisFormsCollection,
          configModel: self._configModel,
          layerDefinitionModel: self._layerDefinitionModel,
          stackLayoutModel: self._stackLayoutModel,
          selectedNodeId: self._selectedNodeId,
          overlayModel: self._overlayModel,
          layerContentModel: self._layerContentModel
        });
      }
    });

    this.$el.append(panelWithOptionsView.render().el);
    this.addView(panelWithOptionsView);
  },

  _getQueryAndCheckState: function () {
    if (!this._analysisFormsCollection.isEmpty()) {
      this._infoboxState();
    }
  },

  _launchOnboarding: function () {
    if (this._onboardingNotification.getKey(ONBOARDING_KEY)) {
      return;
    }

    if (this._analysisFormsCollection.isEmpty()) {
      this._onboardingLauncher.launch();
    }

    this._layerDefinitionModel.canBeGeoreferenced()
      .then(function (canBeGeoreferenced) {
        if (canBeGeoreferenced) {
          this._onboardingNotification.setKey(ONBOARDING_KEY, true);
        }
      }.bind(this));
  },

  _infoboxState: function () {
    if (this._isLayerHidden()) {
      this._infoboxModel.set({ state: 'layer-hidden' });
      this._overlayModel.set({ visible: true });
    } else {
      this._infoboxModel.set({ state: '' });
      this._overlayModel.set({ visible: false });
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
