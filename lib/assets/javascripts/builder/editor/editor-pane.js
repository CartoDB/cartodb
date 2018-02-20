var $ = require('jquery');
var Backbone = require('backbone');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var createTextLabelsTabPaneRouted = require('builder/components/tab-pane/create-text-labels-tab-pane-routed');
var Header = require('./editor-header.js');
var EditorTabPaneTemplate = require('./editor-tab-pane.tpl');
var EditorWidgetsView = require('./widgets/widgets-view');
var LayersView = require('./layers/layers-view');
var ScrollView = require('builder/components/scroll/scroll-view');
var PanelWithOptionsView = require('builder/components/view-options/panel-with-options-view');
var ShareButtonView = require('./layers/share-button-view');
var PublishView = require('builder/components/modals/publish/publish-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var Infobox = require('builder/components/infobox/infobox-factory');
var InfoboxModel = require('builder/components/infobox/infobox-model');
var InfoboxCollection = require('builder/components/infobox/infobox-collection');
var AppNotifications = require('builder/app-notifications');
var zoomToData = require('./map-operations/zoom-to-data');
var Router = require('builder/routes/router');

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
  'stateDefinitionModel',
  'selectedTabItem',
  'mapStackLayoutModel',
  'routeModel'
];

var LAYERS_TAB_NAME = 'layers';
var WIDGETS_TAB_NAME = 'widgets';
var MAX_LAYERS_REACHED = 'MAX_LAYERS_REACHED';
var ORIGIN_TABLE = 'table';

