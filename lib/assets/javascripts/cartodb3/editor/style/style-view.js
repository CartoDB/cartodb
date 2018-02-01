var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var PanelWithOptionsView = require('../../components/view-options/panel-with-options-view');
var StyleContentView = require('./style-content-view');
var StyleCartoCSSView = require('./style-cartocss-view');
var ScrollView = require('../../components/scroll/scroll-view');
var TabPaneView = require('../../components/tab-pane/tab-pane-view');
var TabPaneCollection = require('../../components/tab-pane/tab-pane-collection');
var Toggler = require('../../components/toggler/toggler-view');
var UndoButtons = require('../../components/undo-redo/undo-redo-view');
var ParserCSS = require('../../helpers/parser-css');
var Infobox = require('../../components/infobox/infobox-factory');
var InfoboxModel = require('../../components/infobox/infobox-model');
var InfoboxCollection = require('../../components/infobox/infobox-collection');
var Notifier = require('../../components/notifier/notifier');
var CartoCSSNotifications = require('../../cartocss-notifications');
var MetricsTracker = require('../../components/metrics/metrics-tracker');
var OnboardingLauncher = require('../../components/onboardings/generic/generic-onboarding-launcher');
var OnboardingView = require('../../components/onboardings/layers/style-onboarding/style-onboarding-view');
var layerOnboardingKey = require('../../components/onboardings/layers/layer-onboarding-key');
var checkAndBuildOpts = require('../../helpers/required-opts');

