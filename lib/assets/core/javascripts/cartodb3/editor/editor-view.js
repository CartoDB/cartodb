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
var checkAndBuildOpts = require('../helpers/required-opts');
var Infobox = require('../components/infobox/infobox-factory');
var InfoboxModel = require('../components/infobox/infobox-model');
var InfoboxCollection = require('../components/infobox/infobox-collection');
var AnalysesService = require('./layers/layer-content-views/analyses/analyses-service.js');

var GEOREFERENCE_KEY = 'georeference';

var REQUIRED_OPTS = [
  'userActions',
  'modals',
  'configModel',
  'userModel',
  'editorModel',
  'pollingModel',
  'analysisDefinitionNodesCollection',
  'layerDefinitionsCollection',
  'privacyCollection',
  'widgetDefinitionsCollection',
  'mapcapsCollection',
  'visDefinitionModel',
  'mapStackLayoutModel',
  'stateDefinitionModel',
  'onboardingNotification'
];

module.exports = CoreView.extend({
  events: {
    'click .js-add': '_addItem'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._nonGeoreferencedLayer = null;
    this._omitLayers = [];

    this._initModels();
    this._initBinds();

    if (this._isGeoreferenceOnboardingEnabled()) {
      this._findNonGeoreferencedLayer();
    }
  },

  render: function () {
    var self = this;

    this.clearSubViews();
    this.$el.html('');

    var tabPaneTabs = [{
      name: 'layers',
      label: _t('editor.tab-pane.layers.title-label'),
      selected: this.options.selectedTabItem === 'layers',
      createContentView: function () {
        var layersStackViewCollection = new Backbone.Collection([{
          createStackView: function (stackLayoutModel, opts) {
            var infoboxSstates = [
              {
                state: 'georeference',
                createContentView: function () {
                  var name = self._nonGeoreferencedLayer ? self._nonGeoreferencedLayer.getTableName() : '';

                  return Infobox.createWithAction({
                    type: 'alert',
                    title: _t('editor.tab-pane.layers.georeference.title'),
                    body: _t('editor.tab-pane.layers.georeference.body', { name: name }),
                    mainAction: {
                      label: _t('editor.tab-pane.layers.georeference.show')
                    }
                  });
                },
                mainAction: self._onGeoreferenceClicked.bind(self)
              }
            ];

            var infoboxCollection = new InfoboxCollection(infoboxSstates);

            return new PanelWithOptionsView({
              className: 'Editor-content',
              editorModel: self._editorModel,
              infoboxModel: self._infoboxModel,
              infoboxCollection: infoboxCollection,
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
                      stateDefinitionModel: self._stateDefinitionModel,
                      widgetDefinitionsCollection: self._widgetDefinitionsCollection,
                      visDefinitionModel: self._visDefinitionModel
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

  _initModels: function () {
    this._updatedModel = new Backbone.Model({
      date: ''
    });

    this._infoboxModel = new InfoboxModel({
      state: ''
    });
  },

  _initBinds: function () {
    this.listenTo(this._widgetDefinitionsCollection, 'reset remove add', this._updateAddButtonState, this);
    this.listenTo(this._editorModel, 'change:edition', this._changeStyle, this);
    this.listenTo(this._layerDefinitionsCollection, 'reset remove add', function () {
      if (this._isGeoreferenceOnboardingEnabled()) {
        this._nonGeoreferencedLayer = null;
        this._infoboxModel.unset('state');

        this._findNonGeoreferencedLayer();
      }

      this._updateAddButtonState();
    }, this);
    this.listenTo(this._layerDefinitionsCollection, 'add', function () {
      this._visDefinitionModel.fetch();
    }, this);
    this.listenTo(this._infoboxModel, 'change:state', this.render, this);
  },

  _findNonGeoreferencedLayer: function () {
    var reverseFiltered = new Backbone.Collection(this._layerDefinitionsCollection.reject(function (layerDefModel) {
      var analysisDefinitionNodeModel = layerDefModel.getAnalysisDefinitionNodeModel();

      return analysisDefinitionNodeModel === void 0 || _(this._omitLayers).contains(layerDefModel.get('id'));
    }, this).reverse());

    reverseFiltered.each(function (layerDefModel) {
      if (!this._nonGeoreferencedLayer) {
        var analysisDefinitionNodeModel = layerDefModel.getAnalysisDefinitionNodeModel();

        var queryGeometryModel = analysisDefinitionNodeModel.queryGeometryModel;
        var querySchemaModel = analysisDefinitionNodeModel.querySchemaModel;
        var queryRowsCollection = analysisDefinitionNodeModel.queryRowsCollection;

        if (queryGeometryModel.shouldFetch()) {
          queryGeometryModel.fetch({
            success: this._findNonGeoreferencedLayer.bind(this)
          });
        }

        if (querySchemaModel.shouldFetch()) {
          querySchemaModel.fetch({
            success: _.debounce(this._findNonGeoreferencedLayer.bind(this), 100)
          });
        }

        if (queryRowsCollection.shouldFetch()) {
          queryRowsCollection.fetch({
            success: this._findNonGeoreferencedLayer.bind(this)
          });
        }

        if (queryGeometryModel.isFetched() && querySchemaModel.isFetched() && queryRowsCollection.isFetched()) {
          if (!queryGeometryModel.hasValue()) {
            if (!layerDefModel.hasAnalyses() &&
                !layerDefModel.isCustomQueryApplied() &&
                !queryRowsCollection.isEmpty()) {
              this._nonGeoreferencedLayer = layerDefModel;
              this._infoboxModel.set('state', 'georeference');
            } else {
              this._omitLayers.push(layerDefModel.get('id'));
              this._findNonGeoreferencedLayer();
            }
          }
        }
      }
    }, this);
  },

  _onGeoreferenceClicked: function () {
    var layerId = this._nonGeoreferencedLayer.get('id');

    AnalysesService.setLayerId(layerId);
    AnalysesService.addGeoreferenceAnalysis();
  },

  _isGeoreferenceOnboardingEnabled: function () {
    return !this._onboardingNotification.getKey(GEOREFERENCE_KEY);
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
