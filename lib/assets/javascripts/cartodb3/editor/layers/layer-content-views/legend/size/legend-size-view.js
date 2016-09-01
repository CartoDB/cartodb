var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var _ = require('underscore');
var PanelWithOptionsView = require('../../../../../components/view-options/panel-with-options-view');
var LegendContentView = require('./legend-size-content-view');
var LegendEditorView = require('../legend-editor-view');
var ScrollView = require('../../../../../components/scroll/scroll-view');
var TabPaneView = require('../../../../../components/tab-pane/tab-pane-view');
var TabPaneCollection = require('../../../../../components/tab-pane/tab-pane-collection');
var Toggler = require('../../../../../components/toggler/toggler-view');
var ApplyView = require('../apply-button-view');
var Infobox = require('../../../../../components/infobox/infobox-factory');
var InfoboxModel = require('../../../../../components/infobox/infobox-model');
var InfoboxCollection = require('../../../../../components/infobox/infobox-collection');

var REQUIRED_OPTS = [
  'layerDefinitionModel',
  'editorModel',
  'userActions'
];

// TBD:
// - notifications
// - models
// - save & retrieve info

module.exports = CoreView.extend({
  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this._codemirrorModel = new Backbone.Model({
      content: 'Hello world'
    });

    this._editorModel.set({
      edition: false, // TOFIX: if there is custom html, set to true
      disabled: false // TOFIX: if there is an sql error or none style is selected, set to true
    });

    this._infoboxModel = new InfoboxModel({
      state: this._isLayerHidden() ? 'layer-hidden' : ''
    });

    this._overlayModel = new Backbone.Model({
      visible: this._isLayerHidden()
    });

    this._configPanes();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _isLayerHidden: function () {
    return this._layerDefinitionModel.get('visible') === false;
  },

  _initBinds: function () {
    this.listenTo(this._editorModel, 'change:edition', this._onChangeEdition);
    this.add_related_model(this._editorModel);
  },

  _onChangeEdition: function () {
    this._infoboxState();

    var edition = this._editorModel.get('edition');
    var index = edition ? 1 : 0;
    this._collectionPane.at(index).set({ selected: true });
  },

  _initViews: function () {
    var self = this;

    var infoboxSstates = [
      {
        state: 'confirm',
        createContentView: function () {
          return Infobox.createConfirm({
            type: 'alert',
            title: _t('editor.legend.messages.custom-html-applied.title'),
            body: _t('editor.legend.messages.custom-html-applied.body'),
            confirmLabel: _t('editor.legend.messages.custom-html-applied.accept')
          });
        },
        mainAction: self._cancelHTML.bind(self)
      }, {
        state: 'layer-hidden',
        createContentView: function () {
          return Infobox.createConfirm({
            type: 'alert',
            title: _t('editor.legend.messages.layer-hidden.title'),
            body: _t('editor.legend.messages.layer-hidden.body'),
            confirmLabel: _t('editor.legend.messages.layer-hidden.show'),
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
          labels: [_t('editor.legend.data-toggle.values'), _t('editor.legend.data-toggle.html')]
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

  _showHiddenLayer: function () {
    this._layerDefinitionModel.toggleVisible();
    this._userActions.saveLayer(this._layerDefinitionModel);

    this._infoboxState();
  },

  _cancelHTML: function () {
    this._infoboxModel.set({state: ''});
    this._overlayModel.set({visible: false});
  },

  _saveLegendHTML: function () {
    // TBD
    console.log('saving...');
  },

  _infoboxState: function () {
    var edition = this._editorModel.get('edition');
    var html_custom = false; // TOFIX: method to get if custom html is applied

    if (!edition && html_custom) {
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

  _configPanes: function () {
    var self = this;
    var tabPaneTabs = [{
      createContentView: function () {
        return new ScrollView({
          createContentView: function () {
            return new LegendContentView({
              className: 'Editor-content'
            });
          }
        });
      },
      createActionView: function () {
        return new CoreView();
      }
    }, {
      createContentView: function () {
        return new LegendEditorView({
          codemirrorModel: self._codemirrorModel,
          onApplyEvent: self._saveLegendHTML.bind(self)
        });
      },
      createActionView: function () {
        return new ApplyView({
          onApplyClick: self._saveLegendHTML.bind(self)
        });
      }
    }];

    this._collectionPane = new TabPaneCollection(tabPaneTabs);
  }
});
