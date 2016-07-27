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

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layersDefinitionCollection is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._userActions = opts.userActions;
    this._styleModel = this._layerDefinitionModel.styleModel;
    this._configModel = opts.configModel;
    this._modals = opts.modals;
    this._querySchemaModel = opts.querySchemaModel;
    this._editorModel = opts.editorModel;
    this._cartocssModel = this._layerDefinitionModel.cartocssModel;
    this._codemirrorModel = new Backbone.Model({
      content: this._layerDefinitionModel.get('cartocss')
    });

    // Set edition attribute in case custom cartocss is applied
    this._editorModel.set({
      edition: !!this._layerDefinitionModel.get('cartocss_custom')
    });

    this._infoboxModel = new InfoboxModel({
      state: this._isLayerHidden() ? 'layer-hidden' : ''
    });

    this._overlayModel = new Backbone.Model({
      visible: this._isLayerHidden()
    });

    this.listenTo(this._editorModel, 'change:edition', this._onChangeEdition);
    this.add_related_model(this._editorModel);

    this._appendMapsAPIError();
    this.listenTo(this._layerDefinitionModel, 'change:error', this._appendMapsAPIError);

    this._configPanes();
    this._initBinds();
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

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._styleModel.bind('change', function () {
      this._codemirrorModel.set('content', this._layerDefinitionModel.get('cartocss'));
    }, this);
    this.add_related_model(this._styleModel);

    this._cartocssModel.bind('undo redo', function () {
      this._codemirrorModel.set('content', this._cartocssModel.get('content'));
    }, this);
    this.add_related_model(this._cartocssModel);
  },

  _saveCartoCSS: function () {
    var content = this._codemirrorModel.get('content');
    var parser = new ParserCSS(content);
    var errors = parser.errors();
    this._codemirrorModel.set('errors', parser.parseError(errors));

    if (errors.length === 0) {
      this._cartocssModel.set('content', content);
      this._layerDefinitionModel.set({
        cartocss_custom: true,
        cartocss: content
      });

      this._userActions.saveLayer(this._layerDefinitionModel);

      Notifier.addNotification({
        status: 'success',
        info: _t('editor.style.notifier.css-success'),
        closable: true,
        delay: Notifier.DEFAULT_DELAY
      });
    } else {
      Notifier.addNotification({
        status: 'error',
        info: _t('editor.style.notifier.css-error'),
        closable: true,
        delay: Notifier.DEFAULT_DELAY
      });
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

  _onChangeEdition: function () {
    this._infoboxState();

    var edition = this._editorModel.get('edition');
    var index = edition ? 1 : 0;
    this._collectionPane.at(index).set({ selected: true });
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
              querySchemaModel: self._querySchemaModel,
              editorModel: self._editorModel,
              overlayModel: self._overlayModel
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
        mainAction: self._cancelApplyStyles.bind(self),
        secondAction: self._confirmApplyStyles.bind(self)
      }, {
        state: 'layer-hidden',
        createContentView: function () {
          return Infobox.createConfirm({
            type: 'alert',
            title: _t('editor.style.messages.layer-hidden.title'),
            body: _t('editor.style.messages.layer-hidden.body'),
            confirmLabel: _t('editor.style.messages.layer-hidden.show'),
            confirmType: 'button'
          });
        },
        mainAction: self._showHiddenLayer.bind(self)
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
          labels: [_t('editor.style.style-toggle.values'), _t('editor.style.style-toggle.cartocss')]
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
