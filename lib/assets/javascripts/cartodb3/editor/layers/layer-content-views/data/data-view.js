var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var PanelWithOptionsView = require('../../../../components/view-options/panel-with-options-view');
var ScrollView = require('../../../../components/scroll/scroll-view');
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
var Notifier = require('../../../../components/notifier/notifier');
var SQLUtils = require('../../../../helpers/sql-utils');
var cdb = require('cartodb.js');
var SQLNotifications = require('../../../../sql-notifications');
var MetricsTracker = require('../../../../components/metrics/metrics-tracker');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');
    if (!opts.userActions) throw new Error('userActions is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._widgetDefinitionsCollection = opts.widgetDefinitionsCollection;

    this._userActions = opts.userActions;
    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this._editorModel = opts.editorModel;
    this._stackLayoutModel = opts.stackLayoutModel;
    this._nodeModel = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();
    this._querySchemaModel = this._nodeModel.querySchemaModel;
    this._queryGeometryModel = this._nodeModel.queryGeometryModel;

    this._clearSQLModel = new Backbone.Model({
      visible: false
    });

    this._sqlModel = this._layerDefinitionModel.sqlModel;

    this._SQL = new cdb.SQL({
      user: this._configModel.get('user_name'),
      sql_api_template: this._configModel.get('sql_api_template'),
      api_key: this._configModel.get('api_key')
    });

    this._infoboxModel = new InfoboxModel({
      state: ''
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

    this._codemirrorModel = new Backbone.Model({
      content: this._querySchemaModel.get('query'),
      readonly: false
    });

    SQLNotifications.track(this);

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

  _parseSQL: function () {
    var appliedQuery = this._querySchemaModel.get('query');
    var currentQuery = this._codemirrorModel.get('content');

    // Remove last character if it has ';'
    if (currentQuery && currentQuery.slice(-1) === ';') {
      currentQuery = currentQuery.slice(0, currentQuery.length - 1);
      this._codemirrorModel.set('content', currentQuery);
    }

    var isSameQuery = SQLUtils.isSameQuery(currentQuery, appliedQuery);
    var altersData = SQLUtils.altersData(currentQuery);

    if (currentQuery === '' || isSameQuery) {
      SQLNotifications.removeNotification();
      return false;
    }

    if (altersData) {
      SQLNotifications.showNotification({
        status: 'loading',
        info: _t('notifications.sql.alter-loading'),
        closable: false
      });

      this._sqlModel.set('content', currentQuery);

      this._SQL.execute(currentQuery, null, {
        success: function () {
          SQLNotifications.showNotification({
            status: 'success',
            info: _t('notifications.sql.alter-success'),
            closable: true,
            delay: Notifier.DEFAULT_DELAY
          });

          this._applyDefaultSQL();
        }.bind(this),
        error: function (errors) {
          errors = errors.responseJSON.error;
          var parsedErrors = this._parseErrors(errors);
          this._codemirrorModel.set('errors', parsedErrors);
          SQLNotifications.showErrorNotification(parsedErrors);
        }.bind(this)
      });
    } else {
      // Parser errors SQL here and saving
      this._querySchemaModel.set({
        status: 'unfetched',
        query: currentQuery
      });

      this._queryGeometryModel.set({
        simple_geom: '',
        query: currentQuery
      });

      SQLNotifications.showNotification({
        status: 'loading',
        info: _t('notifications.sql.applying'),
        closable: false
      });

      var saveSQL = _.after(2, this._saveSQL.bind(this));
      this._querySchemaModel.fetch({ success: saveSQL });
      this._queryGeometryModel.fetch({ complete: saveSQL });
    }
  },

  _showErrors: function (model) {
    var errors = this._querySchemaModel.get('query_errors');
    var hasErrors = errors && errors.length > 0;
    this._codemirrorModel.set('errors', this._parseErrors(errors));
    this._editorModel.set('disabled', hasErrors);

    if (hasErrors) {
      SQLNotifications.showErrorNotification(this._parseErrors(errors));
    }
  },

  _parseErrors: function (errors) {
    return errors.map(function (error) {
      return {
        message: error
      };
    });
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

  _applyDefaultSQL: function () {
    var originalQuery = this._defaultSQL();
    this._codemirrorModel.set({ content: originalQuery });
    this._sqlModel.set('content', originalQuery);
    this._userActions.saveAnalysisSourceQuery(originalQuery, this._nodeModel, this._layerDefinitionModel);
    this._querySchemaModel.set('query_errors', []);
    this._clearSQLModel.set({ visible: false });
    this._querySchemaModel.resetDueToAlteredData();
  },

  _clearSQL: function () {
    var sql = this._defaultSQL();
    this._codemirrorModel.set({content: sql});
    this._parseSQL();
  },

  _checkClearButton: function () {
    var custom_sql = this._codemirrorModel.get('content').toLowerCase();
    var default_sql = this._defaultSQL().toLowerCase();
    this._clearSQLModel.set({visible: custom_sql !== default_sql});
  },

  _defaultSQL: function () {
    var tableName = this._layerDefinitionModel.getTableName();
    tableName = SQLUtils.getUnqualifiedName(tableName);
    var userName = this._layerDefinitionModel.get('user_name');
    var isShared = userName !== undefined && this._configModel.get('user_name') !== userName;
    var query = 'SELECT * FROM ' + tableName;

    if (isShared) {
      query = SQLUtils.prependTableName(query, tableName, userName);
    }
    return query;
  },

  _hasAnalysisApplied: function () {
    return this._nodeModel.get('type') !== 'source';
  },

  _onChangeEdition: function () {
    var edition = this._editorModel.get('edition');
    var isAnalysis = this._hasAnalysisApplied();

    if (edition && isAnalysis) {
      this._codemirrorModel.set({readonly: true});
      this._infoboxModel.set({state: 'readonly'});
    } else {
      this._codemirrorModel.set({readonly: false});
      this._infoboxModel.set({state: ''});
    }

    var index = edition ? 1 : 0;
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
              infoboxModel: self._infoboxModel
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
          onApplyEvent: self._parseSQL.bind(self)
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
            onApplyClick: self._parseSQL.bind(self),
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
      },
      {
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
  }

});
