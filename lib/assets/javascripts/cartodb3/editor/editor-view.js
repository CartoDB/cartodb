var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var createTextLabelsTabPane = require('../components/tab-pane/create-text-labels-tab-pane');
var AddWidgetsView = require('../components/modals/add-widgets/add-widgets-view');
var AddLayerView = require('../components/modals/add-layer/add-layer-view');
var AddLayerModel = require('../components/modals/add-layer/add-layer-model');
var StackLayoutView = require('../components/stack-layout/stack-layout-view');
var PrivacyView = require('../components/modals/privacy/privacy-view');
var CreatePrivacyOptions = require('../components/modals/privacy/create-privacy-options');
var PrivacyCollection = require('../components/modals/privacy/privacy-collection');
var CreateShareOptions = require('../components/modals/share/create-share-options');
var ShareCollection = require('../components/modals/share/share-collection');
var Header = require('./editor-header.js');
var EditorTabPaneTemplate = require('./editor-tab-pane.tpl');
var EditorWidgetsView = require('./widgets/widgets-view');
var LayersView = require('./layers/layers-view');
var ScrollView = require('../components/scroll/scroll-view');
var PanelWithOptionsView = require('./components/view-options/panel-with-options-view');
var ShareView = require('../components/modals/share/share-view');
var ShareButtonView = require('./layers/share-button-view');

