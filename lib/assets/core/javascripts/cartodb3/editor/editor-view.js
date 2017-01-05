var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var createTextLabelsTabPane = require('../components/tab-pane/create-text-labels-tab-pane');
var AddWidgetsView = require('../components/modals/add-widgets/add-widgets-view');
var AddLayerView = require('../components/modals/add-layer/add-layer-view');
var AddLayerModel = require('../components/modals/add-layer/add-layer-model');
var StackLayoutView = require('../components/stack-layout/stack-layout-view');
var Header = require('./editor-header.js');
var EditorTabPaneTemplate = require('./editor-tab-pane.tpl');
var EditorWidgetsView = require('./widgets/widgets-view');
var LayersView = require('./layers/layers-view');
var ScrollView = require('../components/scroll/scroll-view');
var PanelWithOptionsView = require('../components/view-options/panel-with-options-view');
var ShareButtonView = require('./layers/share-button-view');
var PublishView = require('../components/modals/publish/publish-view');

module.exports = CoreView.extend({
  events: {
    'click .js-add': '_addItem'
  },

  initialize: function (opts) {
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    if (!opts.visDefinitionModel) throw new Error('visDefinitionModel is required');
    if (!opts.privacyCollection) throw new Error('privacyCollection is required');
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.mapStackLayoutModel) throw new Error('mapStackLayoutModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.pollingModel) throw new Error('pollingModel is required');
    if (!opts.stateDefinitionModel) throw new Error('stateDefinitionModel is required');

    this._userActions = opts.userActions;
    this._modals = opts.modals;
    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this._editorModel = opts.editorModel;
    this._pollingModel = opts.pollingModel;
    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._privacyCollection = opts.privacyCollection;
    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
    this._mapcapsCollection = opts.mapcapsCollection;
    this._visDefinitionModel = opts.visDefinitionModel;
    this._mapStackLayoutModel = opts.mapStackLayoutModel;
    this._stateDefinitionModel = opts.stateDefinitionModel;

    this._updatedModel = new Backbone.Model({
      date: ''
    });

    this._initBinds();
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
                      userActions: self._userActions,
                      layerDefinitionsCollection: self._layerDefinitionsCollection,
                      analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
                      stackLayoutModel: self._mapStackLayoutModel,
                      stateDefinitionModel: self._stateDefinitionModel
                    });
                  }
                });
              },
              createActionView: function () {
                return new ShareButtonView({
                  visDefinitionModel: self._visDefinitionModel,
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
      name: 'widgets',
      label: _t('editor.tab-pane.widgets.title-label'),
      selected: this.options.selectedTabItem === 'widgets',
      createContentView: function () {
        var widgetsStackViewCollection = new Backbone.Collection([{
          createStackView: function (stackLayoutModel, opts) {
            return new PanelWithOptionsView({
              className: 'Editor-content',
              editorModel: self._editorModel,
              createContentView: function () {
                return new ScrollView({
                  createContentView: function () {
                    return new EditorWidgetsView({
                      userActions: self._userActions,
                      modals: self._modals,
                      layerDefinitionsCollection: self._layerDefinitionsCollection,
                      widgetDefinitionsCollection: self._widgetDefinitionsCollection,
                      stackLayoutModel: self._mapStackLayoutModel
                    });
                  }
                });
              },
              createActionView: function () {
                return new ShareButtonView({
                  visDefinitionModel: self._visDefinitionModel,
                  onClickAction: self._share.bind(self)
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
      mapcapsCollection: self._mapcapsCollection,
      modals: self._modals,
      visDefinitionModel: self._visDefinitionModel,
      privacyCollection: self._privacyCollection,
      onClickPrivacy: self._share.bind(self),
      onRemoveMap: self._onRemoveMap.bind(self),
      configModel: self._configModel,
      userModel: self._userModel
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

  _initBinds: function () {
    this._widgetDefinitionsCollection.on('reset remove add', this._updateAddButtonState, this);
    this.add_related_model(this._widgetDefinitionsCollection);

    this._editorModel.on('change:edition', this._changeStyle, this);
    this.add_related_model(this._editorModel);

    this._layerDefinitionsCollection.on('reset remove add', this._updateAddButtonState, this);
    this._layerDefinitionsCollection.bind('add', function () {
      this._visDefinitionModel.fetch();
    }, this);
    this.add_related_model(this._layerDefinitionsCollection);
  },

  _onRemoveMap: function () {
    window.location = this._userModel.get('base_url');
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
      case 'layers': return this._addLayer();
      case 'widgets': return this._addWidget();
    }
  },

  _addLayer: function () {
    var self = this;
    var modal = this._modals.create(function (modalModel) {
      var addLayerModel = new AddLayerModel({}, {
        userModel: self._userModel,
        userActions: self._userActions,
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
        userModel: self._userModel,
        userActions: self._userActions,
        configModel: self._configModel,
        analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
        layerDefinitionsCollection: self._layerDefinitionsCollection,
        widgetDefinitionsCollection: self._widgetDefinitionsCollection
      });
    });
  },

  _share: function () {
    var self = this;

    this._modals.create(function (modalModel) {
      return new PublishView({
        mapcapsCollection: self._mapcapsCollection,
        modalModel: modalModel,
        visDefinitionModel: self._visDefinitionModel,
        privacyCollection: self._privacyCollection,
        userModel: self._userModel,
        configModel: self._configModel
      });
    });
  },

  _changeStyle: function (m) {
    this.$el.toggleClass('is-dark');
    this._mapTabPaneView.changeStyleMenu(m);
  },

  _setUpdateFromCreation: function () {
    this._updatedModel.set({date: this._visDefinitionModel.get('created_at')});
  },

  _setUpdateFromMapcap: function (mapcaps) {
    this._updatedModel.set({date: mapcaps[0].created_at});
  },

  _getMapcaps: function () {
    var updateFromCreation = this._setUpdateFromCreation.bind(this);
    var updateFromMapcap = this._setUpdateFromMapcap.bind(this);
    var url = this._visDefinitionModel.mapcapsURL();
    var data = {
      api_key: this._configModel.get('api_key')
    };

    $.get(url, data)
    .done(function (data) {
      if (data.length > 0) {
        updateFromMapcap(data);
      } else {
        updateFromCreation();
      }
    })
    .fail(function () {
      updateFromCreation();
    });
  }
});