module.exports = CoreView.extend({

  className: 'Editor-content',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initModels();
    this._initBinds();

    this._zoomToData = zoomToData; // For using Dependency Injection in specs
  },

  render: function () {
    var self = this;

    var count = this._getDataLayerCount();
    var max = this._getMaxCount();

    this.clearSubViews();
    this.$el.empty();

    var infoboxStates = [
      this._getMaxLayerInfoBoxForCurrentUser(),
      this._getUnknownErrorInfobox(),
      this._getLimitInfobox('interactivity'),
      this._getLimitInfobox('limit')
    ];

    this._infoboxModel = new InfoboxModel({
      state: null
    });

    var infoboxCollection = new InfoboxCollection(infoboxStates);

    var tabPaneTabs = [{
      name: LAYERS_TAB_NAME,
      label: this._getTranslatedLayersLabel(count, max),
      selected: this._selectedTabItem === LAYERS_TAB_NAME,
      onClick: function () { Router.goToLayerList(); },
      createContentView: function () {
        return new PanelWithOptionsView({
          className: 'Editor-content js-editorPanelContent',
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
                  pollingModel: self._pollingModel,
                  userActions: self._userActions,
                  layerDefinitionsCollection: self._layerDefinitionsCollection,
                  analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
                  stateDefinitionModel: self._stateDefinitionModel,
                  widgetDefinitionsCollection: self._widgetDefinitionsCollection,
                  visDefinitionModel: self._visDefinitionModel,
                  showMaxLayerError: self._infoboxState.bind(self)
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
    }, {
      name: 'widgets',
      label: _t('editor.tab-pane.widgets.title-label'),
      selected: this._selectedTabItem === WIDGETS_TAB_NAME,
      onClick: function () { Router.goToWidgetList(); },
      createContentView: function () {
        return new PanelWithOptionsView({
          className: 'Editor-content',
          editorModel: self._editorModel,
          infoboxModel: self._infoboxModel,
          infoboxCollection: infoboxCollection,
          createContentView: function () {
            return new ScrollView({
              createContentView: function () {
                return new EditorWidgetsView({
                  userActions: self._userActions,
                  modals: self._modals,
                  layerDefinitionsCollection: self._layerDefinitionsCollection,
                  widgetDefinitionsCollection: self._widgetDefinitionsCollection,
                  analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
                  userModel: self._userModel,
                  configModel: self._configModel,
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
    }];

    var header = new Header({
      editorModel: self._editorModel,
      mapcapsCollection: self._mapcapsCollection,
      modals: self._modals,
      visDefinitionModel: self._visDefinitionModel,
      privacyCollection: self._privacyCollection,
      clickPrivacyAction: self._share.bind(self),
      onRemoveMap: self._onRemoveMap.bind(self),
      configModel: self._configModel,
      userModel: self._userModel
    });

    header.bind('export-image', this._onExportImage, this);

    this.$el.append(header.render().$el);
    this.addView(header);

    var tabPaneOptions = {
      tabPaneOptions: {
        template: EditorTabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          klassName: 'CDB-NavMenu-item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavMenu-link u-upperCase'
      }
    };

    this._mapTabPaneView = createTextLabelsTabPaneRouted(tabPaneTabs, tabPaneOptions);

    this.$el.append(this._mapTabPaneView.render().$el);
    this.addView(this._mapTabPaneView);

    this._infoboxState();

    return this;
  },

  _initModels: function () {
    this._updatedModel = new Backbone.Model({
      date: ''
    });
  },

  _initBinds: function () {
    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);
    this.listenTo(this._layerDefinitionsCollection, 'add', this._onLayerAdd);
    this.listenTo(this._layerDefinitionsCollection, 'add remove', this._onLayerCountChange);
    this.listenTo(AppNotifications.getCollection(), 'add', this._infoboxState);
    this.listenTo(this._routeModel, 'change:currentRoute', this._handleRoute);
  },

  _handleRoute: function (routeModel) {
    var currentRoute = routeModel.get('currentRoute');

    if (!currentRoute) return;

    var routeName = currentRoute[0];

    if (routeName === WIDGETS_TAB_NAME) {
      this._mapTabPaneView.setSelectedTabPaneByName(WIDGETS_TAB_NAME);
    } else {
      this._mapTabPaneView.setSelectedTabPaneByName(LAYERS_TAB_NAME);
    }
  },

  _onLayerAdd: function (model, collection, options) {
    if (options.origin && options.origin === ORIGIN_TABLE) {
      var nodeModel = model.getAnalysisDefinitionNodeModel();
      var query = nodeModel.querySchemaModel.get('query');

      this._zoomToData(this._configModel, this._stateDefinitionModel, query);
    }

    this._visDefinitionModel.fetch();
  },

  _getMaxLayerTitle: function () {
    return _t('editor.layers.max-layers-infowindow.title');
  },

  _getMaxLayerInfoBoxForCurrentUser: function () {
    var infoboxOpts = {
      type: 'alert',
      title: this._getMaxLayerTitle()
    };

    var baseState = {
      state: MAX_LAYERS_REACHED
    };

    // Open-source / local installation
    if (this._configModel.isHosted()) {
      infoboxOpts.body = _t('editor.layers.max-layers-infowindow.custom.body', { maxLayers: this._getMaxCount() });
      infoboxOpts.mainAction = { label: _t('editor.layers.max-layers-infowindow.custom.contact') };
      baseState.mainAction = function () { window.open(_t('editor.layers.max-layers-infowindow.custom.contact-url')); };
    } else {
      if (this._userModel.isInsideOrg()) {
        if (this._userModel.isOrgAdmin()) {
          infoboxOpts.body = _t('editor.layers.max-layers-infowindow.org-admin.body', { maxLayers: this._getMaxCount() });
          infoboxOpts.mainAction = { label: _t('editor.layers.max-layers-infowindow.org-admin.upgrade') };
        } else {
          infoboxOpts.body = _t('editor.layers.max-layers-infowindow.org.body', { maxLayers: this._getMaxCount() });
          infoboxOpts.mainAction = { label: _t('editor.layers.max-layers-infowindow.org.upgrade') };
        }

        baseState.mainAction = function () { window.open('mailto:' + this._userModel.upgradeContactEmail()); };
      } else {
        baseState.mainAction = function () { window.open(_t('editor.layers.max-layers-infowindow.pricing')); };
        infoboxOpts.body = _t('editor.layers.max-layers-infowindow.regular.body', { maxLayers: this._getMaxCount() });
        infoboxOpts.mainAction = { label: _t('editor.layers.max-layers-infowindow.regular.upgrade') };
      }
    }

    return _.extend(baseState, {
      createContentView: function () {
        return Infobox.createWithAction(infoboxOpts);
      }
    });
  },

  _getUnknownErrorInfobox: function () {
    return {
      state: 'unknown',
      createContentView: function () {
        return Infobox.createWithAction({
          type: 'alert',
          title: _t('editor.messages.generic-error.title'),
          body: _t('editor.messages.generic-error.body'),
          className: 'fs-unknown-tile-error'
        });
      }
    };
  },

  _getLimitInfobox: function (type) {
    var infoboxOpts = {
      type: 'alert',
      title: _t('editor.messages.' + type + '.title'),
      body: _t('editor.messages.' + type + '.body')
    };

    var baseState = {
      state: type
    };

    baseState.closeAction = function () {
      AppNotifications.muteByType(type);
      this._infoboxModel.set('state', null);
    }.bind(this);

    if (!this._configModel.isHosted()) {
      baseState.secondAction = function () {
        window.open(_t('editor.messages.' + type + '.cta.url'));
      };
      infoboxOpts.secondAction = {
        label: _t('editor.messages.' + type + '.cta.label'),
        type: 'secondary'
      };
      infoboxOpts.body = _t('editor.messages.' + type + '.body') + _t('editor.messages.' + type + '.try_to');
    }

    return _.extend(baseState, {
      createContentView: function () {
        return Infobox.createWithAction(infoboxOpts);
      }
    });
  },

  _onLayerCountChange: function () {
    var count = this._getDataLayerCount();
    var max = this._getMaxCount();

    var layersModel = this._mapTabPaneView.getTabPaneCollection().find(function (model) {
      return model.get('name') === LAYERS_TAB_NAME;
    });

    layersModel.set('label', this._getTranslatedLayersLabel(count, max));

    if (count === max) {
      this._infoboxState();
    } else {
      this._infoboxModel.set('state', null);
    }
  },

  _infoboxState: function () {
    var count = this._getDataLayerCount();
    var max = this._getMaxCount();
    var hasLimitError = AppNotifications.getByType('limit');
    var hasUnknownError = AppNotifications.getByType('unknown');
    var hasInteractivityError = AppNotifications.getByType('interactivity');

    if (hasLimitError) {
      this._infoboxModel.set('state', 'limit');
    } else if (hasInteractivityError) {
      this._infoboxModel.set('state', 'interactivity');
    } else if (hasUnknownError) {
      this._infoboxModel.set('state', 'unknown');
    } else if (count === max) {
      this._infoboxModel.set('state', MAX_LAYERS_REACHED);
    } else {
      this._infoboxModel.set('state', null);
    }
  },

  _onExportImage: function () {
    this.trigger('export-image', this);
  },

  _onRemoveMap: function () {
    window.location = this._userModel.get('base_url');
  },

  _getDataLayerCount: function () {
    return this._layerDefinitionsCollection.getNumberOfDataLayers();
  },

  _getMaxCount: function () {
    return this._userModel.get('limits').max_layers;
  },

  _getTranslatedLayersLabel: function (count, max) {
    return _t('editor.tab-pane.layers.title-label', {
      count: count,
      maxCount: max
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
        configModel: self._configModel,
        isOwner: true
      });
    }, {
      breadcrumbsEnabled: true
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
