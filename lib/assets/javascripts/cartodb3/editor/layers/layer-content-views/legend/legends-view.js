var _ = require('underscore');
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
  'querySchemaModel',
  'queryGeometryModel',
  'legendDefinitionsCollection',
  'editorModel'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this.modelView = new Backbone.Model({
      state: this._getInitialState()
    });

    this._initBinds();

    if (this._queryGeometryModel.shouldFetch()) {
      this._queryGeometryModel.fetch();
    }

    // In order to handle sql errors
    QuerySanity.track(this, this.render.bind(this));
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._queryGeometryModel.isFetching()) {
      this._renderLoading();
    } else if (this._hasError()) {
      this._renderError();
    } else if (!this._queryGeometryModel.hasValue()) {
      this._renderEmptyGeometry();
    } else {
      this._initViews();
    }

    return this;
  },

  _initBinds: function () {
    this._queryGeometryModel.bind('change:status', this.render, this);
    this.add_related_model(this._queryGeometryModel);
    this._editorModel.on('change:edition', this._changeStyle, this);
    this.add_related_model(this._editorModel);
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
          type: 'color'
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
  }

});
