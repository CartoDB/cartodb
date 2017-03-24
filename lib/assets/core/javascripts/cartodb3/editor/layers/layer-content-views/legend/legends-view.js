var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var LegendColorView = require('./color/legend-color-view');
var LegendSizeView = require('./size/legend-size-view');
var createTextLabelsTabPane = require('../../../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('../../../tab-pane-submenu.tpl');
var sqlErrorTemplate = require('./legend-content-sql-error.tpl');
var actionErrorTemplate = require('../../sql-error-action.tpl');
var loadingTemplate = require('../../panel-loading-template.tpl');
var legendNoGeometryTemplate = require('./legend-no-geometry-template.tpl');
var QuerySanity = require('../../query-sanity-check');
var georeferencePlaceholderTemplate = require('./georeference-placeholder.tpl');
var checkAndBuildOpts = require('../../../../helpers/required-opts');
var Infobox = require('../../../../components/infobox/infobox-factory');
var InfoboxModel = require('../../../../components/infobox/infobox-model');
var InfoboxCollection = require('../../../../components/infobox/infobox-collection');
var PanelWithOptionsView = require('../../../../components/view-options/panel-with-options-view');
var ViewFactory = require('../../../../components/view-factory');
var panelTemplate = require('./panel-with-options.tpl');
var OverlayView = require('../../../components/overlay/overlay-view');
var fetchAllQueryObjectsIfNecessary = require('../../../../helpers/fetch-all-query-objects');

var STATES = {
  ready: 'ready',
  loading: 'loading',
  fetched: 'fetched',
  error: 'error'
};

var REQUIRED_OPTS = [
  'mapDefinitionModel',
  'userActions',
  'layerDefinitionModel',
  'queryGeometryModel',
  'querySchemaModel',
  'queryRowsCollection',
  'legendDefinitionsCollection',
  'editorModel',
  'userModel',
  'configModel',
  'modals'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._layerInfowindowModel = this._layerDefinitionModel.infowindowModel;
    this._layerTooltipModel = this._layerDefinitionModel.tooltipModel;

    this._initModels();
    this._initBinds();

    this._fetchAllQueryObjectsIfNecessary();

    // In order to handle sql errors
    QuerySanity.track(this, this._onQueryChanged.bind(this));
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._queryGeometryModel.isFetching()) {
      this._renderLoading();
    } else if (this._hasError()) {
      this._renderError();
    } else if (this._queryGeometryModel.hasValue()) {
      this._initViews();
    } else {
      if (this._layerDefinitionModel.canBeGeoreferenced()) {
        this._renderGeoreferencePlaceholder();
      } else {
        this._renderEmptyGeometry();
      }
    }

    this._renderOverlay();
    return this;
  },

  _renderOverlay: function () {
    var view = new OverlayView({
      overlayModel: this._overlayModel
    });
    this.addView(view);
    this.$('.js-content').append(view.render().el);
  },

  _initModels: function () {
    this._infoboxModel = new InfoboxModel({
      state: this._isLayerHidden() ? 'layer-hidden' : ''
    });

    this._overlayModel = new Backbone.Model({
      visible: this._isLayerHidden()
    });

    this.modelView = new Backbone.Model({
      state: this._getInitialState()
    });
  },

  _isLayerHidden: function () {
    return this._layerDefinitionModel.get('visible') === false;
  },

  _initBinds: function () {
    this.listenTo(this._querySchemaModel, 'change:status', this._onStatusChanged);
    this.listenTo(this._queryGeometryModel, 'change:status', this._onStatusChanged);
    this.listenTo(this._queryRowsCollection.statusModel, 'change:status', this._onStatusChanged);
    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);

    // If there is a change in the node query (we check queryGeometryModel because is the last query element set)
    // we should fetch all objects (necessary in this case)
    this.listenTo(this._queryGeometryModel, 'change:query', function () {
      this._queryGeometryModel.set('status', 'unfetched');
      this._fetchAllQueryObjectsIfNecessary();
    });
    this.listenTo(this._queryGeometryModel, 'change:status', this._onGeometryChanged);
    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);
  },

  _fetchAllQueryObjectsIfNecessary: function () {
    fetchAllQueryObjectsIfNecessary({
      queryRowsCollection: this._queryRowsCollection,
      queryGeometryModel: this._queryGeometryModel,
      querySchemaModel: this._querySchemaModel
    });
  },

  _onStatusChanged: function () {
    if (this._querySchemaModel.isFetched() &&
        this._queryGeometryModel.isFetched() &&
        this._queryRowsCollection.isFetched()) {
      this.render();
    }
  },

  _onQueryChanged: function () {
    if (this._hasError()) {
      this.render();
    }
  },

  _getInitialState: function () {
    return STATES.ready;
  },

  _hasError: function () {
    return this.modelView.get('state') === STATES.error;
  },

  _renderError: function () {
    this.$el.append(
      sqlErrorTemplate({
        body: _t('editor.error-query.body', {
          action: actionErrorTemplate({
            label: _t('editor.error-query.label')
          })
        })
      })
    );
  },

  _renderGeoreferencePlaceholder: function () {
    var self = this;

    var infoboxSstates = [
      {
        state: 'layer-hidden',
        createContentView: function () {
          return Infobox.createWithAction({
            type: 'alert',
            title: _t('editor.infowindow.messages.layer-hidden.title'),
            body: _t('editor.infowindow.messages.layer-hidden.body'),
            mainAction: {
              label: _t('editor.infowindow.messages.layer-hidden.show')
            }
          });
        },
        mainAction: self._showHiddenLayer.bind(self)
      }
    ];

    var infoboxCollection = new InfoboxCollection(infoboxSstates);

    var panelWithOptionsView = new PanelWithOptionsView({
      template: panelTemplate,
      className: 'Editor-content',
      editorModel: self._editorModel,
      infoboxModel: self._infoboxModel,
      infoboxCollection: infoboxCollection,
      createContentView: function () {
        return ViewFactory.createByHTML(georeferencePlaceholderTemplate());
      }
    });

    this.$el.append(panelWithOptionsView.render().el);
    this.addView(panelWithOptionsView);
  },

  _renderEmptyGeometry: function () {
    this.$el.append(legendNoGeometryTemplate());
  },

  _renderLoading: function () {
    this.$el.append(loadingTemplate());
  },

  _initViews: function () {
    var self = this;

    var tabPaneTabs = [{
      name: 'color',
      label: _t('editor.legend.menu-tab-pane-labels.color'),
      createContentView: function () {
        return new LegendColorView({
          className: 'Editor-content',
          mapDefinitionModel: self._mapDefinitionModel,
          editorModel: self._editorModel,
          userActions: self._userActions,
          modelView: self.modelView,
          layerDefinitionModel: self._layerDefinitionModel,
          legendDefinitionsCollection: self._legendDefinitionsCollection,
          type: 'color',
          userModel: self._userModel,
          configModel: self._configModel,
          modals: self._modals
        });
      }
    }, {
      name: 'size',
      label: _t('editor.legend.menu-tab-pane-labels.size'),
      createContentView: function () {
        return new LegendSizeView({
          className: 'Editor-content',
          mapDefinitionModel: self._mapDefinitionModel,
          editorModel: self._editorModel,
          userActions: self._userActions,
          userModel: self._userModel,
          configModel: self._configModel,
          modals: self._modals,
          modelView: self.modelView,
          layerDefinitionModel: self._layerDefinitionModel,
          legendDefinitionsCollection: self._legendDefinitionsCollection,
          type: 'size'
        });
      }
    }];

    var tabPaneOptions = {
      tabPaneOptions: {
        template: TabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'CDB-NavSubmenu-item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavSubmenu-link u-upperCase'
      }
    };

    this._layerTabPaneView = createTextLabelsTabPane(tabPaneTabs, tabPaneOptions);
    this.$el.append(this._layerTabPaneView.render().$el);
    this.addView(this._layerTabPaneView);
    this._changeStyle(this._editorModel);
  },

  _changeStyle: function (m) {
    this._layerTabPaneView.changeStyleMenu(m);
  },

  _showHiddenLayer: function () {
    var savingOptions = {
      shouldPreserveAutoStyle: true
    };
    this._layerDefinitionModel.toggleVisible();
    this._userActions.saveLayer(this._layerDefinitionModel, savingOptions);
  }
});
