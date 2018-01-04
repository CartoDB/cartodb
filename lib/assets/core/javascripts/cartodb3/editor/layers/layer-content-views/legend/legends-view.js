var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var LegendColorView = require('./color/legend-color-view');
var LegendSizeView = require('./size/legend-size-view');
var createTextLabelsTabPane = require('../../../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('../../../tab-pane-submenu.tpl');
var sqlErrorTemplate = require('./legend-content-sql-error.tpl');
var actionErrorTemplate = require('../../sql-error-action.tpl');
var legendNoGeometryTemplate = require('./legend-no-geometry-template.tpl');
var checkAndBuildOpts = require('../../../../helpers/required-opts');
var InfoboxModel = require('../../../../components/infobox/infobox-model');

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
  'modals',
  'layerContentModel'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initModels();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._isErrored()) {
      this._renderError();
    } else {
      this._initViews();
    }

    return this;
  },

  _initModels: function () {
    this._infoboxModel = new InfoboxModel({
      state: this._isLayerHidden() ? 'layer-hidden' : ''
    });

    this._overlayModel = new Backbone.Model({
      visible: this._isLayerHidden()
    });
  },

  _isLayerHidden: function () {
    return this._layerDefinitionModel.get('visible') === false;
  },

  _initBinds: function () {
    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);
    this.listenTo(this._queryGeometryModel, 'change:status', this._onGeometryChanged);
  },

  _onQueryChanged: function () {
    if (this._isErrored()) {
      this.render();
    }
  },

  _isErrored: function () {
    return this._layerContentModel.isErrored();
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

  _renderEmptyGeometry: function () {
    this.$el.append(legendNoGeometryTemplate());
  },

  _initViews: function () {
    var self = this;

    var tabPaneTabs = [{
      name: 'color',
      label: _t('editor.legend.menu-tab-pane-labels.color'),
      createContentView: function () {
        return new LegendColorView({
          className: 'Editor-content js-type',
          mapDefinitionModel: self._mapDefinitionModel,
          editorModel: self._editorModel,
          userActions: self._userActions,
          layerContentModel: self._layerContentModel,
          layerDefinitionModel: self._layerDefinitionModel,
          legendDefinitionsCollection: self._legendDefinitionsCollection,
          type: 'color',
          userModel: self._userModel,
          configModel: self._configModel,
          modals: self._modals,
          overlayModel: self._overlayModel,
          infoboxModel: self._infoboxModel
        });
      }
    }, {
      name: 'size',
      label: _t('editor.legend.menu-tab-pane-labels.size'),
      createContentView: function () {
        return new LegendSizeView({
          className: 'Editor-content js-type',
          mapDefinitionModel: self._mapDefinitionModel,
          editorModel: self._editorModel,
          userActions: self._userActions,
          userModel: self._userModel,
          configModel: self._configModel,
          modals: self._modals,
          layerContentModel: self._layerContentModel,
          layerDefinitionModel: self._layerDefinitionModel,
          legendDefinitionsCollection: self._legendDefinitionsCollection,
          type: 'size',
          overlayModel: self._overlayModel,
          infoboxModel: self._infoboxModel
        });
      }
    }];

    var tabPaneOptions = {
      tabPaneOptions: {
        template: TabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          klassName: 'CDB-NavSubmenu-item'
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
