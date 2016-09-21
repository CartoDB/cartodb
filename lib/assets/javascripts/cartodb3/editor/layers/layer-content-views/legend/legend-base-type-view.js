var cdb = require('cartodb.js');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var _ = require('underscore');
var PanelWithOptionsView = require('../../../../components/view-options/panel-with-options-view');
var LegendContentView = require('./legend-content-view');
var LegendEditorView = require('./legend-editor-view');
var ScrollView = require('../../../../components/scroll/scroll-view');
var TabPaneView = require('../../../../components/tab-pane/tab-pane-view');
var TabPaneCollection = require('../../../../components/tab-pane/tab-pane-collection');
var Toggler = require('../../../../components/toggler/toggler-view');
var ApplyView = require('./apply-button-view');
var Infobox = require('../../../../components/infobox/infobox-factory');
var InfoboxModel = require('../../../../components/infobox/infobox-model');
var InfoboxCollection = require('../../../../components/infobox/infobox-collection');
var LegendDefinitionModel = require('../../../../data/legends/legend-base-definition-model');
var LegendFactory = require('./legend-factory');

var REQUIRED_OPTS = [
  'layerDefinitionModel',
  'editorModel',
  'modelView',
  'legendDefinitionsCollection'
];

var PLACEHOLDER = '[[Legend]]';
var HTML_TEMPLATE = _.template('<%= preSnippet %>\r\n<%- placeholder %>\r\n<%= postSnippet %>');

module.exports = CoreView.extend({
  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    // this.legendTypes is defined in the subview
    this._legendDefinitionModel = this._getUserLegend(this.legendTypes);

    var content = HTML_TEMPLATE({
      preSnippet: this._legendDefinitionModel.get('pre_html') || '<!-- put your html above this line -->',
      placeholder: PLACEHOLDER,
      postSnippet: this._legendDefinitionModel.get('post_html') || '<!-- put your html below this line -->'
    });

    this._codemirrorModel = new Backbone.Model({
      content: content
    });

    this._editorModel.set({
      edition: false,
      disabled: this._isToggleDisable() // if there is an sql error or none style is selected, set to true
    });

    this._infoboxModel = new InfoboxModel({
      state: ''
    });

    this._overlayModel = new Backbone.Model({
      visible: this._isLayerHidden() || this._hasLegendMigrated()
    });

    this._infoboxState();
    this._configPanes();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _getUserLegend: function (types) {
    var self = this;
    var values = _.map(types, function (type) { return type.value; });
    var selected = this._legendDefinitionsCollection.find(function (legendDefModel) {
      return values.indexOf(legendDefModel.get('type')) !== -1 && legendDefModel.layerDefinitionModel.id === self._layerDefinitionModel.id;
    });

    if (selected === undefined) {
      selected = new LegendDefinitionModel(null, {
        layerDefinitionModel: this._layerDefinitionModel,
        configModel: this._legendDefinitionsCollection.configModel,
        vizId: this._legendDefinitionsCollection.vizId
      });
    }

    return selected;
  },

  _isToggleDisable: function () {
    return this._modelView.get('state') === 'error' || this._legendDefinitionModel.get('type') === 'none' || this._legendDefinitionModel.get('type') === 'html';
  },

  _isLayerHidden: function () {
    return this._layerDefinitionModel.get('visible') === false;
  },

  _hasLegendMigrated: function () {
    return LegendFactory.hasMigratedLegend(this._layerDefinitionModel);
  },

  _initBinds: function () {
    this.listenTo(this._editorModel, 'change:edition', this._onChangeEdition);
    this.add_related_model(this._editorModel);

    this.listenTo(this._modelView, 'change:state', this._onChangeState);
    this.add_related_model(this._modelView);

    this.listenTo(this._layerDefinitionModel, 'change:visible', this._onChangeVisible);
    this.add_related_model(this._layerDefinitionModel);
  },

  _onChangeVisible: function () {
    this._infoboxState();
  },

  _onChangeState: function () {
    var isDisabled = this._modelView.get('state') === 'error';
    this._editorModel.set({disabled: isDisabled});
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
        state: 'html-legend',
        createContentView: function () {
          return Infobox.createConfirm({
            type: 'alert',
            title: _t('editor.legend.messages.migrated-legend.title'),
            body: _t('editor.legend.messages.migrated-legend.body'),
            confirmLabel: _t('editor.legend.messages.migrated-legend.accept')
          });
        },
        mainAction: self._deleteImportedLegend.bind(self)
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
          labels: [_t('editor.legend.data-toggle.values'), _t('editor.legend.data-toggle.html')],
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
  },

  _showHiddenLayer: function () {
    this._layerDefinitionModel.toggleVisible();
    this._userActions.saveLayer(this._layerDefinitionModel);

    this._infoboxState();
  },

  _deleteImportedLegend: function () {
    LegendFactory.removeImportedLegends(this._layerDefinitionModel);
    this._infoboxState();
  },

  _saveLegendHTML: function () {
    var content = this._codemirrorModel.get('content');
    var parts = content.split(PLACEHOLDER).map(function (part) {
      return cdb.core.sanitize.html(part);
    });

    this._legendDefinitionModel && this._legendDefinitionModel.set({
      pre_html: parts[0],
      post_html: parts[1]
    });
  },

  _infoboxState: function () {
    var edition = this._editorModel.get('edition');

    if (!edition && this._hasLegendMigrated()) {
      this._infoboxModel.set({state: 'html-legend'});
      this._overlayModel.set({visible: true});
    } else if (!edition && this._isLayerHidden()) {
      this._infoboxModel.set({state: 'layer-hidden'});
      this._overlayModel.set({visible: true});
    } else {
      this._infoboxModel.set({state: ''});
      this._overlayModel.set({visible: false});
    }
  },

  // we need to update the reference to the model
  _updateLegend: function (newLegendDefModel) {
    this._legendDefinitionModel = newLegendDefModel;
  },

  _configPanes: function () {
    var self = this;
    var tabPaneTabs = [{
      createContentView: function () {
        return new ScrollView({
          createContentView: function () {
            return new LegendContentView({
              className: 'Editor-content',
              overlayModel: self._overlayModel,
              editorModel: self._editorModel,
              legendTypes: self.legendTypes,
              layerDefinitionModel: self._layerDefinitionModel,
              legendDefinitionModel: self._getUserLegend(self.legendTypes),
              legendDefinitionsCollection: self._legendDefinitionsCollection,
              updateLegend: self._updateLegend.bind(self)
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
