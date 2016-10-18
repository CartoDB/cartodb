var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var LegendColorView = require('./color/legend-color-view');
var LegendSizeView = require('./size/legend-size-view');
var createTextLabelsTabPane = require('../../../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('../../../tab-pane-submenu.tpl');
var sqlErrorTemplate = require('./legend-content-sql-error.tpl');
var actionErrorTemplate = require('../../sql-error-action.tpl');
var QuerySanity = require('../../query-sanity-check');

var STATES = {
  ready: 'ready',
  loading: 'loading',
  fetched: 'fetched',
  error: 'error'
};

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('Layer definition is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.legendDefinitionsCollection) throw new Error('legendDefinitionsCollection is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._querySchemaModel = opts.querySchemaModel;
    this._editorModel = opts.editorModel;
    this._userActions = opts.userActions;
    this._legendDefinitionsCollection = opts.legendDefinitionsCollection;

    this.modelView = new Backbone.Model({
      state: this._getInitialState()
    });

    this._initBinds();

    // In order to handle sql errors
    QuerySanity.track(this, this.render.bind(this));
  },

  render: function () {
    this._unbindEvents();
    this.clearSubViews();
    this.$el.empty();

    if (this._hasError()) {
      this._renderError();
    } else {
      this._initViews();
    }

    return this;
  },

  _initBinds: function () {
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

  _initViews: function () {
    var self = this;

    var tabPaneTabs = [{
      name: 'color',
      label: _t('editor.legend.menu-tab-pane-labels.color'),
      createContentView: function () {
        return new LegendColorView({
          className: 'Editor-content',
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

    this._bindEvents();
  },

  _changeStyle: function (m) {
    this._layerTabPaneView.changeStyleMenu(m);
  },

  _unbindEvents: function () {
    if (this._layerTabPaneView && this._layerTabPaneView.collection) {
      this._layerTabPaneView.collection.off('change:selected', this._quitEditing, this);
    }
  },

  _bindEvents: function () {
    this._layerTabPaneView.collection.on('change:selected', this._quitEditing, this);
    this.add_related_model(this._layerTabPaneView.collection);
  },

  _quitEditing: function () {
    this._editorModel.set({edition: false});
  }

});
