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

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layersDefinitionCollection is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.queryGeometryModel) throw new Error('queryGeometryModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.userModel) throw new Error('userModel is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._userActions = opts.userActions;
    this._styleModel = this._layerDefinitionModel.styleModel;
    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this._modals = opts.modals;
    this._queryGeometryModel = opts.queryGeometryModel;
    this._querySchemaModel = opts.querySchemaModel;
    this._editorModel = opts.editorModel;
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

    this._appendMapsAPIError();

    CartoCSSNotifications.track(this);

    this._configPanes();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this._layerDefinitionModel, 'change:error', this._appendMapsAPIError);
    this.listenTo(this._layerDefinitionModel, 'change:visible', this._onChangeLayerVisibility);
    this.add_related_model(this._layerDefinitionModel);

    this.listenTo(this._editorModel, 'change:edition', this._onChangeEdition);
    this.add_related_model(this._editorModel);

    this._querySchemaModel.on('change:query_errors', this._updateEditor, this);
    this.add_related_model(this._querySchemaModel);

    this._styleModel.bind('change', function () {
      this._codemirrorModel.set('content', this._layerDefinitionModel.get('cartocss'));
    }, this);
    this.add_related_model(this._styleModel);

    this._cartocssModel.bind('undo redo', function () {
      this._codemirrorModel.set('content', this._cartocssModel.get('content'));
    }, this);
    this.add_related_model(this._cartocssModel);
  },

  _appendMapsAPIError: function () {
    var error = this._layerDefinitionModel.get('error');
    if (error) {
      if (error.type === 'turbo-carto') {
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

  _saveCartoCSS: function () {
    var content = this._codemirrorModel.get('content');
    var parser = new ParserCSS(content);
    var errors = parser.errors();

    if (!content) {
      return false;
    }

    this._codemirrorModel.set('errors', parser.parseError(errors));

    if (errors.length === 0) {
      this._cartocssModel.set('content', content);
      this._layerDefinitionModel.set({
        cartocss_custom: true,
        cartocss: content
      });

      this._userActions.saveLayer(this._layerDefinitionModel);

      CartoCSSNotifications.showSuccessNotification();

      MetricsTracker.track('Applied Cartocss', {
        layer_id: this._layerDefinitionModel.get('id'),
        cartocss: this._layerDefinitionModel.get('cartocss')
      });
    } else {
      this._editorModel.get('edition') === false && CartoCSSNotifications.showErrorNotification(parser.parseError(errors));
    }
  },

  _confirmApplyStyles: function () {
    this._infoboxModel.set({state: ''});
    this._overlayModel.set({visible: false});

    this._editorModel.set({
      edition: true
    });
  },

  _cancelApplyStyles: function () {
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

  _onChangeLayerVisibility: function () {
    this._infoboxState();
  },

  _onChangeEdition: function () {
    this._infoboxState();

    var edition = this._editorModel.get('edition');
    var index = edition ? 1 : 0;
    this._collectionPane.at(index).set({ selected: true });
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
              editorModel: self._editorModel,
              overlayModel: self._overlayModel,
              freezeTorgeAggregation: self._freezeTorgeAggregation.bind(self)
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
          onApplyEvent: self._saveCartoCSS.bind(self)
        });
      },
      createActionView: function () {
        return new UndoButtons({
          trackModel: self._cartocssModel,
          editorModel: self._editorModel,
          applyButton: true,
          onApplyClick: self._saveCartoCSS.bind(self)
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

    if (!edition && cartocss_custom) {
      this._infoboxModel.set({state: 'confirm'});
      this._overlayModel.set({visible: true});
    } else if (!edition && this._isLayerHidden()) {
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

  _initViews: function () {
    var self = this;

    var infoboxSstates = [
      {
        state: 'confirm',
        createContentView: function () {
          return Infobox.createConfirmAndCancel({
            type: 'alert',
            title: _t('editor.style.messages.cartocss-applied.title'),
            body: _t('editor.style.messages.cartocss-applied.body'),
            cancelLabel: _t('editor.style.messages.cartocss-applied.cancel'),
            confirmLabel: _t('editor.style.messages.cartocss-applied.accept')
          });
        },
        mainAction: self._confirmApplyStyles.bind(self),
        secondAction: self._cancelApplyStyles.bind(self)
      }, {
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
      }, {
        state: 'torque-exists',
        createContentView: function () {
          return Infobox.createConfirmAndCancel({
            type: 'alert',
            title: _t('editor.style.messages.torque-exists.title'),
            body: _t('editor.style.messages.torque-exists.body'),
            cancelLabel: _t('editor.style.messages.torque-exists.cancel'),
            confirmLabel: _t('editor.style.messages.torque-exists.accept'),
            cancelPosition: 'left',
            confirmPosition: 'right'
          });
        },
        secondAction: self._cancelTorqueAggregation.bind(self),
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
          editorModel: self._editorModel,
          labels: [_t('editor.style.style-toggle.values'), _t('editor.style.style-toggle.cartocss')],
          isDisableable: true
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
  }

});
