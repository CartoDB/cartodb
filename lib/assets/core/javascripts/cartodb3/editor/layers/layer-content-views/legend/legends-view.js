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
var AnalysesService = require('../analyses/analyses-service.js');
var Infobox = require('../../../../components/infobox/infobox-factory');
var InfoboxModel = require('../../../../components/infobox/infobox-model');
var InfoboxCollection = require('../../../../components/infobox/infobox-collection');
var PanelWithOptionsView = require('../../../../components/view-options/panel-with-options-view');
var ViewFactory = require('../../../../components/view-factory');
var panelTemplate = require('./panel-with-options.tpl');

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

    if (this._queryGeometryModel.shouldFetch()) {
      this._queryGeometryModel.fetch();
    }

    if (this._querySchemaModel.shouldFetch()) {
      this._querySchemaModel.fetch();
    }

    if (this._queryRowsCollection.shouldFetch()) {
      this._queryRowsCollection.fetch();
    }

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
        var self = this;

        var infoboxSstates = [
          {
            state: 'georeference',
            createContentView: function () {
              var name = this._layerDefinitionModel ? this._layerDefinitionModel.getTableName() : '';
              var body = [_t('editor.tab-pane.layers.georeference.body', { name: name }),
                          _t('editor.layers.georeference.manually-add')].join(' ');

              return Infobox.createWithAction({
                type: 'alert',
                title: _t('editor.tab-pane.layers.georeference.title'),
                body: body,
                mainAction: {
                  label: _t('editor.layers.georeference.georeference-button')
                }
              });
            },
            mainAction: self._onGeoreferenceClicked.bind(self)
          }
        ];

        var infoboxCollection = new InfoboxCollection(infoboxSstates);

        var panelWithOptionsView = new PanelWithOptionsView({
          template: panelTemplate,
          className: 'Editor-content',
          editorModel: self._editorModel,
          infoboxModel: new InfoboxModel({
            state: 'georeference'
          }),
          infoboxCollection: infoboxCollection,
          createContentView: function () {
            return ViewFactory.createByHTML(georeferencePlaceholderTemplate());
          }
        });

        this.$el.append(panelWithOptionsView.render().el);
        this.addView(panelWithOptionsView);
      } else {
        this._renderEmptyGeometry();
      }
    }

    return this;
  },

  _initModels: function () {
    this.modelView = new Backbone.Model({
      state: this._getInitialState()
    });
  },

  _initBinds: function () {
    this.listenTo(this._querySchemaModel, 'change:status', this._onStatusChanged);
    this.listenTo(this._queryGeometryModel, 'change:status', this._onStatusChanged);
    this.listenTo(this._queryRowsCollection.statusModel, 'change:status', this._onStatusChanged);
    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);

    this._queryGeometryModel.bind('change:status', this._onGeometryChanged, this);
    this.add_related_model(this._queryGeometryModel);
    this._editorModel.on('change:edition', this._changeStyle, this);
    this.add_related_model(this._editorModel);
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
    this.$el.append(georeferencePlaceholderTemplate());
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

  _onGeoreferenceClicked: function () {
    AnalysesService.addGeoreferenceAnalysis();
  }
});
