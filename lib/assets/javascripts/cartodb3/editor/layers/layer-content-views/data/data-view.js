var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var PanelWithOptionsView = require('../../../components/view-options/panel-with-options-view');
var ScrollView = require('../../../../components/scroll/scroll-view');
var DataContentView = require('./data-content-view');
var DataSQLView = require('./data-sql-view');
var TabPaneView = require('../../../../components/tab-pane/tab-pane-view');
var TabPaneCollection = require('../../../../components/tab-pane/tab-pane-collection');
var Toggler = require('../../../components/toggler/toggler-view');
var UndoButtons = require('../../../components/undo-redo/undo-redo-view');
var Infobox = require('../../../../components/infobox/infobox-factory');
var InfoboxModel = require('../../../../components/infobox/infobox-model');
var InfoboxCollection = require('../../../../components/infobox/infobox-collection');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._configModel = opts.configModel;
    this._modals = opts.modals;
    this._editorModel = opts.editorModel;
    this._nodeModel = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();
    this._querySchemaModel = this._nodeModel.querySchemaModel;

    this._codemirrorModel = new Backbone.Model({
      content: this._nodeModel.get('query'),
      readonly: false
    });

    this._sqlModel = this._layerDefinitionModel.sqlModel;
    this._infoboxModel = new InfoboxModel({
      state: ''
    });

    this._configPanes();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this._editorModel, 'change:edition', this._onChangeEdition);
    this.add_related_model(this._editorModel);

    this._querySchemaModel.on('change:query_errors', this._showErrors, this);
    this.add_related_model(this._querySchemaModel);

    this._sqlModel.bind('undo redo', function () {
      this._codemirrorModel.set('content', this._sqlModel.get('content'));
    }, this);
    this.add_related_model(this._sqlModel);
  },

  _parseSQL: function () {
    var self = this;
    var content = this._codemirrorModel.get('content');

    // Parser errors SQL here and saving
    this._querySchemaModel.set({
      query: content
    });

    this._querySchemaModel.fetch({
      success: self._saveSQL.bind(self)
    });
  },

  _showErrors: function (model) {
    var errors = this._querySchemaModel.get('query_errors');
    this._codemirrorModel.set('errors', this._parseErrors(errors));
  },

  _parseErrors: function (errors) {
    return errors.map(function (error) {
      return {
        message: error
      };
    });
  },

  _saveSQL: function () {
    var content = this._codemirrorModel.get('content');
    this._nodeModel.set('query', content);
    this._sqlModel.set('content', content);
    this._layerDefinitionModel.save();
    this._nodeModel.save();
    this._querySchemaModel.set('query_errors', []);
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
              layerDefinitionModel: self._layerDefinitionModel,
              modals: self._modals,
              configModel: self._configModel,
              editorModel: self._editorModel
            });
          }
        });
      },
      createActionView: function () {
        return new UndoButtons({
          trackModel: self._sqlModel,
          editorModel: self._editorModel,
          applyButton: false
        });
      }
    }, {
      selected: this._editorModel.get('edition'),
      createContentView: function () {
        return new DataSQLView({
          layerDefinitionModel: self._layerDefinitionModel,
          codemirrorModel: self._codemirrorModel,
          onApplyEvent: self._parseSQL.bind(self)
        });
      },
      createActionView: function () {
        var isAnalysis = self._hasAnalysisApplied();
        if (!isAnalysis) {
          return new UndoButtons({
            trackModel: self._sqlModel,
            editorModel: self._editorModel,
            applyButton: true,
            onApplyClick: self._parseSQL.bind(self)
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
            type: 'alert',
            title: _t('editor.data.messages.sql-readonly.title'),
            body: _t('editor.data.messages.sql-readonly.body'),
            confirmLabel: _t('editor.data.messages.sql-readonly.accept')
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
  }

});