module.exports = CoreView.extend({
  events: {
    'click .js-add': '_addItem'
  },

  initialize: function (opts) {
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');
    if (!opts.analysis) throw new Error('analysis is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.mapStackLayoutModel) throw new Error('mapStackLayoutModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.pollingModel) throw new Error('pollingModel is required');

    this._analysis = opts.analysis;
    this._modals = opts.modals;
    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this._editorModel = opts.editorModel;
    this._pollingModel = opts.pollingModel;
    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
    this._visDefinitionModel = opts.visDefinitionModel;
    this._mapStackLayoutModel = opts.mapStackLayoutModel;

    var privacyOptions = CreatePrivacyOptions(this._visDefinitionModel, this._userModel);
    this._privacyCollection = new PrivacyCollection(privacyOptions);

    var shareOptions = CreateShareOptions(this._visDefinitionModel);
    this._shareCollection = new ShareCollection(shareOptions);

    this._layerDefinitionsCollection.on('reset remove add', this._updateAddButtonState, this);
    this._widgetDefinitionsCollection.on('reset remove add', this._updateAddButtonState, this);
    this._editorModel.on('change:edition', this._changeStyle, this);
    this.add_related_model(this._editorModel);
  },

  render: function () {
    var self = this;

    var tabPaneTabs = [{
      name: 'layers',
      label: _t('editor.tab-pane.layers.title-label'),
      selected: this.options.selectedTabItem === 'layers',
      createContentView: function () {
        var layersStackViewCollection = new Backbone.Collection([{
          createStackView: function (stackLayoutModel, opts) {
            return new PanelWithOptionsView({
              className: 'Editor-content',
              editorModel: self._editorModel,
              createContentView: function () {
                return new ScrollView({
                  createContentView: function () {
                    return new LayersView({
                      modals: self._modals,
                      userModel: self._userModel,
                      editorModel: self._editorModel,
                      configModel: self._configModel,
                      layerDefinitionsCollection: self._layerDefinitionsCollection,
                      analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
                      analysis: self._analysis,
                      stackLayoutModel: self._mapStackLayoutModel,
                    });
                  }
                });
              },
              createActionView: function () {
                return new ShareButtonView({
                  onClickAction: self._share.bind(self)
                });
              }
            });
          }

        }]);

        return new StackLayoutView({
          className: 'Editor-content',
          collection: layersStackViewCollection
        });
      }
    }, {
      name: 'elements',
      label: _t('editor.tab-pane.elements.title-label'),
      selected: this.options.selectedTabItem === 'elements',
      createContentView: function () {
        return new CoreView();
      }
    }, {
      name: 'widgets',
      label: _t('editor.tab-pane.widgets.title-label'),
      selected: this.options.selectedTabItem === 'widgets',
      createContentView: function () {
        var widgetsStackViewCollection = new Backbone.Collection([{
          createStackView: function (stackLayoutModel, opts) {
            return new ScrollView({
              createContentView: function () {
                return new EditorWidgetsView({
                  modals: self._modals,
                  configModel: self._configModel,
                  layerDefinitionsCollection: self._layerDefinitionsCollection,
                  widgetDefinitionsCollection: self._widgetDefinitionsCollection,
                  stackLayoutModel: self._mapStackLayoutModel
                });
              }
            });
          }
        }]);

        return new StackLayoutView({
          className: 'Editor-content',
          collection: widgetsStackViewCollection
        });
      }
    }];

    var header = new Header({
      editorModel: self._editorModel,
      visDefinitionModel: self._visDefinitionModel,
      privacyCollection: self._privacyCollection,
      onClickPrivacy: self._changePrivacy.bind(self)
    });

    this.$el.append(header.render().$el);
    this.addView(header);

    var tabPaneOptions = {
      tabPaneOptions: {
        template: EditorTabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'CDB-NavMenu-item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavMenu-link u-upperCase'
      }
    };

    this._mapTabPaneView = createTextLabelsTabPane(tabPaneTabs, tabPaneOptions);
    this._mapTabPaneView.collection.bind('change:selected', this._updateAddButtonState, this);

    this.$el.append(this._mapTabPaneView.render().$el);
    this.addView(this._mapTabPaneView);

    this._updateAddButtonState();

    return this;
  },

  _hideAddButton: function () {
    this.$('.js-add').addClass('is-hidden');
  },

  _showAddButton: function () {
    this.$('.js-add').removeClass('is-hidden');
  },

  _updateAddButtonState: function () {
    this._hideAddButton();

    switch (this._mapTabPaneView.getSelectedTabPaneName()) {
      case 'widgets':
        if (this._widgetDefinitionsCollection.size()) {
          this._showAddButton();
        }
        break;
      case 'layers':
        if (this._layerDefinitionsCollection.size()) {
          this._showAddButton();
        }
        break;
      case 'elements':
        // TODO: trigger element creation
        break;
    }
  },

  _addItem: function () {
    switch (this._mapTabPaneView.getSelectedTabPaneName()) {
      case 'widgets': this._addWidget();
        break;
      case 'layers': this._addLayer();
        break;
      case 'elements':
        // TODO: trigger element creation
        break;
    }
  },

  _addLayer: function () {
    var self = this;
    var modal = this._modals.create(function (modalModel) {
      var addLayerModel = new AddLayerModel({}, {
        userModel: self._userModel,
        layerDefinitionsCollection: self._layerDefinitionsCollection,
        configModel: self._configModel,
        pollingModel: self._pollingModel
      });

      return new AddLayerView({
        modalModel: modalModel,
        configModel: self._configModel,
        userModel: self._userModel,
        createModel: addLayerModel,
        pollingModel: self._pollingModel
      });
    });
    modal.show();
  },

  _addWidget: function () {
    var self = this;

    this._modals.create(function (modalModel) {
      return new AddWidgetsView({
        modalModel: modalModel,
        configModel: self._configModel,
        layerDefinitionsCollection: self._layerDefinitionsCollection,
        widgetDefinitionsCollection: self._widgetDefinitionsCollection
      });
    });
  },

  _share: function () {
    var self = this;

    this._modals.create(function (modalModel) {
      return new ShareView({
        collection: self._shareCollection,
        modalModel: modalModel,
        configModel: self._configModel,
        visDefinitionModel: self._visDefinitionModel,
        userModel: self._userModel,
        onChangePrivacy: self._changePrivacy.bind(self)
      });
    });
  },

  _changePrivacy: function () {
    var self = this;

    this._modals.create(function (modalModel) {
      return new PrivacyView({
        modalModel: modalModel,
        configModel: self._configModel,
        userModel: self._userModel,
        visDefinitionModel: self._visDefinitionModel,
        privacyCollection: self._privacyCollection
      });
    });
  },

  _changeStyle: function (m) {
    this.$el.toggleClass('is-dark');
    this._mapTabPaneView.changeStyleMenu(m);
  }
});
