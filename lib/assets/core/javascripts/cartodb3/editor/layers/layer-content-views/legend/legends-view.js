var Backbone = require('backbone');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var LegendColorView = require('./color/legend-color-view');
var LegendSizeView = require('./size/legend-size-view');
var LegendSizeTypes = require('./size/legend-size-types');
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
  'legendDefinitionsCollection',
  'editorModel',
  'userModel',
  'configModel',
  'modals',
  'layerContentModel'
];

var LEGEND_TYPES = {
  color: 'color',
  size: 'size'
};

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

  _initBinds: function () {
    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);
  },

  _isLayerHidden: function () {
    return this._layerDefinitionModel.get('visible') === false;
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
    var tabPaneTabs = [this._getColorTabPaneOptions(), this._getSizeTabPaneOptions()];

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

  _getColorTabPaneOptions: function () {
    var self = this;

    return {
      name: LEGEND_TYPES.color,
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
          type: LEGEND_TYPES.color,
          userModel: self._userModel,
          configModel: self._configModel,
          modals: self._modals,
          overlayModel: self._overlayModel,
          infoboxModel: self._infoboxModel
        });
      }
    };
  },

  _getSizeTabPaneOptions: function () {
    var legendType = LEGEND_TYPES.size;
    var disabled = !this._isStyleCompatible(legendType);
    var self = this;

    return {
      name: legendType,
      label: _t('editor.legend.menu-tab-pane-labels.size'),
      disabled: disabled,
      tooltip: disabled && _t('editor.legend.menu-tab-pane-labels.size-disabled'),
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
          type: legendType,
          overlayModel: self._overlayModel,
          infoboxModel: self._infoboxModel
        });
      }
    };
  },

  _isStyleCompatible: function (legendType) {
    if (legendType === LEGEND_TYPES.size) {
      var isCompatible = _.some(LegendSizeTypes, function (type) {
        var isStyleCompatible = type.isStyleCompatible;

        if (isStyleCompatible) {
          return isStyleCompatible(this._layerDefinitionModel.styleModel);
        }

        return false;
      }, this);

      return isCompatible;
    }

    return true;
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
