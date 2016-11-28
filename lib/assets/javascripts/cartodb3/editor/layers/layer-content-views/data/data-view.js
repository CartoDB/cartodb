var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var PanelWithOptionsView = require('../../../../components/view-options/panel-with-options-view');
var ScrollView = require('../../../../components/scroll/scroll-view');
var DatasetBaseView = require('../../../../components/dataset/dataset-base-view');
var DataContentView = require('./data-content-view');
var DataSQLView = require('./data-sql-view');
var TabPaneView = require('../../../../components/tab-pane/tab-pane-view');
var TabPaneCollection = require('../../../../components/tab-pane/tab-pane-collection');
var Toggler = require('../../../../components/toggler/toggler-view');
var UndoButtons = require('../../../../components/undo-redo/undo-redo-view');
var Infobox = require('../../../../components/infobox/infobox-factory');
var InfoboxModel = require('../../../../components/infobox/infobox-model');
var InfoboxCollection = require('../../../../components/infobox/infobox-collection');
var TableStats = require('../../../../components/modals/add-widgets/tablestats');
var DataColumnsModel = require('./data-columns-model');
var SQLUtils = require('../../../../helpers/sql-utils');
var SQLNotifications = require('../../../../sql-notifications');
var MetricsTracker = require('../../../../components/metrics/metrics-tracker');

