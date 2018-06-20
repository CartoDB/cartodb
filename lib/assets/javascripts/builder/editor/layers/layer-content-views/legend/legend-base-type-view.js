var cdb = require('internal-carto.js');
var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var PanelWithOptionsView = require('builder/components/view-options/panel-with-options-view');
var LegendContentView = require('./legend-content-view');
var LegendEditorView = require('./legend-editor-view');
var ScrollView = require('builder/components/scroll/scroll-view');
var TabPaneView = require('builder/components/tab-pane/tab-pane-view');
var TabPaneCollection = require('builder/components/tab-pane/tab-pane-collection');
var Toggler = require('builder/components/toggler/toggler-view');
var ApplyButtonView = require('builder/components/apply-button/apply-button-view');
var Infobox = require('builder/components/infobox/infobox-factory');
var InfoboxCollection = require('builder/components/infobox/infobox-collection');
var LegendDefinitionModel = require('builder/data/legends/legend-base-definition-model');
var LegendFactory = require('./legend-factory');
var htmlTemplate = require('./color/legend-custom-template.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var MetricsTracker = require('builder/components/metrics/metrics-tracker');

var REQUIRED_OPTS = [
  'mapDefinitionModel',
  'layerDefinitionModel',
  'editorModel',
  'layerContentModel',
  'legendDefinitionsCollection',
  'type',
  'userActions',
  'userModel',
  'configModel',
  'modals',
  'overlayModel',
  'infoboxModel'
];

var PLACEHOLDER = '[[Legend]]';
var HTML_TEMPLATE = _.template('<%= preSnippet %>\r\n<%- placeholder %>\r\n<%= postSnippet %>');

module.exports = CoreView.extend({
  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    // this.legendTypes is defined in the subview
    this._legendDefinitionModel = this._getUserLegend(this.legendTypes);

    this._codemirrorModel = new Backbone.Model({
      content: this._getEditorContent()
    });

    this._editorModel.set({
      edition: this._legendDefinitionModel.hasCustomHtml(),
      disabled: this._isToggleDisable() // if there is an sql error or none style is selected, set to true
    });

    this._overlayModel.set({
      visible: this._isLayerHidden() || this._legendDefinitionModel.hasCustomHtml()
    }, {
      silent: true
    });

    this._togglerModel = new Backbone.Model({
      labels: [_t('editor.legend.data-toggle.values'), _t('editor.legend.data-toggle.html')],
      active: this._editorModel.isEditing(),
      disabled: this._editorModel.isDisabled(),
      isDisableable: true,
      tooltip: _t('editor.legend.data-toggle.tooltip')
    });

    this._configPanes();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this._initViews();
    this._infoboxState();
    this._toggleOverlay();

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._layerContentModel, 'change:state', this._infoboxState);
    this.listenTo(this._layerDefinitionModel, 'change:visible', this._infoboxState);
    this.listenTo(this._mapDefinitionModel, 'change:legends', this._infoboxState);

    this.listenTo(this._editorModel, 'change:edition', this._onChangeEdition);
    this.listenTo(this._editorModel, 'change:disabled', this._onChangeDisabled);
    this.listenTo(this._togglerModel, 'change:active', this._onTogglerChanged);
    this.listenTo(this._overlayModel, 'change:visible', this._toggleOverlay);
  },

  _getEditorContent: function () {
    var content;
    var type = this._legendDefinitionModel.get('type');

    if (type === 'custom') {
      if (this._legendDefinitionModel.hasCustomHtml()) {
        content = this._legendDefinitionModel.get('html');
      } else {
        content = '';
      }
    } else {
      content = this._getReadOnlyContent();
    }

    return content;
  },

  _getReadOnlyContent: function () {
    var content = HTML_TEMPLATE({
      preSnippet: this._legendDefinitionModel.get('preHTMLSnippet') || _t('editor.legend.code-mirror.pre-html'),
      placeholder: PLACEHOLDER,
      postSnippet: this._legendDefinitionModel.get('postHTMLSnippet') || _t('editor.legend.code-mirror.post-html')
    });

    return content;
  },

  _getCustomContent: function () {
    var items;
    var result = this._legendDefinitionModel.get('html');

    if (result === '') {
      items = this._legendDefinitionModel.get('items');

      result = htmlTemplate({ items: items });
    }

    return result;
  },

  _handleEditorContent: function (expertMode) {
    var type = this._legendDefinitionModel.get('type');
    if (expertMode) {
      this._codemirrorModel.set({content: type === 'custom' ? this._getCustomContent() : this._getReadOnlyContent()});
    }
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
    return this._isErrored() || this._legendDefinitionModel.get('type') === 'none' || this._areLegendsDisabled();
  },

  _isLayerHidden: function () {
    return this._layerDefinitionModel.get('visible') === false;
  },

  _isErrored: function () {
    return this._layerContentModel.isErrored();
  },

  _toggleOverlay: function () {
    var isDisabled = this._overlayModel.get('visible');
    this.$('.js-overlay').toggleClass('is-disabled', isDisabled);
  },

  _onChangeState: function () {
    this._editorModel.set({ disabled: this._isErrored() });
  },

  _onChangeEdition: function () {
    this._infoboxState();

    var edition = this._editorModel.get('edition');
    this._handleEditorContent(edition);

    var index = edition ? 1 : 0;
    this._collectionPane.at(index).set({ selected: true });
    this._togglerModel.set({ active: edition });
  },

  _onChangeDisabled: function () {
    var disabled = this._editorModel.get('disabled');
    this._togglerModel.set({ disabled: disabled });
  },

  _onTogglerChanged: function () {
    var checked = this._togglerModel.get('active');
    this._editorModel.set({ edition: checked });
  },

  _initViews: function () {
    var self = this;

    var infoboxSstates = [
      {
        state: 'html-legend',
        createContentView: function () {
          return Infobox.createWithAction({
            type: 'alert',
            title: _t('editor.legend.messages.custom-legend.title'),
            body: _t('editor.legend.messages.custom-legend.body'),
            mainAction: {
              label: _t('editor.legend.messages.custom-legend.accept')
            }
          });
        },
        mainAction: self._deleteCustomHtmlLegend.bind(self)
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
        state: 'legends-disabled',
        createContentView: function () {
          return Infobox.createWithAction({
            type: 'alert',
            title: _t('editor.legend.messages.legends-disabled.title'),
            body: _t('editor.legend.messages.legends-disabled.body'),
            mainAction: {
              label: _t('editor.legend.messages.legends-disabled.show')
            }
          });
        },
        mainAction: self._enableLegends.bind(self)
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

  _showHiddenLayer: function () {
    var savingOptions = {
      shouldPreserveAutoStyle: true
    };
    this._layerDefinitionModel.toggleVisible();
    this._userActions.saveLayer(this._layerDefinitionModel, savingOptions);
  },

  _deleteCustomHtmlLegend: function () {
    var type = this._legendDefinitionModel.get('type');
    this._legendDefinitionModel && this._legendDefinitionModel.set({
      html: ''
    });
    LegendFactory.createLegend(this._layerDefinitionModel, type);
    this._infoboxState();
  },

  _saveLegendHTML: function () {
    var content = this._codemirrorModel.get('content');
    var type = this._legendDefinitionModel.get('type');
    var parts;

    if (type === 'custom') {
      this._legendDefinitionModel && this._legendDefinitionModel.set({
        html: content
      });
    } else {
      parts = content.split(PLACEHOLDER).map(function (part) {
        return cdb.core.sanitize.html(part);
      });

      this._legendDefinitionModel && this._legendDefinitionModel.set({
        preHTMLSnippet: parts[0],
        postHTMLSnippet: parts[1]
      });
    }

    MetricsTracker.track('Used advanced mode', {
      mode_type: 'legend'
    });

    LegendFactory.createLegend(this._layerDefinitionModel, type);
  },

  _infoboxState: function () {
    var edition = this._editorModel.get('edition');

    if (!edition && this._areLegendsDisabled()) {
      this._infoboxModel.set({ state: 'legends-disabled' });
      this._overlayModel.set({ visible: true });
      this._togglerModel.set({ disabled: true });
    } else if (!edition && this._legendDefinitionModel.hasCustomHtml()) {
      this._infoboxModel.set({ state: 'html-legend' });
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

  _areLegendsDisabled: function () {
    return this._mapDefinitionModel.get('legends') === false;
  },

  _enableLegends: function () {
    this._mapDefinitionModel.save({legends: true});
  },

  // we need to update the reference to the model
  _updateLegend: function (newLegendDefModel) {
    this._legendDefinitionModel = newLegendDefModel;
  },

  _configPanes: function () {
    var self = this;
    var tabPaneTabs = [{
      selected: !self._legendDefinitionModel.hasCustomHtml(),
      createContentView: function () {
        return new ScrollView({
          createContentView: function () {
            return new LegendContentView({
              className: 'Editor-content',
              editorModel: self._editorModel,
              legendTypes: self.legendTypes,
              layerDefinitionModel: self._layerDefinitionModel,
              legendDefinitionModel: self._getUserLegend(self.legendTypes),
              legendDefinitionsCollection: self._legendDefinitionsCollection,
              updateLegend: self._updateLegend.bind(self),
              type: self._type,
              userModel: self._userModel,
              configModel: self._configModel,
              modals: self._modals
            });
          }
        });
      },
      createActionView: function () {
        return new CoreView();
      }
    }, {
      selected: self._legendDefinitionModel.hasCustomHtml(),
      createContentView: function () {
        return new LegendEditorView({
          isCustom: self._legendDefinitionModel.get('type') === 'custom',
          codemirrorModel: self._codemirrorModel,
          onApplyEvent: self._saveLegendHTML.bind(self)
        });
      },
      createActionView: function () {
        return new ApplyButtonView({
          onApplyClick: self._saveLegendHTML.bind(self),
          overlayModel: self._overlayModel
        });
      }
    }];

    this._collectionPane = new TabPaneCollection(tabPaneTabs);
  }
});