var REQUIRED_OPTS = [
  'layerDefinitionsCollection',
  'layerDefinitionModel',
  'userActions',
  'queryGeometryModel',
  'querySchemaModel',
  'queryRowsCollection',
  'modals',
  'editorModel',
  'configModel',
  'userModel',
  'onboardings',
  'onboardingNotification',
  'layerContentModel'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._styleModel = this._layerDefinitionModel.styleModel;
    this._cartocssModel = this._layerDefinitionModel.cartocssModel;
    this._codemirrorModel = new Backbone.Model({
      content: this._layerDefinitionModel.get('cartocss')
    });

    // Set edition attribute in case custom cartocss is applied
    this._editorModel.set({
      edition: !!this._layerDefinitionModel.get('cartocss_custom'),
      disabled: false
    });

    this._infoboxModel = new InfoboxModel({
      state: this._isLayerHidden() ? 'layer-hidden' : ''
    });

    this._overlayModel = new Backbone.Model({
      visible: this._isLayerHidden()
    });

    this._applyButtonStatusModel = new Backbone.Model({
      loading: false
    });

    this._togglerModel = new Backbone.Model({
      labels: [_t('editor.style.style-toggle.values'), _t('editor.style.style-toggle.cartocss')],
      active: this._editorModel.isEditing(),
      disabled: this._editorModel.isDisabled(),
      isDisableable: true,
      tooltip: _t('editor.style.style-toggle.tooltip')
    });

    this._appendMapsAPIError();

    CartoCSSNotifications.track(this);

    this._onboardingLauncher = new OnboardingLauncher({
      view: OnboardingView,
      onboardingNotification: this._onboardingNotification,
      notificationKey: layerOnboardingKey,
      onboardings: this._onboardings
    }, {
      editorModel: this._editorModel,
      selector: 'LayerOnboarding'
    });

    this._configPanes();
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

  _launchOnboarding: function () {
    if (this._onboardingNotification.getKey(layerOnboardingKey)) {
      return;
    }

    var launchOnboarding = function () {
      if (!this._editorModel.isEditing() && !this._layerDefinitionModel.canBeGeoreferenced() && this._queryGeometryModel.hasValue()) {
        this._onboardingLauncher.launch({
          geom: this._queryGeometryModel.get('simple_geom'),
          type: this._styleModel.get('type')
        });
      }
    }.bind(this);

    if (!this._queryRowsCollection.isFetched()) {
      // It will be fetched by style-content view
      this._queryRowsCollection.statusModel.bind('change:status', function () {
        if (this._queryRowsCollection.isFetched()) {
          launchOnboarding();
          this._queryRowsCollection.statusModel.unbind(null, null, this);
        }
      }, this);
    } else {
      launchOnboarding();
    }
  },

  _initBinds: function () {
    this.listenTo(this._layerDefinitionModel, 'change:error', this._appendMapsAPIError);
    this.listenTo(this._layerDefinitionModel, 'change:cartocss', this._onCartocssChanged);
    this.listenTo(this._layerDefinitionModel, 'change:visible', this._infoboxState);
    this.listenTo(this._layerDefinitionModel, 'change:autoStyle', this._infoboxState);

    this.listenTo(this._editorModel, 'change:edition', this._onChangeEdition);
    this.listenTo(this._editorModel, 'change:disabled', this._onChangeDisabled);
    this.listenTo(this._togglerModel, 'change:active', this._onTogglerChanged);

    this.listenTo(this._querySchemaModel, 'change:query_errors', this._updateEditor);

    this.listenTo(this._styleModel, 'change', this._onCartocssChanged);
    this.listenTo(this._cartocssModel, 'undo redo', this._onUndoRedo);
  },

  _initViews: function () {
    var self = this;

    var infoboxSstates = [
      {
        state: 'confirm',
        createContentView: function () {
          return Infobox.createWithAction({
            type: 'alert',
            closable: false,
            title: _t('editor.style.messages.cartocss-applied.title'),
            body: _t('editor.style.messages.cartocss-applied.body'),
            mainAction: {
              label: _t('editor.style.messages.cartocss-applied.clear')
            },
            secondAction: {
              label: _t('editor.style.messages.cartocss-applied.continue')
            }
          });
        },
        mainAction: self._clearCustomStyles.bind(self),
        secondAction: self._cancelClearStyles.bind(self)
      }, {
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
      }, {
        state: 'torque-exists',
        createContentView: function () {
          return Infobox.createWithAction({
            type: 'alert',
            closable: false,
            title: _t('editor.style.messages.torque-exists.title'),
            body: _t('editor.style.messages.torque-exists.body'),
            mainAction: {
              label: _t('editor.style.messages.torque-exists.continue')
            }
          });
        },
        closeAction: self._cancelTorqueAggregation.bind(self),
        mainAction: self._applyTorqueAggregation.bind(self)
      }
    ];

    var infoboxCollection = new InfoboxCollection(infoboxSstates);

    var panelWithOptionsView = new PanelWithOptionsView({
      className: 'Editor-content',
      editorModel: self._editorModel,
      infoboxModel: self._infoboxModel,
      infoboxCollection: infoboxCollection,
      createContentView: function () {
        return new TabPaneView({
          collection: self._collectionPane
        });
      },
      createControlView: function () {
        return new Toggler({
          model: self._togglerModel
        });
      },
      createActionView: function () {
        return new TabPaneView({
          collection: self._collectionPane,
          createContentKey: 'createActionView'
        });
      }
    });

    this.$el.append(panelWithOptionsView.render().el);
    this.addView(panelWithOptionsView);
  },

  _onCartocssChanged: function () {
    this._codemirrorModel.set('content', this._layerDefinitionModel.get('cartocss'));
  },

  _onUndoRedo: function () {
    this._codemirrorModel.set('content', this._cartocssModel.get('content'));
  },

  _appendMapsAPIError: function () {
    var error = this._layerDefinitionModel.get('error');
    if (error) {
      if (error.subtype === 'turbo-carto') {
        var newErrors = _.clone(this._codemirrorModel.get('errors')) || [];
        newErrors.push({ line: error.line, message: error.message });
        this._codemirrorModel.set('errors', newErrors);
      }
    }
  },

  _updateEditor: function (model) {
    var errors = this._querySchemaModel.get('query_errors');
    var hasErrors = errors && errors.length > 0;
    this._editorModel.set('disabled', hasErrors);
  },

  _saveCartoCSS: function (cb) {
    var content = this._codemirrorModel.get('content');
    var parser = new ParserCSS(content);
    var errors = parser.errors();

    if (!content) {
      return false;
    }

    this._applyButtonStatusModel.set('loading', true);
    this._codemirrorModel.set('errors', parser.parseError(errors));

    if (errors.length === 0) {
      this._cartocssModel.set('content', content);

      // Disable auto-style before saving, in order to not reset styles
      this._layerDefinitionModel.set('autoStyle', false);

      this._layerDefinitionModel.save({
        cartocss_custom: true,
        cartocss: content
      }, {
        complete: cb
      });

      MetricsTracker.track('Applied Cartocss', {
        layer_id: this._layerDefinitionModel.get('id'),
        cartocss: this._layerDefinitionModel.get('cartocss')
      });

      MetricsTracker.track('Used advanced mode', {
        type: 'cartocss'
      });
    } else {
      this._editorModel.get('edition') === false && CartoCSSNotifications.showErrorNotification(parser.parseError(errors));
      this._applyButtonStatusModel.set('loading', false);
    }
  },

  _onSaveComplete: function () {
    CartoCSSNotifications.showSuccessNotification();
    this._applyButtonStatusModel.set('loading', false);
  },

  _cancelClearStyles: function () {
    this._infoboxModel.set({state: ''});
    this._overlayModel.set({visible: false});

    this._editorModel.set({
      edition: true
    });
  },

  _clearCustomStyles: function () {
    this._layerDefinitionModel.set('cartocss_custom', false);
    this._styleModel.applyLastState();
    this._infoboxModel.set({state: ''});
    this._overlayModel.set({visible: false});
    this.render();
  },

  _cancelTorqueAggregation: function () {
    this._styleModel.applyLastState();
    this._infoboxModel.set({state: ''});
    this._overlayModel.set({visible: false});
    this.render();
  },

  _applyTorqueAggregation: function () {
    if (this._layerDefinitionsCollection.isThereAnyTorqueLayer()) {
      var torqueLayer = this._layerDefinitionsCollection.findWhere({ type: 'torque' });
      torqueLayer.styleModel.setDefaultPropertiesByType('simple', 'point');
    }

    this._infoboxModel.set({state: 'unfreeze'});
  },

  _onChangeEdition: function () {
    this._infoboxState();

    var edition = this._editorModel.get('edition');
    var index = edition ? 1 : 0;
    this._collectionPane.at(index).set({ selected: true });
  },

  _onChangeDisabled: function () {
    var disabled = this._editorModel.get('disabled');
    this._togglerModel.set({ disabled: disabled });
  },

  _onTogglerChanged: function () {
    var checked = this._togglerModel.get('active');
    this._editorModel.set({ edition: checked });
  },

  _freezeTorgeAggregation: function (styleType, currentGeometryType) {
    this._infoboxModel.set({state: 'torque-exists'});
    this._overlayModel.set({visible: true});

    // Apply the previously selected style
    this._infoboxModel.once('change:state', function (mdl, state) {
      if (state === 'unfreeze') {
        this._moveTorqueLayerToTop(function () {
          this._overlayModel.set({visible: false});
          this._styleModel.setDefaultPropertiesByType(styleType, currentGeometryType);
        }.bind(this));
        this._infoboxModel.set({state: ''});
      }
    }, this);
  },

  _moveTorqueLayerToTop: function (callback) {
    var notification = Notifier.addNotification({
      status: 'loading',
      info: _t('editor.layers.moveTorqueLayer.loading'),
      closable: true
    });

    this._layerDefinitionsCollection.once('layerMoved', function () {
      callback && callback();
      notification.set({
        status: 'success',
        info: _t('editor.layers.moveTorqueLayer.success'),
        delay: Notifier.DEFAULT_DELAY
      });
    }, this);

    this._userActions.moveLayer({
      from: this._layerDefinitionModel.get('order'),
      to: this._layerDefinitionsCollection.getTopDataLayerIndex()
    });
  },

  _configPanes: function () {
    var self = this;
    var tabPaneTabs = [{
      selected: !this._layerDefinitionModel.get('cartocss_custom'),
      createContentView: function () {
        return new ScrollView({
          createContentView: function () {
            return new StyleContentView({
              className: 'Editor-content',
              userActions: self._userActions,
              layerDefinitionsCollection: self._layerDefinitionsCollection,
              layerDefinitionModel: self._layerDefinitionModel,
              styleModel: self._styleModel,
              modals: self._modals,
              configModel: self._configModel,
              userModel: self._userModel,
              queryGeometryModel: self._queryGeometryModel,
              querySchemaModel: self._querySchemaModel,
              queryRowsCollection: self._queryRowsCollection,
              editorModel: self._editorModel,
              overlayModel: self._overlayModel,
              freezeTorgeAggregation: self._freezeTorgeAggregation.bind(self),
              layerContentModel: self._layerContentModel
            });
          }
        });
      },
      createActionView: function () {
        return new UndoButtons({
          trackModel: self._styleModel,
          editorModel: self._editorModel,
          applyButton: false
        });
      }
    }, {
      selected: this._layerDefinitionModel.get('cartocss_custom'),
      createContentView: function () {
        return new StyleCartoCSSView({
          layerDefinitionModel: self._layerDefinitionModel,
          querySchemaModel: self._querySchemaModel,
          styleModel: self._styleModel,
          editorModel: self._editorModel,
          codemirrorModel: self._codemirrorModel,
          onApplyEvent: self._saveCartoCSS.bind(self, self._onSaveComplete.bind(self)),
          overlayModel: self._overlayModel
        });
      },
      createActionView: function () {
        return new UndoButtons({
          trackModel: self._cartocssModel,
          editorModel: self._editorModel,
          applyStatusModel: self._applyButtonStatusModel,
          applyButton: true,
          onApplyClick: self._saveCartoCSS.bind(self, self._onSaveComplete.bind(self)),
          overlayModel: self._overlayModel
        });
      }
    }];

    this._collectionPane = new TabPaneCollection(tabPaneTabs);
  },

  _isLayerHidden: function () {
    return this._layerDefinitionModel.get('visible') === false;
  },

  _infoboxState: function () {
    var edition = this._editorModel.get('edition');
    var cartocss_custom = this._layerDefinitionModel.get('cartocss_custom');
    var isAutoStyleApplied = this._layerDefinitionModel.get('autoStyle');

    if (!edition && cartocss_custom && !isAutoStyleApplied) {
      this._infoboxModel.set({ state: 'confirm' });
      this._overlayModel.set({ visible: true });
    } else if (this._isLayerHidden()) {
      this._infoboxModel.set({ state: 'layer-hidden' });
      this._overlayModel.set({ visible: true });
      this._togglerModel.set({ disabled: true });
    } else {
      this._infoboxModel.set({ state: '' });
      this._overlayModel.set({ visible: false });
      this._togglerModel.set({ disabled: false });
    }
  },

  _showHiddenLayer: function () {
    var savingOptions = {
      shouldPreserveAutoStyle: true
    };
    this._layerDefinitionModel.toggleVisible();
    this._userActions.saveLayer(this._layerDefinitionModel, savingOptions);
  }
});