module.exports = DatasetBaseView.extend({

  initialize: function (opts) {
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._nodeModel = opts.layerDefinitionModel.getAnalysisDefinitionNodeModel();
    this._querySchemaModel = this._nodeModel.querySchemaModel;
    this._queryGeometryModel = this._nodeModel.queryGeometryModel;

    DatasetBaseView.prototype.initialize.call(this, {
      layerDefinitionModel: opts.layerDefinitionModel,
      editorModel: opts.editorModel,
      configModel: opts.configModel,
      querySchemaModel: this._querySchemaModel
    });

    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;
    this._userActions = opts.userActions;
    this._userModel = opts.userModel;
    this._stackLayoutModel = opts.stackLayoutModel;

    this._infoboxModel = new InfoboxModel({
      state: this._isLayerHidden() ? 'layer-hidden' : ''
    });

    this._overlayModel = new Backbone.Model({
      visible: this._isLayerHidden()
    });

    this._tableStats = new TableStats({
      configModel: this._configModel,
      userModel: this._userModel
    });

    this._columnsModel = new DataColumnsModel({}, {
      layerDefinitionModel: this._layerDefinitionModel,
      widgetDefinitionsCollection: this._widgetDefinitionsCollection,
      tableStats: this._tableStats
    });

    SQLNotifications.track(this);

    this._parseSQL = this._internalParseSQL.bind(this, this._afterAlterDataSuccess);

    this._configPanes();
    this._initBinds();
    this._initData();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initData: function () {
    if (this._hasFetchedQuerySchema()) {
      this._onQuerySchemaStatusChange();
    }
  },

  _redirectIfErrors: function () {
    var errors = this._querySchemaModel.get('query_errors');
    if (errors && errors.length > 0) {
      this._showErrors();
      this._editorModel.set({
        edition: true
      });
    }
  },

  _onQuerySchemaChange: function () {
    if (this._hasFetchedQuerySchema()) {
      this._codemirrorModel.set({content: this._querySchemaModel.get('query')});
    }
  },

  _onQuerySchemaStatusChange: function () {
    if (this._hasFetchedQuerySchema()) {
      this._columnsModel.createColumnCollection();
    }
  },

  _hasFetchedQuerySchema: function () {
    return this._querySchemaModel.isFetched();
  },

  _initBinds: function () {
    this.listenTo(this._editorModel, 'change:edition', this._onChangeEdition);
    this.add_related_model(this._editorModel);

    this._querySchemaModel.on('change:query', this._onQuerySchemaChange, this);
    this._querySchemaModel.on('change:status', this._onQuerySchemaStatusChange, this);
    this._querySchemaModel.on('change:query_errors', this._showErrors, this);
    this.add_related_model(this._querySchemaModel);

    this._sqlModel.bind('undo redo', function () {
      this._codemirrorModel.set('content', this._sqlModel.get('content'));
    }, this);
    this.add_related_model(this._sqlModel);
  },

  _runQuery: function (query, callback) {
    this._querySchemaModel.set({
      query: query,
      status: 'unfetched'
    });

    this._queryGeometryModel.set({
      query: query
    });

    SQLNotifications.showNotification({
      status: 'loading',
      info: _t('notifications.sql.applying'),
      closable: false
    });

    var saveSQL = _.after(2, callback);
    this._querySchemaModel.fetch({ success: saveSQL });
    this._queryGeometryModel.fetch({ complete: saveSQL });
  },

  _saveSQL: function () {
    var query = this._codemirrorModel.get('content');

    this._sqlModel.set('content', query);
    this._userActions.saveAnalysisSourceQuery(query, this._nodeModel, this._layerDefinitionModel);
    this._querySchemaModel.set('query_errors', []);

    SQLNotifications.showNotification({
      status: 'success',
      info: _t('notifications.sql.success'),
      closable: true
    });

    this._checkClearButton();

    MetricsTracker.track('Applied sql', {
      node_id: this._nodeModel.get('id'),
      sql: this._nodeModel.get('query')
    });
  },

  _isQueryAlreadyApplied: function (query) {
    var history = this._sqlModel.getUndoHistory();
    var last = _.last(history);
    return last && last.content && last.content.toLowerCase() === query.toLowerCase();
  },

  _updateVisNotification: function () {
    SQLNotifications.showNotification({
      status: 'success',
      info: _t('notifications.sql.success'),
      closable: true
    });
  },

  _defaultSQL: function () {
    return SQLUtils.getDefaultSQL(
      this._layerDefinitionModel.getTableName(),
      this._layerDefinitionModel.get('user_name') || this._userModel.get('username'),
      this._userModel.isInsideOrg()
    );
  },

  _afterAlterDataSuccess: function () {
    var originalQuery = this._defaultSQL();
    this._userActions.saveAnalysisSourceQuery(originalQuery, this._nodeModel, this._layerDefinitionModel);
  },

  _hasAnalysisApplied: function () {
    return this._nodeModel.get('type') !== 'source';
  },

  _onChangeEdition: function () {
    var edition = this._editorModel.get('edition');
    var index = edition ? 1 : 0;

    this._infoboxState();
    this._collectionPane.at(index).set({ selected: true });
  },

  _configPanes: function () {
    var self = this;
    var tabPaneTabs = [{
      selected: !this._editorModel.get('edition'),
      createContentView: function () {
        return new ScrollView({
          createContentView: function () {
            return new DataContentView({
              className: 'Editor-content',
              stackLayoutModel: self._stackLayoutModel,
              widgetDefinitionsCollection: self._widgetDefinitionsCollection,
              columnsModel: self._columnsModel,
              querySchemaModel: self._querySchemaModel,
              queryGeometryModel: self._queryGeometryModel,
              userActions: self._userActions,
              infoboxModel: self._infoboxModel,
              overlayModel: self._overlayModel
            });
          }
        });
      },
      createActionView: function () {
        return new CoreView();
      }
    }, {
      selected: this._editorModel.get('edition'),
      createContentView: function () {
        return new DataSQLView({
          layerDefinitionModel: self._layerDefinitionModel,
          querySchemaModel: self._querySchemaModel,
          codemirrorModel: self._codemirrorModel,
          onApplyEvent: self._parseSQL
        });
      },
      createActionView: function () {
        var isAnalysis = self._hasAnalysisApplied();
        if (!isAnalysis) {
          self._checkClearButton();
          return new UndoButtons({
            trackModel: self._sqlModel,
            editorModel: self._editorModel,
            clearModel: self._clearSQLModel,
            applyButton: true,
            clearButton: true,
            onApplyClick: self._parseSQL,
            onClearClick: self._clearSQL.bind(self)
          });
        }
      }
    }];

    this._collectionPane = new TabPaneCollection(tabPaneTabs);
  },

  _confirmReadOnly: function () {
    this._infoboxModel.set({state: ''});
  },

  _initViews: function () {
    var self = this;

    var infoboxSstates = [
      {
        state: 'readonly',
        createContentView: function () {
          return Infobox.createConfirm({
            type: 'code',
            title: _t('editor.data.messages.sql-readonly.title'),
            body: _t('editor.data.messages.sql-readonly.body'),
            confirmLabel: _t('editor.data.messages.sql-readonly.accept')
          });
        },
        mainAction: self._confirmReadOnly.bind(self)
      }, {
        state: 'layer-hidden',
        createContentView: function () {
          return Infobox.createConfirm({
            type: 'alert',
            title: _t('editor.style.messages.layer-hidden.title'),
            body: _t('editor.style.messages.layer-hidden.body'),
            confirmLabel: _t('editor.style.messages.layer-hidden.show'),
            confirmType: 'secondary',
            confirmPosition: 'right'
          });
        },
        mainAction: self._showHiddenLayer.bind(self)
      }, {
        state: 'no-data',
        createContentView: function () {
          return Infobox.createInfo({
            type: 'alert',
            title: _t('editor.data.messages.empty-data.title'),
            body: _t('editor.data.messages.empty-data.body')
          });
        },
        mainAction: self._confirmReadOnly.bind(self)
      }
    ];

    var infoboxCollection = new InfoboxCollection(infoboxSstates);

    var panelWithOptionsView = new PanelWithOptionsView({
      className: 'Editor-content',
      editorModel: self._editorModel,
      infoboxModel: self._infoboxModel,
      infoboxCollection: infoboxCollection,
      createContentView: function () {
        return new TabPaneView({
          collection: self._collectionPane
        });
      },
      createControlView: function () {
        return new Toggler({
          editorModel: self._editorModel,
          labels: [_t('editor.data.data-toggle.values'), _t('editor.data.data-toggle.cartocss')]
        });
      },
      createActionView: function () {
        return new TabPaneView({
          collection: self._collectionPane,
          createContentKey: 'createActionView'
        });
      }
    });

    this.$el.append(panelWithOptionsView.render().el);
    this.addView(panelWithOptionsView);

    // TOFIX
    // If there are errors in the SQL, open the sql editor by default
    // we defer it to not interfere with the high order tabpane item selection
    setTimeout(this._redirectIfErrors.bind(this), 0);
  },

  _infoboxState: function () {
    var edition = this._editorModel.get('edition');
    var isAnalysis = this._hasAnalysisApplied();

    if (edition && isAnalysis) {
      this._codemirrorModel.set({readonly: true});
      this._infoboxModel.set({state: 'readonly'});
    } else if (!edition && this._isLayerHidden()) {
      this._infoboxModel.set({state: 'layer-hidden'});
      this._overlayModel.set({visible: true});
    } else {
      this._codemirrorModel.set({readonly: false});
      this._infoboxModel.set({state: ''});
      this._overlayModel.set({visible: false});
    }
  },

  _showHiddenLayer: function () {
    this._layerDefinitionModel.toggleVisible();
    this._userActions.saveLayer(this._layerDefinitionModel);

    this._infoboxState();
  },

  _isLayerHidden: function () {
    return this._layerDefinitionModel.get('visible') === false;
  }
});
